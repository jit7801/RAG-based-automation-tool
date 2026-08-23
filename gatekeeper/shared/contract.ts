// ---------------------------------------------------------------------------
// THE CONTRACT
//
// This file is the only agreement between the orchestrator (server/) and the
// interface (src/). Both sides import from here and neither imports from the
// other. If you are working on the frontend you can build every screen against
// these types with mock data, before the backend exists — and vice versa.
//
// Rule: change this file only by agreement. Everything else is yours to edit
// freely within your own directory.
// ---------------------------------------------------------------------------

/** The six pipeline steps, in execution order. */
export const STEPS = ['discover', 'ingest', 'retrieve', 'draft', 'gate', 'act'] as const;
export type StepId = (typeof STEPS)[number];

/** Display metadata for each step. Frontend reads this; backend ignores it. */
export const STEP_META: Record<StepId, { label: string; blurb: string }> = {
  discover: { label: 'Discover', blurb: 'Find what is being talked about right now' },
  ingest:   { label: 'Ingest',   blurb: 'Chunk and embed sources into the knowledge store' },
  retrieve: { label: 'Retrieve', blurb: 'Pull the passages that support this topic' },
  draft:    { label: 'Draft',    blurb: 'Write a post, tying each claim to its evidence' },
  gate:     { label: 'Gate',     blurb: 'Decide whether this is safe to publish unattended' },
  act:      { label: 'Act',      blurb: 'Publish, or escalate to a human' },
};

export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

// --- source material ------------------------------------------------------

export interface SourceDoc {
  id: string;
  title: string;
  url: string;
  /** Used by the evidence check to count *independent* sources. */
  publisher: string;
  fetchedAt: string;
}

export interface Passage {
  id: string;
  docId: string;
  text: string;
  /** Cosine similarity to the query, present only when retrieved. */
  score?: number;
}

export interface Trend {
  id: string;
  topic: string;
  summary: string;
  /** Number of distinct publishers mentioning this topic. */
  sourceCount: number;
  docIds: string[];
}

// --- generated content ----------------------------------------------------

/**
 * One factual assertion in the draft, with its provenance. This is what the
 * Evidence Panel renders and what the evidence check scores.
 */
export interface Claim {
  id: string;
  /** The sentence exactly as it appears in `Draft.body`. */
  text: string;
  passageIds: string[];
  /** Count of distinct publishers among the supporting passages. */
  independentSources: number;
  confidence: number; // 0..1
}

export interface Draft {
  id: string;
  topic: string;
  body: string;
  claims: Claim[];
  createdAt: string;
}

// --- the gate -------------------------------------------------------------

export type CheckId = 'evidence' | 'sensitivity' | 'novelty';
export type CheckVerdict = 'pass' | 'warn' | 'block';

export interface CheckResult {
  id: CheckId;
  label: string;
  verdict: CheckVerdict;
  /** Normalised 0..1. Meaning differs per check; compare against `threshold`. */
  score: number;
  threshold: number;
  /** Human-readable, shown in the UI and sent in the escalation message. */
  reason: string;
  detail?: Record<string, unknown>;
}

export type GateDecision = 'publish' | 'escalate';

export interface GateResult {
  decision: GateDecision;
  checks: CheckResult[];
  /** One-line summary of why this decision was reached. */
  reason: string;
}

// --- runs -----------------------------------------------------------------

export type RunTrigger = 'cron' | 'manual';
export type RunOutcome = 'published' | 'escalated' | 'failed';
export type HumanDecision = 'approved' | 'rejected';

export interface RunRecord {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  trigger: RunTrigger;
  topic?: string;
  draft?: Draft;
  gate?: GateResult;
  outcome?: RunOutcome;
  humanDecision?: HumanDecision;
  /** True if any external call fell back to seeded data. Always surfaced in the UI. */
  degraded: boolean;
}

// --- events ---------------------------------------------------------------

/**
 * Streamed over SSE at GET /api/stream. The frontend is a pure function of
 * this event log — it holds no other source of truth about a run.
 */
