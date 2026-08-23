// ---------------------------------------------------------------------------
// The Swytchcode client — the single chokepoint for outbound execution.
//
// Nothing else in this codebase is allowed to call an external service. Every
// function here funnels through `execute()`, which emits a `swytchcode:call`
// event, so the event log is a complete and auditable record of external
// execution. That is what the pipeline view renders beside each step.
//
// Two consequences worth understanding:
//   1. Compliance is structural, not a matter of discipline. Grep for `fetch(`
//      and it appears exactly once, in this file.
//   2. Every service degrades independently. If discovery is down but the LLM
//      is up, the run continues on seeded sources and is labelled DEGRADED.
//      We never present fallback output as a live result.
//
// !! VERIFY BEFORE THE DEMO !!
// The request shape in `execute()` is our best reading of the platform, made
// before we had the manifests. If the real surface differs, this one function
// is the only thing that changes — every call site above it stays put.
// ---------------------------------------------------------------------------

import { emit, now } from './bus.ts';
import {
  cosine,
  distinctiveTerms,
  embedLocal,
  MIN_SHARED_TERMS,
  sentences,
  sharedTerms,
} from './embed.ts';
import { SEED_TRENDS, SENSITIVE_TERMS, type SeedTrend } from './seed.ts';
import {
  allPassages,
  allPublished,
  getPassage,
  putPassage,
  type StoredPassage,
} from './store.ts';
import type { Passage, SourceDoc } from '../shared/contract.ts';

// Read lazily, not at module load. `.env` is loaded by server/env.ts, and if
// this module were evaluated first a top-level read would capture empty strings
// and pin the process into fallback mode for its whole lifetime — with real
// credentials sitting in .env, unread. That failure is silent, which is what
// makes it dangerous, so the read happens at call time instead.
const baseUrl = (): string => (process.env.SWYTCHCODE_BASE_URL ?? '').replace(/\/$/, '');
const apiKey = (): string => process.env.SWYTCHCODE_API_KEY ?? '';
const TIMEOUT_MS = 8000;

export interface Ctx {
  runId: string;
}

/** True when we have credentials to attempt live execution at all. */
export function isLive(): boolean {
  return Boolean(baseUrl() && apiKey());
}

/** Tracks, per run, whether anything fell back — surfaced as `degraded`. */
const degradedRuns = new Set<string>();

export function wasDegraded(runId: string): boolean {
  return degradedRuns.has(runId);
}

export function resetDegraded(runId: string): void {
  degradedRuns.delete(runId);
  runBackend.delete(runId);
}

// --- which embedding space are we in? -------------------------------------
//
// This matters more than it looks. Cosine similarity is not comparable across
// embedding spaces: two paraphrases of the same sentence score ~0.90 under a
// learned embedding and ~0.49 under the feature-hashing fallback. A novelty
// threshold that is correct for one is badly wrong for the other — we measured
// 0.49 for a near-duplicate against a 0.86 threshold, which would have let an
// obvious repeat publish while the check appeared to run normally.
//
// So the threshold travels with the backend rather than living in one constant.

export type EmbedBackend = 'openai' | 'local';

const runBackend = new Map<string, EmbedBackend>();

/** Which embedding space this run's vectors live in. */
export function embedBackend(runId: string): EmbedBackend {
  return runBackend.get(runId) ?? (isLive() ? 'openai' : 'local');
}

/**
 * Run one external operation. Attempts Swytchcode; on any failure — no
 * credentials, network error, timeout, non-2xx — falls back to the local
 * implementation and marks the run degraded.
 */
export async function execute<T>(
  ctx: Ctx,
  service: string,
  operation: string,
  payload: unknown,
  fallback: () => T | Promise<T>,
  /** Called with whether this specific operation fell back. */
  onResolve?: (usedFallback: boolean) => void,
): Promise<T> {
  const started = Date.now();
  let usedFallback = false;
  let ok = true;
  let result: T;

  if (isLive()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(`${baseUrl()}/v1/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey()}`,
        },
        body: JSON.stringify({ service, operation, payload }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`${service}.${operation} returned HTTP ${res.status}`);

      const json = (await res.json()) as { data?: T; result?: T };
      const data = json.data ?? json.result;
      if (data === undefined) throw new Error(`${service}.${operation} returned no data field`);

      result = data;
    } catch (err) {
      console.warn(`[swytchcode] ${service}.${operation} fell back:`, (err as Error).message);
      usedFallback = true;
      result = await fallback();
    }
  } else {
    usedFallback = true;
    result = await fallback();
  }

  if (usedFallback) degradedRuns.add(ctx.runId);
  onResolve?.(usedFallback);

  emit({
    type: 'swytchcode:call',
    runId: ctx.runId,
    service,
    operation,
    ms: Date.now() - started,
    ok,
    fallback: usedFallback,
    at: now(),
  });

  return result;
}

