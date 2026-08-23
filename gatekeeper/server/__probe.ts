// Throwaway measurement probe. Deleted before commit.
// Run: node --experimental-strip-types server/__probe.ts
import { cosine, embedLocal, sentences } from './embed.ts';
import { SEED_PUBLISHED, SEED_TRENDS } from './seed.ts';

const f = (n: number) => n.toFixed(3);

console.log('=== 1. cross-publisher similarity inside trend 1 (corroboration) ===');
const t1 = SEED_TRENDS[0];
const flat: Array<{ pub: string; text: string; v: number[] }> = [];
for (const d of t1.docs) {
  for (const p of d.passages) flat.push({ pub: d.publisher, text: p, v: embedLocal(p) });
}
let crossMax = 0;
let crossVals: number[] = [];
for (let i = 0; i < flat.length; i++) {
  for (let j = i + 1; j < flat.length; j++) {
    if (flat[i].pub === flat[j].pub) continue;
    const c = cosine(flat[i].v, flat[j].v);
    crossVals.push(c);
    if (c > crossMax) crossMax = c;
  }
}
crossVals.sort((a, b) => b - a);
console.log('cross-publisher pairs:', crossVals.length);
console.log('top 8:', crossVals.slice(0, 8).map(f).join(', '));
console.log('median:', f(crossVals[Math.floor(crossVals.length / 2)]));

console.log('\n=== 2. topic->passage retrieval scores (trend 1) ===');
const tv = embedLocal(t1.topic);
const scored = flat
  .map((p) => ({ pub: p.pub, s: cosine(tv, p.v), t: p.text.slice(0, 55) }))
  .sort((a, b) => b.s - a.s);
for (const s of scored.slice(0, 6)) console.log(' ', f(s.s), s.pub.padEnd(16), s.t);
console.log('  distinct publishers in top 6:', new Set(scored.slice(0, 6).map((s) => s.pub)).size);

console.log('\n=== 3. NOVELTY: trend 4 template draft vs seeded published post ===');
const t4 = SEED_TRENDS[3];
const t4passages: string[] = [];
for (const d of t4.docs) for (const p of d.passages) t4passages.push(p);
const tmplBody = t4passages.slice(0, 3).map((p) => sentences(p)[0] ?? p).join(' ');
const tmplVec = embedLocal(tmplBody);
for (const post of SEED_PUBLISHED) {
  console.log(' ', f(cosine(tmplVec, embedLocal(post.body))), '<-', post.topic.slice(0, 58));
}
console.log('  threshold to BLOCK is 0.86 — reachable?');

console.log('\n=== 4. NOVELTY false-positive: trend 1 draft vs published history ===');
const t1tmpl = flat.slice(0, 3).map((p) => sentences(p.text)[0] ?? p.text).join(' ');
const t1vec = embedLocal(t1tmpl);
for (const post of SEED_PUBLISHED) {
  console.log(' ', f(cosine(t1vec, embedLocal(post.body))), '<-', post.topic.slice(0, 58));
}

console.log('\n=== 5. scenario 3 (rumour) publisher count in retrieval ===');
const t3 = SEED_TRENDS[2];
console.log('  docs:', t3.docs.length, 'publishers:', [...new Set(t3.docs.map((d) => d.publisher))]);
console.log('  passages:', t3.docs.reduce((n, d) => n + d.passages.length, 0));