export type RunEvent =
  | { type: 'run:start'; runId: string; trigger: RunTrigger; at: string }
  | { type: 'step:start'; runId: string; step: StepId; at: string }
  | { type: 'step:log'; runId: string; step: StepId; message: string; at: string }
  | { type: 'step:done'; runId: string; step: StepId; summary: string; ms: number; at: string }
  | { type: 'step:failed'; runId: string; step: StepId; error: string; at: string }
  | { type: 'trend:selected'; runId: string; trend: Trend; at: string }
  | { type: 'passages'; runId: string; passages: Passage[]; at: string }
  | { type: 'draft'; runId: string; draft: Draft; at: string }
  | { type: 'gate'; runId: string; gate: GateResult; at: string }
  | { type: 'decision'; runId: string; decision: HumanDecision; at: string }
  | { type: 'run:end'; runId: string; outcome: RunOutcome; degraded: boolean; at: string }
  /**
   * Emitted for EVERY call that leaves the process. Because all outbound calls
   * are funnelled through one client module, this event log is a complete and
   * auditable record of external execution — which is what the pipeline view
   * renders alongside each step.
   */
  | {
      type: 'swytchcode:call';
      runId: string;
      service: string;
      operation: string;
      ms: number;
      ok: boolean;
      /** True when the real service was unreachable and seeded data was used. */
      fallback: boolean;
      at: string;
    };

// --- config ---------------------------------------------------------------

export interface GateThresholds {
  /** Minimum share of claims that must be corroborated. 0..1 */
  evidenceCoverage: number;
  /** Minimum distinct publishers per claim. */
  minIndependentSources: number;
  /** Sensitivity score at or above which we refuse to publish unattended. 0..1 */
  sensitivityBlock: number;
  /** Similarity to an existing published post at or above which it is a repeat. 0..1 */
  noveltyBlock: number;
}

export interface AppConfig {
  /** Cron expression for the fixed daily publish time. */
  scheduleCron: string;
  scheduleLabel: string;
  thresholds: GateThresholds;
  /** Which services resolved to a live connection vs. seeded fallback. */
  services: Record<string, 'live' | 'fallback'>;
  /** True when no Swytchcode credentials are present at all. */
  fallbackMode: boolean;
}

/** A topic the operator can pin for a run. Powers the demo selector. */
export interface TrendOption {
  id: string;
  topic: string;
  publishers: number;
  /** Which gate outcome this seeded scenario demonstrates, when applicable. */
  demoNote?: string;
}

/** A message sent to the publishing or review channel. */
export interface ChannelMessageView {
  id: string;
  kind: 'published' | 'escalation' | 'decision';
  channel: string;
  text: string;
  runId: string;
  at: string;
  /** True when written to the local feed rather than a real channel. */
  local: boolean;
}

// --- Repurposing & Brand Governance Engine ---------------------------------

export type RepurposedFormatId = 'video_script' | 'thread' | 'social_caption' | 'blog_snippet';

export interface BrandProfile {
  id: string;
  name: string;
  tagline: string;
  tone: string;
  targetAudience: string;
  forbiddenWords: string[];
  preferredKeywords: string[];
  signatureSignoff?: string;
  rules: string[];
}

export interface BrandAlignmentScore {
  overallScore: number; // 0..100
  toneScore: number; // 0..100
  vocabularyScore: number; // 0..100
  claimFidelityScore: number; // 0..100
  flaggedForbiddenWords: string[];
  warnings: string[];
  passed: boolean;
}

export interface ScriptScene {
  timestamp: string;
  visualCue: string;
  onScreenText?: string;
  narration: string;
}

export interface TweetItem {
  index: number;
  text: string;
  charCount: number;
}

export interface RepurposedItem {
  formatId: RepurposedFormatId;
  title: string;
  platform: string;
  content: string;
  estimatedReadTime: string;
  metadata?: {
    scenes?: ScriptScene[];
    tweets?: TweetItem[];
    hashtags?: string[];
    wordCount?: number;
  };
  brandScore: BrandAlignmentScore;
}

export interface RepurposeBundle {
  id: string;
  originalTopic: string;
  originalBody: string;
  brandProfile: BrandProfile;
  formats: Record<RepurposedFormatId, RepurposedItem>;
  createdAt: string;
}

export interface RepurposeRequest {
  topic?: string;
  content: string;
  brandProfileId?: string;
  customProfile?: Partial<BrandProfile>;
}

// --- HTTP surface ---------------------------------------------------------

export const API = {
  /** SSE event stream. */
  stream: '/api/stream',
  /** POST — trigger a run immediately. Body: { trendId?: string } */
  run: '/api/run',
  /** POST /api/runs/:runId/decide — Body: { decision: HumanDecision } */
  decide: (runId: string) => `/api/runs/${runId}/decide`,
  /** GET — RunRecord[], newest first. */
  history: '/api/history',
  /** GET — AppConfig. */
  config: '/api/config',
  /** GET — TrendOption[], the topics available to pin for a run. */
  trends: '/api/trends',
  /** GET — ChannelMessageView[], newest first. */
  channel: '/api/channel',
  /** POST — Repurpose core content across 4 formats. Body: RepurposeRequest */
  repurpose: '/api/repurpose',
  /** GET — BrandProfile[], available brand personas. */
  brandProfiles: '/api/brand-profiles',
} as const;