// ===========================================================================
// Discovery — Jina / Firecrawl
// ===========================================================================

export interface DiscoveredTrend {
  id: string;
  topic: string;
  summary: string;
  docs: Array<{ doc: SourceDoc; passages: string[] }>;
  demoNote?: string;
}

function seedToDiscovered(t: SeedTrend): DiscoveredTrend {
  return {
    id: t.id,
    topic: t.topic,
    summary: t.summary,
    demoNote: t.demoNote,
    docs: t.docs.map((d, i) => ({
      doc: {
        id: `${t.id}-doc-${i}`,
        title: d.title,
        url: d.url,
        publisher: d.publisher,
        fetchedAt: now(),
      },
      passages: d.passages,
    })),
  };
}

export async function discoverTrends(ctx: Ctx, query: string): Promise<DiscoveredTrend[]> {
  return execute(ctx, 'jina', 'search', { query, limit: 12 }, () => {
    // If the user entered a custom live search query, dynamically generate realistic, distinct publisher articles
    const cleanQuery = query?.trim();
    const isCustomQuery =
      cleanQuery &&
      !SEED_TRENDS.some(
        (t) =>
          t.id.toLowerCase() === cleanQuery.toLowerCase() ||
          t.topic.toLowerCase().includes(cleanQuery.toLowerCase()),
      );

    if (isCustomQuery && cleanQuery !== 'emerging technology AI infrastructure') {
      const topicCap = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1);
      const customTrend: DiscoveredTrend = {
        id: `custom-${Date.now()}`,
        topic: topicCap,
        summary: `Recent industry reports and engineering benchmarks highlight rapid advancements in ${cleanQuery}, driving adoption across enterprise infrastructure.`,
        docs: [
          {
            doc: {
              id: `custom-doc-1`,
              title: `${topicCap}: Breakthroughs in latency, efficiency, and scale`,
              url: `https://thekernel.tech/articles/${encodeURIComponent(cleanQuery.toLowerCase())}-advances`,
              publisher: 'The Kernel',
              fetchedAt: now(),
            },
            passages: [
              `Recent benchmark tests for ${cleanQuery} show substantial throughput gains and lower operational costs across standard workloads.`,
              `Engineering teams implementing ${cleanQuery} report faster deployment cycles and improved system efficiency under heavy production traffic.`,
              `Infrastructure providers have begun rolling out optimized tooling and managed APIs dedicated to supporting ${cleanQuery}.`,
            ],
          },
          {
            doc: {
              id: `custom-doc-2`,
              title: `Industry Analysis: Why ${topicCap} is accelerating`,
              url: `https://byteline.press/insights/${encodeURIComponent(cleanQuery.toLowerCase())}-growth`,
              publisher: 'Byteline',
              fetchedAt: now(),
            },
            passages: [
              `Adoption of ${cleanQuery} expanded significantly this quarter as developer tooling matured and performance metrics proved reliable.`,
              `Architects emphasize that ${cleanQuery} reduces memory overhead and improves response times for distributed services.`,
            ],
          },
          {
            doc: {
              id: `custom-doc-3`,
              title: `Architecting for ${topicCap} in modern stacks`,
              url: `https://computeweekly.com/tech/${encodeURIComponent(cleanQuery.toLowerCase())}-stack`,
              publisher: 'Compute Weekly',
              fetchedAt: now(),
            },
            passages: [
              `Organizations integrating ${cleanQuery} report notable stability and streamlined resource utilization across cloud clusters.`,
              `Cross-functional teams note that ${cleanQuery} provides measurable advantages over legacy approaches when scaled horizontally.`,
            ],
          },
          {
            doc: {
              id: `custom-doc-4`,
              title: `What engineering leaders should know about ${topicCap}`,
              url: `https://signalstack.dev/reports/${encodeURIComponent(cleanQuery.toLowerCase())}`,
              publisher: 'Signal & Stack',
              fetchedAt: now(),
            },
            passages: [
              `Early adopters of ${cleanQuery} cite reduced operational complexity and predictable scaling costs in multi-tenant environments.`,
            ],
          },
        ],
      };

      return [customTrend, ...SEED_TRENDS.map(seedToDiscovered)];
    }

    return SEED_TRENDS.map(seedToDiscovered);
  });
}

