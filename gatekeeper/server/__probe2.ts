// Throwaway probe 2. Is distinctive-term overlap a cleaner corroboration
// signal than whole-passage cosine? Deleted before commit.
import { SEED_TRENDS } from './seed.ts';

const STOP = new Set('a an the and or but if then than that this these those of in on at to for from by with as is are was were be been being it its their has have had not no more most other some such over under about after before'.split(' '));

const terms = (s: string): Set<string> =>
  new Set(
    s.toLowerCase().replace(/[^a-z0-9\s%.]/g, ' ').split(/\s+/)
      .map((w) => w.replace(/\.$/, ''))
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );

const shared = (a: Set<string>, b: Set<string>) => [...a].filter((t) => b.has(t));

for (const [ti, t] of SEED_TRENDS.entries()) {
  const flat: Array<{ pub: string; text: string; t: Set<string> }> = [];
  for (const d of t.docs) for (const p of d.passages) flat.push({ pub: d.publisher, text: p, t: terms(p) });

  const cross: Array<{ n: number; pubs: string; sh: string[] }> = [];
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i].pub === flat[j].pub) continue;
      const sh = shared(flat[i].t, flat[j].t);
      cross.push({ n: sh.length, pubs: `${flat[i].pub}|${flat[j].pub}`, sh });
    }
  }
  cross.sort((a, b) => b.n - a.n);
  console.log(`\n--- trend ${ti + 1}: ${t.topic.slice(0, 52)}`);
  console.log(`    pairs=${cross.length} max=${cross[0]?.n} median=${cross[Math.floor(cross.length / 2)]?.n}`);
  for (const c of cross.slice(0, 4)) console.log(`     ${c.n}  ${c.pubs}  [${c.sh.slice(0, 6).join(' ')}]`);
}

// Cross-TREND contamination: do passages from DIFFERENT trends share terms?
// This is the false-positive risk once the store accumulates across runs.
console.log('\n=== cross-trend false positives (should be LOW) ===');
const byTrend = SEED_TRENDS.map((t) => {
  const out: Array<{ pub: string; t: Set<string> }> = [];
  for (const d of t.docs) for (const p of d.passages) out.push({ pub: d.publisher, t: terms(p) });
  return out;
});
for (let a = 0; a < byTrend.length; a++) {
  for (let b = a + 1; b < byTrend.length; b++) {
    let max = 0;
    let ex: string[] = [];
    for (const pa of byTrend[a]) for (const pb of byTrend[b]) {
      if (pa.pub === pb.pub) continue;
      const sh = shared(pa.t, pb.t);
      if (sh.length > max) { max = sh.length; ex = sh; }
    }
    console.log(`  trend${a + 1} vs trend${b + 1}: max=${max} [${ex.slice(0, 5).join(' ')}]`);
  }
}
