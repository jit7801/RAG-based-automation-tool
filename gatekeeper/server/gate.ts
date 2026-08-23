// ---------------------------------------------------------------------------
// The gate.
//
// This is the product. Everything upstream — discovery, ingestion, retrieval,
// generation — exists in a dozen other tools. What is missing from those tools
// is a defensible answer to "should this be published with nobody watching?"
//
// Three independent checks, each catching a different failure class:
//
//   evidence     an unverified claim published under your name
//   sensitivity  a cheerful post about something awful
//   novelty      repeating yourself, which reads as automation
//
// Independence is the point. A single classifier deciding everything has one
// failure mode; three narrow checks fail in different directions, and any one
// of them can stop a publish on its own.
//
// Bias: the checks are tuned to over-escalate. A false positive costs a human
// ten seconds. A false negative costs a reputation, and reputational damage is
// not symmetric with a missed post.
// ---------------------------------------------------------------------------

import type {
  CheckResult,
  Claim,
  GateResult,
  GateThresholds,
} from '../shared/contract.ts';
import type { EmbedBackend, Sensitivity } from './swytchcode.ts';

/**
 * Novelty operates on cosine similarity, which is not comparable across
 * embedding spaces. Under a learned embedding a near-duplicate lands around
 * 0.90; under the feature-hashing fallback the same pair lands near 0.49.
 *
 * These are measured against the seed corpus, not guessed:
 *   local   near-duplicate 0.49, closest unrelated post 0.22
 *   openai  near-duplicate ~0.90 (typical for text-embedding-3-small)
 *
 * A single constant cannot serve both. Using the learned-embedding threshold
 * while running on hashes is a silent failure: the check runs, reports a score,
 * and never blocks anything.
 */
const NOVELTY_BLOCK_BY_BACKEND: Record<EmbedBackend, number> = {
  openai: 0.86,
  local: 0.42,
};

