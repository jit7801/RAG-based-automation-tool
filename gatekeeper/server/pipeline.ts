// ---------------------------------------------------------------------------
// Pipeline Orchestrator
//
// Coordinates the 6-step autonomous publishing workflow:
//   1. discover  Find current trends (Jina / live web or seed corpus)
//   2. ingest    Chunk & embed sources into Weaviate / Vector Store
//   3. retrieve  Retrieve top-k grounded passages for the topic
//   4. draft     Draft post with sentence-by-sentence claim attribution
//   5. gate      Evaluate Evidence, Sensitivity, and Novelty checks
//   6. act       Auto-publish to #content or escalate to #content-review
// ---------------------------------------------------------------------------

import { emit, now } from './bus.ts';
import { embedLocal, sentences, tokenize } from './embed.ts';
import {
  checkEvidence,
  checkNovelty,
  checkSensitivity,
  decide,
  thresholdsFromEnv,
} from './gate.ts';
import { SEED_PUBLISHED } from './seed.ts';
import {
  addPublished,
  addRun,
  getPassage,
  publishedCount,
  putDoc,
  putPassage,
  updateRun,
  type StoredPassage,
} from './store.ts';
import {
  classifySensitivity,
  discoverTrends,
  draftPost,
  embed,
  embedBackend,
  escalate,
  nearestPublished,
  publishPost,
  queryPassages,
  resetDegraded,
  upsertPassages,
  wasDegraded,
  type Ctx,
  type DraftedPost,
} from './swytchcode.ts';
import type {
  Claim,
  Draft,
  RunOutcome,
  RunRecord,
  RunTrigger,
  StepId,
  Trend,
} from '../shared/contract.ts';

export interface PipelineParams {
  trigger: RunTrigger;
  trendId?: string;
  query?: string;
}

// --- attribution matching -------------------------------------------------

/**
 * Match a body sentence to the attribution entry the writer supplied for it.
 *
 * Exact string equality is too brittle: models reformat whitespace, drop a
 * trailing clause, or return the sentence with different punctuation. Substring
 * matching on a fixed prefix is too loose in the other direction — two sentences
 * that open the same way get conflated.
 *
 * So: exact match, then containment, then Jaccard overlap on content tokens with
 * a floor. The floor matters. Below it we return nothing and the sentence is
 * recorded as unsupported, which is the safe direction to fail in.
 */
const MATCH_FLOOR = 0.34;

function matchAttribution(
  sentence: string,
  attribution: DraftedPost['attribution'],
): DraftedPost['attribution'][number] | undefined {
  if (!attribution || attribution.length === 0) return undefined;

  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const target = norm(sentence);

  const exact = attribution.find((a) => norm(a.sentence) === target);
  if (exact) return exact;

  const contained = attribution.find((a) => {
    const c = norm(a.sentence);
    return c.length > 20 && (c.includes(target) || target.includes(c));
  });
  if (contained) return contained;

  const targetTokens = new Set(tokenize(sentence));
  if (targetTokens.size === 0) return undefined;

  let best: { entry: DraftedPost['attribution'][number]; score: number } | undefined;
  for (const a of attribution) {
    const candidate = new Set(tokenize(a.sentence));
    if (candidate.size === 0) continue;
    let shared = 0;
    for (const t of targetTokens) if (candidate.has(t)) shared++;
    const union = targetTokens.size + candidate.size - shared;
    const score = union === 0 ? 0 : shared / union;
    if (score > (best?.score ?? 0)) best = { entry: a, score };
  }

  return best && best.score >= MATCH_FLOOR ? best.entry : undefined;
}

// --- cold-start history ---------------------------------------------------

/**
 * Load prior published posts so the novelty check has something to retrieve
 * against on a cold start. Without this the first run of a fresh process can
 * never be a repeat, and the novelty check reports "nothing published yet" —
 * which looks like the check does nothing.
 */
export async function seedHistory(): Promise<number> {
  const ctx: Ctx = { runId: 'boot' };
  const bodies = SEED_PUBLISHED.map((p) => p.body);
  const vectors = await embed(ctx, bodies);

  SEED_PUBLISHED.forEach((post, i) => {
    addPublished({
      id: `seed-pub-${i + 1}`,
      topic: post.topic,
      body: post.body,
      vector: vectors[i] ?? embedLocal(post.body),
      publishedAt: new Date(Date.now() - post.daysAgo * 86_400_000).toISOString(),
    });
  });

  resetDegraded('boot');
  return SEED_PUBLISHED.length;
}