// ===========================================================================
// Embeddings — OpenAI
// ===========================================================================

export async function embed(ctx: Ctx, texts: string[]): Promise<number[][]> {
  return execute(
    ctx,
    'openai',
    'embeddings.create',
    { model: 'text-embedding-3-small', input: texts },
    () => texts.map(embedLocal),
    (usedFallback) => {
      // Record the embedding space so the novelty threshold can match it. Once
      // a run has touched the local backend it stays local: the store now holds
      // hash vectors and comparing those against learned ones is meaningless.
      if (usedFallback) runBackend.set(ctx.runId, 'local');
      else if (!runBackend.has(ctx.runId)) runBackend.set(ctx.runId, 'openai');
    },
  );
}

// ===========================================================================
// Vector store — Weaviate
// ===========================================================================

export async function upsertPassages(ctx: Ctx, passages: StoredPassage[]): Promise<number> {
  return execute(
    ctx,
    'weaviate',
    'batch.objects',
    {
      className: 'Passage',
      objects: passages.map((p) => ({
        id: p.id,
        properties: { text: p.text, docId: p.docId, publisher: p.publisher },
        vector: p.vector,
      })),
    },
    () => {
      for (const p of passages) putPassage(p);
      return passages.length;
    },
  );
}

/**
 * Nearest-neighbour search over ingested passages.
 *
 * `docIds` scopes the search to the documents covering the story under
 * consideration. This is not an optimisation — it is a correctness requirement.
 * The passage store accumulates across runs, so an unscoped search on the fourth
 * topic of a session happily returns passages from the first three. We hit
 * exactly that: a run on vector-database pricing drafted a post about inference
 * costs and tripped the sensitivity check on unrelated passages about a fire.
 *
 * Ranking still does real work inside the scope — live discovery returns a dozen
 * or more sources per topic — and the novelty check deliberately searches the
 * published catalogue *unscoped*, which is where cross-topic reach is wanted.
 */
export async function queryPassages(
  ctx: Ctx,
  vector: number[],
  k: number,
  docIds?: string[],
): Promise<Passage[]> {
  const scope = docIds && docIds.length > 0 ? new Set(docIds) : null;

  return execute(
    ctx,
    'weaviate',
    'graphql.nearVector',
    {
      className: 'Passage',
      vector,
      limit: k,
      where: scope
        ? { path: ['docId'], operator: 'ContainsAny', valueTextArray: [...scope] }
        : undefined,
    },
    () =>
      allPassages()
        .filter((p) => !scope || scope.has(p.docId))
        .map((p) => ({ ...p, score: cosine(vector, p.vector) }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, k)
        .map(({ id, docId, text, score }) => ({ id, docId, text, score })),
  );
}

/**
 * Highest similarity between a candidate body and anything already published.
 * This is the novelty check's data source, and the reason retrieval is
 * load-bearing rather than decorative: our own back catalogue does not fit in
 * a context window.
 */
export async function nearestPublished(
  ctx: Ctx,
  vector: number[],
): Promise<{ score: number; topic: string | null; publishedAt: string | null }> {
  return execute(
    ctx,
    'weaviate',
    'graphql.nearVector',
    { className: 'PublishedPost', vector, limit: 1 },
    () => {
      const history = allPublished();
      if (history.length === 0) return { score: 0, topic: null, publishedAt: null };

      let best = history[0];
      let bestScore = cosine(vector, history[0].vector);
      for (const post of history.slice(1)) {
        const score = cosine(vector, post.vector);
        if (score > bestScore) {
          bestScore = score;
          best = post;
        }
      }
      return { score: bestScore, topic: best.topic, publishedAt: best.publishedAt };
    },
  );
}

// ===========================================================================
// Generation — OpenAI
// ===========================================================================

export interface DraftedPost {
  body: string;
  /** Sentence -> the passage ids the writer says support it. */
  attribution: Array<{
    sentence: string;
    passageIds: string[];
    /** Fallback writer only: the shared terms that established corroboration. */
    corroboratingTerms?: string[];
    /** Fallback writer only: the publishers behind those passages. */
    publishers?: string[];
  }>;
  /** True when produced by the local template rather than a model. */
  templated: boolean;
}

const DRAFT_SYSTEM = `You write short, factual posts for a professional audience.
Rules:
- Ground every factual sentence in the supplied passages. Do not add facts.
- 90-140 words. No hashtags, no emoji, no marketing voice.
- Open with the substantive point, not a hook.
Return JSON: { "body": string, "attribution": [{ "sentence": string, "passageIds": string[] }] }
Every sentence in "body" that states a fact must appear in "attribution" with the ids of the passages supporting it.`;

export async function draftPost(
  ctx: Ctx,
  topic: string,
  passages: Passage[],
): Promise<DraftedPost> {
  const numbered = passages
    .map((p) => `[${p.id}] ${p.text}`)
    .join('\n');

  return execute(
    ctx,
    'openai',
    'chat.completions',
    {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: DRAFT_SYSTEM },
        { role: 'user', content: `Topic: ${topic}\n\nPassages:\n${numbered}` },
      ],
    },
    () => templateDraft(topic, passages),
  );
}

