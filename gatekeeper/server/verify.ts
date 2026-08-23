// ---------------------------------------------------------------------------
// End-to-end verification of the four demo scenarios.
//
// Runs the real pipeline in fallback mode — the state a judge sees when they
// clone the repo with no credentials — and asserts each scenario produces the
// gate outcome its demoNote promises. If this passes, the demo works.
//
//   node --experimental-strip-types server/verify.ts
//
// No dependencies: pipeline.ts and everything under it are dependency-free, so
// this runs before `npm install` has ever been executed.
// ---------------------------------------------------------------------------

import { subscribe } from './bus.ts';
import { distinctiveTerms, MIN_SHARED_TERMS, sharedTerms } from './embed.ts';
import { runPipeline, seedHistory } from './pipeline.ts';
import { SEED_TRENDS } from './seed.ts';
import { allPublished, publishedCount } from './store.ts';
import type { CheckId, CheckVerdict, GateDecision } from '../shared/contract.ts';

interface Expectation {
  trendId: string;
  label: string;
  decision: GateDecision;
  /** The check that must be the blocking one, if any. */
  blocker: CheckId | null;
  mustPass: CheckId[];
}

// Derived from the demoNote on each seed trend. Kept explicit so a mismatch is
// a test failure rather than a surprise on stage.
const EXPECTED: Expectation[] = [
  {
    trendId: 'trend-inference-costs',
    label: 'clean path — publishes with no human',
    decision: 'publish',
    blocker: null,
    mustPass: ['evidence', 'sensitivity', 'novelty'],
  },
  {
    trendId: 'trend-port-fire',
    label: 'sensitive — corroborated but must not auto-publish',
    decision: 'escalate',
    blocker: 'sensitivity',
    mustPass: ['evidence'],
  },
  {
    trendId: 'trend-acquisition-rumour',
    label: 'single-source rumour — evidence must block',
    decision: 'escalate',
    blocker: 'evidence',
    mustPass: ['sensitivity'],
  },
  {
    trendId: 'trend-vector-db-pricing',
    label: 'repeat — novelty must block',
    decision: 'escalate',
    blocker: 'novelty',
    mustPass: ['evidence', 'sensitivity'],
  },
];

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const OFF = '\x1b[0m';

let failures = 0;

function check(ok: boolean, msg: string): void {
  console.log(`   ${ok ? `${GREEN}PASS${OFF}` : `${RED}FAIL${OFF}`}  ${msg}`);
  if (!ok) failures++;
}

// Capture swytchcode calls so we can assert the execution layer was exercised.
let calls: Array<{ service: string; operation: string; fallback: boolean }> = [];
subscribe((e) => {
  if (e.type === 'swytchcode:call') {
    calls.push({ service: e.service, operation: e.operation, fallback: e.fallback });
  }
});

