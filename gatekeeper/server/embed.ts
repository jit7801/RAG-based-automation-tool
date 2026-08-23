// ---------------------------------------------------------------------------
// Local embedding fallback.
//
// When Swytchcode (and therefore OpenAI embeddings) is unreachable, we still
// need vectors — novelty detection and retrieval are load-bearing parts of the
// gate, and a demo that silently skips them would be dishonest.
//
// This is feature hashing: tokens are hashed into a fixed-width vector and the
// result is L2-normalised, so cosine similarity is meaningful. It is a real
// vector representation, just a weaker one than a learned embedding — it keys
// on lexical overlap rather than semantics. Every run that uses it is labelled
// DEGRADED in the UI. We do not claim these are OpenAI embeddings.
// ---------------------------------------------------------------------------

export const EMBED_DIMS = 512;

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'has', 'had',
  'was', 'were', 'are', 'been', 'being', 'its', 'it', 'as', 'at', 'by', 'of',
  'on', 'in', 'to', 'a', 'an', 'is', 'be', 'or', 'but', 'not', 'they', 'their',
  'them', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'said', 'says', 'also',
  'more', 'than', 'into', 'over', 'after', 'before', 'about', 'which', 'who',
]);

/** FNV-1a. Deterministic across runs, which keeps demos reproducible. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Hash unigrams and bigrams into a normalised vector. Bigrams give the
 * representation a little word-order sensitivity, which meaningfully improves
 * the novelty check — "costs fell" and "costs rose" share every unigram.
 */
export function embedLocal(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array<number>(EMBED_DIMS).fill(0);

  for (const t of tokens) {
    vec[hash(t) % EMBED_DIMS] += 1;
  }
  for (let i = 0; i < tokens.length - 1; i++) {
    vec[hash(`${tokens[i]}_${tokens[i + 1]}`) % EMBED_DIMS] += 0.7;
  }

  return normalise(vec);
}

export function normalise(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const mag = Math.sqrt(sum);
  if (mag === 0) return vec;
  return vec.map((v) => v / mag);
}

/** Both vectors are expected to be L2-normalised, so this is plain dot product. */
export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  // Clamp: float drift can push an identical pair marginally past 1.
  return Math.max(-1, Math.min(1, dot));
}

/** Split prose into sentences. Used to align generated claims with the body. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// --- corroboration --------------------------------------------------------
//
// Whole-passage cosine is the wrong tool for asking "do these two passages
// assert the same fact?". We measured it on the seed corpus: paraphrases of the
// same fact from different publishers score 0.33 at best, with a median of 0.09
// across cross-publisher pairs — indistinguishable from unrelated text, because
// cosine is diluted by all the words the two passages do not share.
//
// Overlap of *distinctive* terms separates cleanly instead. Two outlets
// reporting the same event reuse the specific nouns and numbers ("lease rates",
// "quantisation", "fourteen"); unrelated passages share only common vocabulary.
// Measured on the seed corpus: 3-5 shared terms within a topic, at most 2
// across topics. Hence MIN_SHARED_TERMS = 3.
//
// This is a lexical test, not a semantic one, and it is only used when the
// model is unreachable. When OpenAI is live the model reports its own
// attribution and this is not consulted.

/**
 * Terms specific enough to be evidence of shared subject matter.
 *
 * Hyphenated compounds are split into their parts. Two outlets describing the
 * same pricing change wrote "instance-hour pricing" and "instance-rental model";
 * as whole tokens those share nothing, while the concept they share is plainly
 * "instance". `tokenize` keeps hyphens because the compound is informative for
 * embedding, so the split happens here rather than there.
 *
 * Parts only, not parts plus compound: the measured noise ceiling across
 * unrelated topics is 2 shared terms, and counting a compound twice would push
 * some unrelated pairs to 3 and start manufacturing corroboration.
 */
export function distinctiveTerms(text: string): Set<string> {
  const out = new Set<string>();

  for (const token of tokenize(text)) {
    if (token.includes('-')) {
      for (const part of token.split('-')) {
        if (part.length > 3) out.add(part);
      }
    } else if (token.length > 3) {
      out.add(token);
    }
  }

  return out;
}

export const MIN_SHARED_TERMS = 3;

/**
 * Terms shared by two passages. Length is the corroboration signal; the terms
 * themselves are surfaced in the UI so a reviewer can see *why* two sources
 * were treated as agreeing, rather than taking a number on trust.
 */
export function sharedTerms(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const t of a) if (b.has(t)) out.push(t);
  return out.sort();
}
