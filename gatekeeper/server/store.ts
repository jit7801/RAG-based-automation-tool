// ---------------------------------------------------------------------------
// In-memory stores.
//
// Deliberately not a database. Durable knowledge belongs in Weaviate (via
// Swytchcode); everything here is either a mirror of that, or per-process run
// state that has no reason to outlive the process. Adding Postgres would have
// cost a large share of the build window for capability the brief never asks
// for.
// ---------------------------------------------------------------------------

import type { Passage, RunRecord, SourceDoc } from '../shared/contract.ts';

export interface StoredPassage extends Passage {
  vector: number[];
  publisher: string;
}

export interface PublishedPost {
  id: string;
  topic: string;
  body: string;
  vector: number[];
  publishedAt: string;
  /** Present when a human approved an escalated draft. */
  approvedBy?: 'human';
}

const docs = new Map<string, SourceDoc>();
const passages = new Map<string, StoredPassage>();
const published: PublishedPost[] = [];
const runs: RunRecord[] = [];

// --- documents & passages -------------------------------------------------

export function putDoc(doc: SourceDoc): void {
  docs.set(doc.id, doc);
}

export function getDoc(id: string): SourceDoc | undefined {
  return docs.get(id);
}

export function allDocs(): SourceDoc[] {
  return [...docs.values()];
}

export function putPassage(p: StoredPassage): void {
  passages.set(p.id, p);
}

export function getPassage(id: string): StoredPassage | undefined {
  return passages.get(id);
}

export function allPassages(): StoredPassage[] {
  return [...passages.values()];
}

export function passageCount(): number {
  return passages.size;
}

// --- published history ----------------------------------------------------

export function addPublished(post: PublishedPost): void {
  published.unshift(post);
}

export function allPublished(): PublishedPost[] {
  return [...published];
}

export function publishedCount(): number {
  return published.length;
}

// --- runs -----------------------------------------------------------------

export function addRun(run: RunRecord): void {
  runs.unshift(run);
}

export function getRun(runId: string): RunRecord | undefined {
  return runs.find((r) => r.runId === runId);
}

export function allRuns(): RunRecord[] {
  return [...runs];
}

export function updateRun(runId: string, patch: Partial<RunRecord>): RunRecord | undefined {
  const run = runs.find((r) => r.runId === runId);
  if (!run) return undefined;
  Object.assign(run, patch);
  return run;
}