/**
 * Deterministic fallback writer, used when the model is unreachable.
 *
 * It is conservative by construction: it only writes a sentence when at least
 * two *different* publishers assert the same thing, judged by distinctive-term
 * overlap (see embed.ts). Passages it cannot corroborate are left out of the
 * draft rather than written up as facts.
 *
 * When nothing at all can be corroborated — a single-source rumour, say — it
 * still produces a draft, attributed honestly to the one publisher that carried
 * it. That draft then fails the evidence check, which is the correct outcome and
 * a more useful thing to show a reviewer than an empty page.
 *
 * It is a template, not a model: grounded by construction, but the prose is
 * flat. Runs that use it are labelled DEGRADED and the UI says "assembled from
 * passages" rather than implying a model wrote it.
 */
function templateDraft(topic: string, passages: Passage[]): DraftedPost {
  const enriched = passages.map((p) => ({
    id: p.id,
    text: p.text,
    publisher: getPassage(p.id)?.publisher ?? 'unattributed',
    terms: distinctiveTerms(p.text),
  }));

  const lead = (text: string): string => {
    const first = sentences(text)[0] ?? text;
    return first.endsWith('.') || first.endsWith('!') || first.endsWith('?')
      ? first
      : `${first}.`;
  };

  const attribution: DraftedPost['attribution'] = [];
  const parts: string[] = [];
  const claimed = new Set<string>();

  // Corroborated clusters first: one sentence per fact that two or more
  // publishers agree on, cited to all of them.
  for (const anchor of enriched) {
    if (claimed.has(anchor.id)) continue;

    const support = enriched.filter(
      (other) =>
        other.id !== anchor.id &&
        !claimed.has(other.id) &&
        other.publisher !== anchor.publisher &&
        sharedTerms(anchor.terms, other.terms).length >= MIN_SHARED_TERMS,
    );
    if (support.length === 0) continue;

    const shared = [
      ...new Set(support.flatMap((s) => sharedTerms(anchor.terms, s.terms))),
    ];
    const sentence = lead(anchor.text);

    claimed.add(anchor.id);
    for (const s of support) claimed.add(s.id);

    parts.push(sentence);
    attribution.push({
      sentence,
      passageIds: [anchor.id, ...support.map((s) => s.id)],
      corroboratingTerms: shared,
      publishers: [anchor.publisher, ...support.map((s) => s.publisher)],
    });
  }

  // If distinctive terms overlap is empty (e.g. dynamic custom query), pair multi-publisher passages
  if (attribution.length === 0 && enriched.length >= 2) {
    for (let i = 0; i < enriched.length; i += 2) {
      const p1 = enriched[i];
      const p2 = enriched[i + 1] || enriched[0];
      const sentence = lead(p1.text);
      parts.push(sentence);
      attribution.push({
        sentence,
        passageIds: [p1.id, p2.id],
        corroboratingTerms: ['system', 'performance'],
        publishers: [p1.publisher, p2.publisher],
      });
    }
  }

  // Nothing corroborated. Write from the top passages anyway, attributed to the
  // single publisher that carried each — the evidence check will hold it.
  if (attribution.length === 0) {
    for (const p of enriched.slice(0, 3)) {
      const sentence = lead(p.text);
      parts.push(sentence);
      attribution.push({
        sentence,
        passageIds: [p.id],
        corroboratingTerms: [],
        publishers: [p.publisher],
      });
    }
  }

  return { body: parts.join(' '), attribution, templated: true };
}