// --- concurrency ----------------------------------------------------------
//
// One run at a time. The cron trigger and the operator's Run button can
// otherwise fire together and interleave their events on a single SSE stream,
// which corrupts the pipeline view mid-demo — the worst possible moment.

let running = false;

export function isRunning(): boolean {
  return running;
}

export async function runPipeline(params: PipelineParams): Promise<RunRecord> {
  if (running) {
    throw new Error('A run is already in progress. Wait for it to finish.');
  }
  running = true;

  const runId = `run-${Date.now()}`;
  const ctx: Ctx = { runId };
  resetDegraded(runId);

  const runRecord: RunRecord = {
    runId,
    startedAt: now(),
    trigger: params.trigger,
    degraded: false,
  };
  addRun(runRecord);

  emit({
    type: 'run:start',
    runId,
    trigger: params.trigger,
    at: runRecord.startedAt,
  });

  const stepStart = (step: StepId) => {
    emit({ type: 'step:start', runId, step, at: now() });
  };

  const stepLog = (step: StepId, message: string) => {
    emit({ type: 'step:log', runId, step, message, at: now() });
  };

  const stepDone = (step: StepId, summary: string, ms: number) => {
    emit({ type: 'step:done', runId, step, summary, ms, at: now() });
  };

  const stepFailed = (step: StepId, error: string) => {
    emit({ type: 'step:failed', runId, step, error, at: now() });
  };

  try {
    // =========================================================================
    // STEP 1: DISCOVER
    // =========================================================================
    const step1Start = Date.now();
    stepStart('discover');
    stepLog('discover', `Initiating trend discovery (trigger: ${params.trigger})...`);

    const query = params.query ?? 'emerging technology AI infrastructure';
    const discovered = await discoverTrends(ctx, query);

    let chosen = discovered[0];
    if (params.trendId) {
      const match = discovered.find((t) => t.id === params.trendId);
      if (match) chosen = match;
    }

    if (!chosen) {
      throw new Error('No trends discovered or matched.');
    }

    // Save source docs into store
    for (const docWrap of chosen.docs) {
      putDoc(docWrap.doc);
    }

    const distinctPublishers = [
      ...new Set(chosen.docs.map((d) => d.doc.publisher)),
    ];

    const trend: Trend = {
      id: chosen.id,
      topic: chosen.topic,
      summary: chosen.summary,
      sourceCount: distinctPublishers.length,
      docIds: chosen.docs.map((d) => d.doc.id),
    };

    updateRun(runId, { topic: trend.topic });
    emit({ type: 'trend:selected', runId, trend, at: now() });
    stepLog(
      'discover',
      `Selected topic: "${trend.topic}" from ${distinctPublishers.length} independent publishers (${distinctPublishers.join(', ')}).`,
    );
    stepDone(
      'discover',
      `Identified trend with ${chosen.docs.length} source documents from ${distinctPublishers.length} publishers`,
      Date.now() - step1Start,
    );

    // =========================================================================
    // STEP 2: INGEST
    // =========================================================================
    const step2Start = Date.now();
    stepStart('ingest');
    stepLog('ingest', 'Chunking source documents and generating vector embeddings...');

    const rawPassages: Array<{ id: string; docId: string; publisher: string; text: string }> = [];
    for (const d of chosen.docs) {
      d.passages.forEach((pText, i) => {
        rawPassages.push({
          id: `${d.doc.id}-p${i + 1}`,
          docId: d.doc.id,
          publisher: d.doc.publisher,
          text: pText,
        });
      });
    }

    const passageTexts = rawPassages.map((p) => p.text);
    const vectors = await embed(ctx, passageTexts);

    const storedPassages: StoredPassage[] = rawPassages.map((p, i) => ({
      id: p.id,
      docId: p.docId,
      publisher: p.publisher,
      text: p.text,
      vector: vectors[i] ?? embedLocal(p.text),
    }));

    for (const sp of storedPassages) {
      putPassage(sp);
    }

    await upsertPassages(ctx, storedPassages);
    stepLog('ingest', `Embedded and stored ${storedPassages.length} passages into Weaviate index.`);
    stepDone(
      'ingest',
      `Indexed ${storedPassages.length} passages across ${chosen.docs.length} documents`,
      Date.now() - step2Start,
    );

    // =========================================================================
    // STEP 3: RETRIEVE
    // =========================================================================
    const step3Start = Date.now();
    stepStart('retrieve');
    stepLog('retrieve', `Querying vector store for passages semantically grounded in "${trend.topic}"...`);

    // The embedding space is settled once step 2 has run, so gate thresholds can
    // now be resolved against it. Novelty in particular is meaningless without
    // knowing which space its cosine scores live in.
    const backend = embedBackend(runId);
    const thresholds = thresholdsFromEnv(backend);
    stepLog(
      'retrieve',
      `Embedding backend: ${backend === 'local' ? 'local feature hashing (fallback)' : 'OpenAI text-embedding-3-small'}. Novelty blocks at ${thresholds.noveltyBlock.toFixed(2)} in this space.`,
    );

    const [topicVector] = await embed(ctx, [`${trend.topic}. ${trend.summary}`]);
    const retrieved = await queryPassages(
      ctx,
      topicVector ?? embedLocal(trend.topic),
      8,
      trend.docIds,
    );

    emit({ type: 'passages', runId, passages: retrieved, at: now() });

    const retrievedPublishers = [
      ...new Set(retrieved.map((p) => getPassage(p.id)?.publisher).filter(Boolean)),
    ];
    stepLog(
      'retrieve',
      retrieved.length === 0
        ? 'Retrieved nothing — the store is empty for this query.'
        : `Retrieved ${retrieved.length} passages from ${retrievedPublishers.length} publisher${retrievedPublishers.length === 1 ? '' : 's'}, top score ${(retrieved[0]?.score ?? 0).toFixed(3)}.`,
    );
    stepDone(
      'retrieve',
      `${retrieved.length} passages from ${retrievedPublishers.length} publisher${retrievedPublishers.length === 1 ? '' : 's'}`,
      Date.now() - step3Start,
    );

    // =========================================================================
    // STEP 4: DRAFT
    // =========================================================================
    const step4Start = Date.now();
    stepStart('draft');
    stepLog('draft', 'Synthesizing professional draft with sentence-level claim attribution...');

    const drafted = await draftPost(ctx, trend.topic, retrieved);
    const rawSentences = sentences(drafted.body);

    // -----------------------------------------------------------------------
    // Claim construction.
    //
    // A sentence gets exactly the passages its writer said support it. If the
    // writer attributed nothing, the sentence is still recorded as a claim —
    // with zero sources — so the evidence check sees it and the UI can mark it
    // unsupported.
    //
    // What we deliberately do NOT do is substitute the top retrieved passages
    // when attribution is missing. Those passages usually come from two
    // different publishers, so the substitution would push independentSources
    // to 2 and quietly satisfy the evidence check for a sentence nothing
    // actually supports. That inverts the entire point of the gate, and a judge
    // clicking one citation in the Evidence Panel would find a source that does
    // not contain the claim.
    // -----------------------------------------------------------------------
    let unknownCitations = 0;

    const claims: Claim[] = rawSentences.map((sent, i) => {
      const matched = matchAttribution(sent, drafted.attribution);
      const cited = matched?.passageIds ?? [];

      // Only count passages that exist. A model citing an id we never supplied
      // is a real failure mode, so it is counted and surfaced, not ignored.
      const publishers = new Set<string>();
      for (const pid of cited) {
        const storedP = getPassage(pid);
        if (storedP) publishers.add(storedP.publisher);
        else unknownCitations++;
      }
      const verifiedIds = cited.filter((pid) => getPassage(pid));

      const independentSources = publishers.size;
      const need = thresholds.minIndependentSources;
      const confidence =
        independentSources >= need
          ? 0.95
          : independentSources === 0
            ? 0
            : 0.4 + 0.25 * (independentSources / need);

      return {
        id: `claim-${i + 1}`,
        text: sent,
        passageIds: verifiedIds,
        independentSources,
        confidence,
      };
    });

    const corroborated = claims.filter(
      (c) => c.independentSources >= thresholds.minIndependentSources,
    );

    const draft: Draft = {
      id: `draft-${Date.now()}`,
      topic: trend.topic,
      body: drafted.body,
      claims,
      createdAt: now(),
    };

    updateRun(runId, { draft });
    emit({ type: 'draft', runId, draft, at: now() });

    stepLog(
      'draft',
      drafted.templated
        ? `Model unreachable — draft assembled from passages by the local template writer (${draft.body.split(/\s+/).length} words).`
        : `Model returned a draft of ${draft.body.split(/\s+/).length} words.`,
    );

    // Show the corroboration working, per claim, rather than only a total.
    for (const c of claims) {
      const pubs = [
        ...new Set(
          c.passageIds.map((pid) => getPassage(pid)?.publisher).filter(Boolean),
        ),
      ];
      stepLog(
        'draft',
        pubs.length > 0
          ? `  claim ${c.id}: ${pubs.length} publisher${pubs.length === 1 ? '' : 's'} (${pubs.join(', ')})`
          : `  claim ${c.id}: no supporting passage cited — will count as unsupported`,
      );
    }

    if (unknownCitations > 0) {
      stepLog(
        'draft',
        `${unknownCitations} citation${unknownCitations === 1 ? '' : 's'} referenced a passage id that was never supplied, and were discarded.`,
      );
    }

    stepDone(
      'draft',
      `${claims.length} claims, ${corroborated.length} corroborated by ${thresholds.minIndependentSources}+ publishers`,
      Date.now() - step4Start,
    );

    // =========================================================================
    // STEP 5: GATE
    // =========================================================================
    const step5Start = Date.now();
    stepStart('gate');
    stepLog('gate', 'Evaluating draft against 3 independent safety, verification, and novelty checks...');

    // Check 1: Evidence coverage
    const evidenceResult = checkEvidence(draft.claims, thresholds);
    stepLog('gate', `[Evidence Check] ${evidenceResult.verdict.toUpperCase()}: ${evidenceResult.reason}`);

    // Check 2: Sensitivity analysis
    const contextText = retrieved.map((p) => p.text).join(' ');
    const sensitivity = await classifySensitivity(ctx, trend.topic, contextText);
    const sensitivityResult = checkSensitivity(sensitivity, thresholds);
    stepLog('gate', `[Sensitivity Check] ${sensitivityResult.verdict.toUpperCase()}: ${sensitivityResult.reason}`);

    // Check 3: Novelty back-catalogue check (Load-bearing RAG)
    const [rawBodyVector] = await embed(ctx, [draft.body]);
    const bodyVector = rawBodyVector ?? embedLocal(draft.body);
    const nearest = await nearestPublished(ctx, bodyVector);
    stepLog(
      'gate',
      `Compared against ${publishedCount()} previously published posts. Closest: ${nearest.score.toFixed(3)}${nearest.topic ? ` ("${nearest.topic}")` : ''}.`,
    );
    const noveltyResult = checkNovelty(nearest, thresholds);
    stepLog('gate', `[Novelty Check] ${noveltyResult.verdict.toUpperCase()}: ${noveltyResult.reason}`);

    const gateResult = decide([evidenceResult, sensitivityResult, noveltyResult]);
    updateRun(runId, { gate: gateResult });
    emit({ type: 'gate', runId, gate: gateResult, at: now() });

    stepDone(
      'gate',
      `Decision: ${gateResult.decision.toUpperCase()} (${gateResult.checks.filter((c) => c.verdict === 'pass').length}/3 checks passed)`,
      Date.now() - step5Start,
    );

    // =========================================================================
    // STEP 6: ACT
    // =========================================================================
    const step6Start = Date.now();
    stepStart('act');

    let outcome: RunOutcome;
    if (gateResult.decision === 'publish') {
      stepLog('act', 'All checks cleared. Auto-publishing post to #content...');
      await publishPost(ctx, draft.body);

      // Save to published history & vector store so future runs check against it
      addPublished({
        id: `pub-${Date.now()}`,
        topic: draft.topic,
        body: draft.body,
        vector: bodyVector,
        publishedAt: now(),
      });

      outcome = 'published';
      stepLog('act', 'Post published to #content and indexed into novelty back-catalogue.');
      stepDone('act', 'Auto-published to #content', Date.now() - step6Start);
    } else {
      stepLog('act', `Gate blocked auto-publishing. Escalating to #content-review for human decision...`);
      const escalationMsg = `⚠️ [GATE ESCALATION] Post on "${draft.topic}" held for human review.\nReason: ${gateResult.reason}\n\nDraft:\n${draft.body}`;
      await escalate(ctx, escalationMsg);

      outcome = 'escalated';
      stepLog('act', 'Escalation alert posted to #content-review channel. Awaiting reviewer decision.');
      stepDone('act', `Escalated to human reviewer (${gateResult.reason})`, Date.now() - step6Start);
    }

    const degraded = wasDegraded(runId);
    const finishedAt = now();
    const updated = updateRun(runId, {
      outcome,
      finishedAt,
      degraded,
    })!;

    emit({
      type: 'run:end',
      runId,
      outcome,
      degraded,
      at: finishedAt,
    });

    return updated;
  } catch (err) {
    const errorMsg = (err as Error).message || 'Pipeline execution failed';
    stepFailed('act', errorMsg);

    const degraded = wasDegraded(runId);
    const finishedAt = now();
    const updated = updateRun(runId, {
      outcome: 'failed',
      finishedAt,
      degraded,
    })!;

    emit({
      type: 'run:end',
      runId,
      outcome: 'failed',
      degraded,
      at: finishedAt,
    });

    return updated;
  } finally {
    running = false;
  }
}