export function thresholdsFromEnv(backend: EmbedBackend = 'openai'): GateThresholds {
  const num = (key: string, fallback: number): number => {
    const parsed = Number(process.env[key]);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  // An explicit env override wins; otherwise the threshold follows the backend.
  const noveltyDefault = NOVELTY_BLOCK_BY_BACKEND[backend];
  const noveltyKey = backend === 'local' ? 'GATE_NOVELTY_BLOCK_LOCAL' : 'GATE_NOVELTY_BLOCK';

  return {
    evidenceCoverage: num('GATE_EVIDENCE_COVERAGE', 0.8),
    minIndependentSources: num('GATE_MIN_INDEPENDENT_SOURCES', 2),
    sensitivityBlock: num('GATE_SENSITIVITY_BLOCK', 0.5),
    noveltyBlock: num(noveltyKey, noveltyDefault),
  };
}

// --- check 1: evidence ----------------------------------------------------

/**
 * What share of factual claims are corroborated by at least
 * `minIndependentSources` *distinct publishers*?
 *
 * Distinct publishers, not distinct passages — three quotes from one outlet is
 * one source, and treating it as three is exactly how an unverified rumour ends
 * up published.
 */
export function checkEvidence(claims: Claim[], t: GateThresholds): CheckResult {
  if (claims.length === 0) {
    return {
      id: 'evidence',
      label: 'Evidence',
      verdict: 'block',
      score: 0,
      threshold: t.evidenceCoverage,
      reason: 'The draft contains no attributable factual claims, so nothing could be verified.',
    };
  }

  const supported = claims.filter((c) => c.independentSources >= t.minIndependentSources);
  const coverage = supported.length / claims.length;
  const unsupported = claims.filter((c) => c.independentSources < t.minIndependentSources);

  const verdict: CheckResult['verdict'] =
    coverage >= t.evidenceCoverage
      ? 'pass'
      : coverage >= t.evidenceCoverage * 0.75
        ? 'warn'
        : 'block';

  const reason =
    verdict === 'pass'
      ? `All ${supported.length} of ${claims.length} factual claims are corroborated by at least ${t.minIndependentSources} independent publishers.`
      : `${unsupported.length} of ${claims.length} claims rest on fewer than ${t.minIndependentSources} independent publishers. Publishing would assert something we cannot substantiate.`;

  return {
    id: 'evidence',
    label: 'Evidence',
    verdict,
    score: coverage,
    threshold: t.evidenceCoverage,
    reason,
    detail: {
      totalClaims: claims.length,
      supportedClaims: supported.length,
      unsupportedClaimIds: unsupported.map((c) => c.id),
    },
  };
}

// --- check 2: sensitivity -------------------------------------------------

export function checkSensitivity(s: Sensitivity, t: GateThresholds): CheckResult {
  const verdict: CheckResult['verdict'] =
    s.score >= t.sensitivityBlock
      ? 'block'
      : s.score >= t.sensitivityBlock / 2
        ? 'warn'
        : 'pass';

  const reason =
    verdict === 'pass'
      ? s.reason
      : `${s.reason} A brand account posting about this unprompted is the failure this check exists to prevent.`;

  return {
    id: 'sensitivity',
    label: 'Sensitivity',
    verdict,
    score: s.score,
    threshold: t.sensitivityBlock,
    reason,
    detail: {
      categories: s.categories,
      classifier: s.lexical ? 'lexicon (fallback)' : 'model',
    },
  };
}

// --- check 3: novelty -----------------------------------------------------

/**
 * How close is this draft to something already published? Retrieval over our
 * own back catalogue — which is why a vector store is structurally required
 * here rather than decorative. The catalogue does not fit in a context window,
 * and grows every day the system runs.
 */
export function checkNovelty(
  nearest: { score: number; topic: string | null; publishedAt: string | null },
  t: GateThresholds,
): CheckResult {
  const verdict: CheckResult['verdict'] =
    nearest.score >= t.noveltyBlock
      ? 'block'
      : nearest.score >= t.noveltyBlock - 0.1
        ? 'warn'
        : 'pass';

  let reason: string;
  if (verdict === 'pass') {
    reason = nearest.topic
      ? `Closest previous post is ${pct(nearest.score)} similar ("${nearest.topic}") — distinct enough to be worth saying.`
      : 'Nothing published yet, so there is nothing to repeat.';
  } else if (verdict === 'warn') {
    reason = `Substantially overlaps a post from ${when(nearest.publishedAt)} ("${nearest.topic}") at ${pct(nearest.score)} similarity.`;
  } else {
    reason = `Near-duplicate of a post from ${when(nearest.publishedAt)} ("${nearest.topic}") at ${pct(nearest.score)} similarity. Publishing it would read as an account on autopilot.`;
  }

  return {
    id: 'novelty',
    label: 'Novelty',
    verdict,
    score: nearest.score,
    threshold: t.noveltyBlock,
    reason,
    detail: { nearestTopic: nearest.topic, nearestPublishedAt: nearest.publishedAt },
  };
}

// --- decision -------------------------------------------------------------

/**
 * Any single block escalates. A warn publishes but is recorded — otherwise the
 * system escalates so often that it stops being automatic, which would fail the
 * brief's actual requirement.
 */
export function decide(checks: CheckResult[]): GateResult {
  const blocking = checks.filter((c) => c.verdict === 'block');
  const warning = checks.filter((c) => c.verdict === 'warn');

  if (blocking.length > 0) {
    const names = blocking.map((c) => c.label.toLowerCase()).join(' and ');
    return {
      decision: 'escalate',
      checks,
      reason: `Held for review: ${names} ${blocking.length === 1 ? 'check' : 'checks'} failed. ${blocking[0].reason}`,
    };
  }

  if (warning.length > 0) {
    return {
      decision: 'publish',
      checks,
      reason: `Published with a note: ${warning.map((c) => c.label.toLowerCase()).join(', ')} came in below target but above the blocking threshold.`,
    };
  }

  return {
    decision: 'publish',
    checks,
    reason: 'All three checks cleared. Published without human involvement.',
  };
}

// --- formatting helpers ---------------------------------------------------

const pct = (n: number): string => `${Math.round(n * 100)}%`;

function when(iso: string | null): string {
  if (!iso) return 'an earlier date';
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}
