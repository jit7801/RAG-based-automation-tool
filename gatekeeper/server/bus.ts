// ---------------------------------------------------------------------------
// Event bus.
//
// The orchestrator never talks to the browser directly — it emits events here,
// and index.ts forwards them to any connected SSE client. Keeping a replay
// buffer means a client that connects mid-run still renders the whole run,
// which matters when you reload the page thirty seconds before a demo.
// ---------------------------------------------------------------------------

import type { RunEvent } from '../shared/contract.ts';

type Listener = (event: RunEvent) => void;

const listeners = new Set<Listener>();

/** Events for the current run, replayed to late subscribers. */
let replay: RunEvent[] = [];
const REPLAY_LIMIT = 500;

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(event: RunEvent): void {
  if (event.type === 'run:start') replay = [];
  replay.push(event);
  if (replay.length > REPLAY_LIMIT) replay = replay.slice(-REPLAY_LIMIT);

  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      // A broken client must never take down a run.
      console.error('[bus] listener threw:', err);
    }
  }
}

export function getReplay(): RunEvent[] {
  return [...replay];
}

export const now = (): string => new Date().toISOString();
