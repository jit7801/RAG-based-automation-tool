// ---------------------------------------------------------------------------
// Zero-dependency .env loader.
//
// Why hand-rolled rather than `dotenv`: the whole project is judged from the
// repository, so the thing that matters most is that `git clone && npm install
// && npm run dev` works on someone else's machine on the first try. Every
// dependency is a chance for that to fail. This is twenty lines and removes one.
//
// It is also a no-op when `.env` is absent, which is the expected state for
// anyone evaluating the repo: the system then runs entirely on the seeded corpus
// and local fallbacks, every run is labelled DEGRADED, and nothing pretends to
// be live.
//
// IMPORT ORDER MATTERS. This module must be imported before anything that reads
// process.env. Modules that read credentials do so lazily as a second line of
// defence, but the ordering here is the primary guarantee.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parse(src: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();

    // Strip matched surrounding quotes, then honour \n inside double quotes.
    const quoted = /^(['"])(.*)\1$/.exec(value);
    if (quoted) {
      value = quoted[2];
      if (quoted[1] === '"') value = value.replace(/\\n/g, '\n');
    }

    out[key] = value;
  }

  return out;
}

/**
 * Load `.env` into process.env without overwriting anything already set — a
 * real environment variable should always beat a file on disk.
 */
export function loadEnv(file = '.env'): { loaded: boolean; keys: string[] } {
  try {
    const parsed = parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
    const applied: string[] = [];

    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
        applied.push(key);
      }
    }

    return { loaded: true, keys: applied };
  } catch {
    // No .env is a supported, expected state — not an error worth reporting.
    return { loaded: false, keys: [] };
  }
}

export const envResult = loadEnv();
