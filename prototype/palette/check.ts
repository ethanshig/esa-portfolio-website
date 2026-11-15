// PROTOTYPE (prototype/palette): bun prototype/palette/check.ts — every palette, both papers, all vision kinds;
// the Daylight palette at every sun altitude from -20° to 75°
import './cvd.js';
import './palettes.js';
const G = globalThis as any, { audit } = G.ESA_CVD;
let bad = 0;
const test = (label: string, m: any, quiet = false) => {
  const rows = audit(m);
  const fails = rows.flatMap((r: any) => [
    r.ink < 7 && `${r.kind} ink ${r.ink.toFixed(1)}`, r.muted < 4.5 && `${r.kind} muted ${r.muted.toFixed(1)}`,
    r.accent < 3 && `${r.kind} accent ${r.accent.toFixed(1)}`, r.sep < 20 && `${r.kind} accent~ink dE ${r.sep.toFixed(0)}`,
  ].filter(Boolean));
  const n = rows[0];
  if (!quiet || fails.length) console.log(`${label.padEnd(34)} ink ${n.ink.toFixed(1)} muted ${n.muted.toFixed(1)} accent ${n.accent.toFixed(1)} minSep ${Math.min(...rows.map((r: any) => r.sep)).toFixed(0)}  ${fails.length ? 'FAIL ' + fails.join(', ') : 'ok'}`);
  bad += fails.length;
};
for (const p of G.ESA_PALETTES) {
  if (p.behaviour === 'sun') {
    for (let a = -20; a <= 75; a += 0.5) test(`${p.key} ${p.name} sun ${a}°`, G.ESA_SUN_PAPER(a), ![-20, -1.5, -1, 0, 20, 50, 75].includes(a));
    continue;
  }
  for (const mode of ['light', 'dark']) test(`${p.key} ${p.name} ${mode}`, p[mode]);
}
const day = new Date(); day.setUTCHours(18, 0, 0, 0);
console.log(`sun over Champaign today at 12:00 CST: ${G.ESA_SUN_ALT(day).toFixed(1)}°`);
process.exit(bad ? 1 : 0);
