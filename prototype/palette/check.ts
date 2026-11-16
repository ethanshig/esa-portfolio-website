// PROTOTYPE (prototype/palette): bun prototype/palette/check.ts — every palette, both papers, all vision kinds;
// the Daylight palette at every sun altitude from -20° to 75°
import './cvd.js';
import './palettes.js';
const G = globalThis as any, { audit } = G.ESA_CVD;
let bad = 0, beyond = 0;
const test = (label: string, m: any, quiet = false, counts = true) => {
  const rows = audit(m);
  const fails = rows.flatMap((r: any) => [
    r.ink < 7 && `${r.kind} ink ${r.ink.toFixed(1)}`, r.muted < 4.5 && `${r.kind} muted ${r.muted.toFixed(1)}`,
    r.accent < 3 && `${r.kind} accent ${r.accent.toFixed(1)}`, r.sep < 20 && `${r.kind} accent~ink dE ${r.sep.toFixed(0)}`,
  ].filter(Boolean));
  /* a wash under text: the ink must still read on the deepest wash (4.5, AA), under every kind of vision */
  if (m.dense) for (const k of G.ESA_CVD.KINDS) {
    const r = G.ESA_CVD.contrast(G.ESA_CVD.simulate(m.ink, k), G.ESA_CVD.simulate(m.dense, k));
    if (r < 4.5) fails.push(`${k} ink on wash ${r.toFixed(1)}`);
  }
  const n = rows[0];
  if (!quiet || fails.length) console.log(`${label.padEnd(34)}${m.dense ? ` onWash ${G.ESA_CVD.contrast(m.ink, m.dense).toFixed(1)}` : ''} ink ${n.ink.toFixed(1)} muted ${n.muted.toFixed(1)} accent ${n.accent.toFixed(1)} minSep ${Math.min(...rows.map((r: any) => r.sep)).toFixed(0)}  ${fails.length ? 'FAIL ' + fails.join(', ') : 'ok'}`);
  if (counts) bad += fails.length; else if (fails.length) beyond++;
};
for (const p of G.ESA_PALETTES) {
  if (p.behaviour === 'sun') {
    for (const k of [0, 0.5, 1, 1.25, 1.5]) for (let a = -20; a <= 75; a += 0.5)
      test(`${p.key} sat ${k} sun ${a}°`, G.ESA_SAT(G.ESA_SUN_PAPER(a), k), k > 1 || !(k === 1 ? [-20, -1, 0, 20, 50] : [-20, 0, 50]).includes(a), k <= 1);
    continue;
  }
  if (p.behaviour === 'wc-sun') {
    for (const rising of [true, false]) for (let a = -20; a <= 75; a += 0.5)
      test(`${p.key} ${rising ? 'rise' : 'set'} ${a}°`, G.ESA_WC(a, rising), ![-20, -1, 0, 6, 12, 28].includes(a));
    continue;
  }
  if (p.behaviour === 'wc-still') { for (const mode of ['light', 'dark']) test(`${p.key} ${p.name} ${mode}`, G.ESA_WC_STILL[mode]); continue; }
  for (const mode of ['light', 'dark']) test(`${p.key} ${p.name} ${mode}`, p[mode]);
}
const day = new Date(); day.setUTCHours(18, 0, 0, 0);
console.log(`sun over Champaign today at 12:00 CST: ${G.ESA_SUN_ALT(day).toFixed(1)}°`);
console.log(`dial past 100%: ${beyond} sun states fall short (reported, not gating)`);
process.exit(bad ? 1 : 0);