async function main() {
  // ---------------------------------------------------------------------------
  // Calibration guard. The corroboration test is a threshold on shared
  // distinctive terms, and it only works because same-topic overlap sits clearly
  // above cross-topic overlap. If someone edits the seed corpus or the
  // tokenizer, that margin can quietly close — so assert it rather than trust it.
  // ---------------------------------------------------------------------------
  console.log('Calibration: corroboration signal vs cross-topic noise');

  const perTrend = SEED_TRENDS.map((t) => {
    const out: Array<{ pub: string; terms: Set<string> }> = [];
    for (const d of t.docs) {
      for (const p of d.passages) out.push({ pub: d.publisher, terms: distinctiveTerms(p) });
    }
    return out;
  });

  const sameTopicBest = perTrend.map((passages) => {
    let best = 0;
    for (let i = 0; i < passages.length; i++) {
      for (let j = i + 1; j < passages.length; j++) {
        if (passages[i].pub === passages[j].pub) continue;
        best = Math.max(best, sharedTerms(passages[i].terms, passages[j].terms).length);
      }
    }
    return best;
  });

  let crossTopicCeiling = 0;
  for (let a = 0; a < perTrend.length; a++) {
    for (let b = a + 1; b < perTrend.length; b++) {
      for (const pa of perTrend[a]) {
        for (const pb of perTrend[b]) {
          if (pa.pub === pb.pub) continue;
          crossTopicCeiling = Math.max(
            crossTopicCeiling,
            sharedTerms(pa.terms, pb.terms).length,
          );
        }
      }
    }
  }

  console.log(
    `${DIM}   same-topic best per trend: ${sameTopicBest.join(', ')}  (trend 3 is single-source, 0 is correct)${OFF}`,
  );
  console.log(
    `${DIM}   cross-topic ceiling: ${crossTopicCeiling}   MIN_SHARED_TERMS: ${MIN_SHARED_TERMS}${OFF}`,
  );
  check(
    crossTopicCeiling < MIN_SHARED_TERMS,
    `cross-topic noise (${crossTopicCeiling}) stays below the corroboration threshold (${MIN_SHARED_TERMS})`,
  );
  check(
    sameTopicBest.filter((n) => n >= MIN_SHARED_TERMS).length === 3,
    'the 3 multi-publisher trends each clear the corroboration threshold',
  );
  check(
    sameTopicBest[2] === 0,
    'the single-source trend has no cross-publisher pair at all (structurally uncorroborable)',
  );

  console.log('\nSeeding published history...');
  const seeded = await seedHistory();
  console.log(`  ${seeded} historical posts, store now holds ${publishedCount()}.\n`);
  check(publishedCount() === 3, 'novelty back-catalogue is populated on cold start');

  for (const exp of EXPECTED) {
    const trend = SEED_TRENDS.find((t) => t.id === exp.trendId);
    console.log(`\n${'='.repeat(74)}`);
    console.log(`${exp.trendId}  —  ${exp.label}`);
    console.log(`${DIM}${trend?.topic}${OFF}`);
    console.log('='.repeat(74));

    calls = [];
    const run = await runPipeline({ trigger: 'manual', trendId: exp.trendId });

    if (!run.gate || !run.draft) {
      check(false, `run produced a gate result and a draft (outcome=${run.outcome})`);
      continue;
    }

    const verdicts = Object.fromEntries(
      run.gate.checks.map((c) => [c.id, c.verdict]),
    ) as Record<CheckId, CheckVerdict>;
    const scores = Object.fromEntries(
      run.gate.checks.map((c) => [c.id, `${c.score.toFixed(3)}/${c.threshold.toFixed(2)}`]),
    ) as Record<CheckId, string>;

    console.log(
      `${DIM}   draft: ${run.draft.body.slice(0, 96)}...${OFF}`,
    );
    console.log(
      `${DIM}   claims: ${run.draft.claims.length}, sources per claim: ${run.draft.claims.map((c) => c.independentSources).join(',')}${OFF}`,
    );
    for (const c of run.gate.checks) {
      console.log(`${DIM}   ${c.id.padEnd(12)} ${c.verdict.padEnd(6)} ${scores[c.id]}${OFF}`);
    }

    check(run.gate.decision === exp.decision, `decision is "${exp.decision}" (got "${run.gate.decision}")`);

    if (exp.blocker) {
      check(
        verdicts[exp.blocker] === 'block',
        `${exp.blocker} check BLOCKS (got "${verdicts[exp.blocker]}", ${scores[exp.blocker]})`,
      );
    }

    for (const id of exp.mustPass) {
      check(
        verdicts[id] !== 'block',
        `${id} check does not block (got "${verdicts[id]}", ${scores[id]})`,
      );
    }

    // Provenance integrity: every cited claim must have a real, non-empty
    // citation, and every claim text must actually appear in the body.
    const phantom = run.draft.claims.filter(
      (c) => c.independentSources > 0 && c.passageIds.length === 0,
    );
    check(phantom.length === 0, 'no claim reports sources without citing passages');

    const notInBody = run.draft.claims.filter((c) => !run.draft!.body.includes(c.text));
    check(notInBody.length === 0, 'every claim text appears verbatim in the draft body');

    check(run.degraded === true, 'run is labelled DEGRADED (no credentials present)');
    check(
      calls.length > 0 && calls.every((c) => c.fallback),
      `all ${calls.length} external calls routed through the Swytchcode client and fell back`,
    );
  }

  // The clean-path run should have added itself to the back-catalogue.
  console.log(`\n${'='.repeat(74)}`);
  check(
    publishedCount() > 3,
    `published posts are written back to the novelty catalogue (${publishedCount()} total)`,
  );
  const autoPublished = allPublished().filter((p) => !p.approvedBy && !p.id.startsWith('seed-'));
  check(autoPublished.length >= 1, 'at least one post published with no human involvement');

  console.log(
    `\n${failures === 0 ? `${GREEN}All checks passed.${OFF}` : `${RED}${failures} check(s) failed.${OFF}`}\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verify harness crashed:', err);
  process.exit(1);
});