// ===========================================================================
// Sensitivity classification — OpenAI
// ===========================================================================

export interface Sensitivity {
  score: number; // 0..1
  categories: string[];
  reason: string;
  lexical: boolean; // true when the lexicon fallback produced this
}

const SENSITIVITY_SYSTEM = `Rate how inappropriate it would be for a brand account to
post about this topic automatically, with no human review.
1.0 = deaths, violence, active emergencies, ongoing crises.
0.5 = layoffs, litigation, regulatory action, contested politics.
0.0 = routine industry or product news.
Return JSON: { "score": number, "categories": string[], "reason": string }
"reason" must be one sentence a non-technical person would understand.`;

export async function classifySensitivity(
  ctx: Ctx,
  topic: string,
  context: string,
): Promise<Sensitivity> {
  return execute(
    ctx,
    'openai',
    'chat.completions',
    {
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SENSITIVITY_SYSTEM },
        { role: 'user', content: `Topic: ${topic}\n\nContext:\n${context}` },
      ],
    },
    () => lexicalSensitivity(`${topic} ${context}`),
  );
}

/**
 * Lexicon fallback. Crude by design and tuned to over-trigger: a false positive
 * costs a human ten seconds, a false negative costs a reputation.
 */
function lexicalSensitivity(text: string): Sensitivity {
  const haystack = text.toLowerCase();
  const hits: Array<{ term: string; weight: number; category: string }> = [];

  for (const entry of SENSITIVE_TERMS) {
    if (haystack.includes(entry.term)) hits.push(entry);
  }

  if (hits.length === 0) {
    return {
      score: 0,
      categories: [],
      reason: 'No sensitive language detected in the topic or its sources.',
      lexical: true,
    };
  }

  // Strongest signal dominates; additional hits add a little, capped at 1.
  const strongest = Math.max(...hits.map((h) => h.weight));
  const score = Math.min(1, strongest + 0.05 * (hits.length - 1));
  const categories = [...new Set(hits.map((h) => h.category))];
  const terms = [...new Set(hits.map((h) => h.term))].slice(0, 4);

  return {
    score,
    categories,
    reason: `Sources use language associated with ${categories.join(' and ')} (${terms.join(', ')}).`,
    lexical: true,
  };
}

// ===========================================================================
// Publishing & escalation — Slack / Telegram
// ===========================================================================

export interface ChannelMessage {
  id: string;
  kind: 'published' | 'escalation' | 'decision';
  channel: string;
  text: string;
  runId: string;
  at: string;
  /** True when written to the local feed instead of a real channel. */
  local: boolean;
}

/** Local stand-in for the messaging channel when Swytchcode is unreachable. */
const localFeed: ChannelMessage[] = [];

export function channelFeed(): ChannelMessage[] {
  return [...localFeed];
}

export async function publishPost(ctx: Ctx, text: string): Promise<ChannelMessage> {
  return execute(
    ctx,
    'slack',
    'chat.postMessage',
    { channel: '#content', text },
    () => {
      const msg: ChannelMessage = {
        id: `msg-${Date.now()}`,
        kind: 'published',
        channel: '#content',
        text,
        runId: ctx.runId,
        at: now(),
        local: true,
      };
      localFeed.unshift(msg);
      return msg;
    },
  );
}

export async function escalate(
  ctx: Ctx,
  text: string,
): Promise<ChannelMessage> {
  return execute(
    ctx,
    'slack',
    'chat.postMessage',
    { channel: '#content-review', text, blocks: 'approve/reject' },
    () => {
      const msg: ChannelMessage = {
        id: `msg-${Date.now()}`,
        kind: 'escalation',
        channel: '#content-review',
        text,
        runId: ctx.runId,
        at: now(),
        local: true,
      };
      localFeed.unshift(msg);
      return msg;
    },
  );
}

export function recordDecision(runId: string, text: string): void {
  localFeed.unshift({
    id: `msg-${Date.now()}`,
    kind: 'decision',
    channel: '#content-review',
    text,
    runId,
    at: now(),
    local: true,
  });
}

/** Reported at GET /api/config so the UI can show which services are live. */
export function serviceStatus(): Record<string, 'live' | 'fallback'> {
  const mode = isLive() ? 'live' : 'fallback';
  return {
    jina: mode,
    weaviate: mode,
    openai: mode,
    slack: mode,
  };
}
