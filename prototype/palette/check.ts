// PROTOTYPE (prototype/palette): bun prototype/palette/check.ts — every palette, both papers, all vision kinds
import './cvd.js';
import './palettes.js';
const { audit } = (globalThis as any).ESA_CVD;
let bad = 0;
for (const p of (globalThis as any).ESA_PALETTES) for (const mode of ['light', 'dark']) {
  const rows = audit(p[mode]);
  const fails = rows.flatMap((r: any) => [
    r.ink < 7 && `${r.kind} ink ${r.ink.toFixed(1)}`, r.muted < 4.5 && `${r.kind} muted ${r.muted.toFixed(1)}`,
    r.accent < 3 && `${r.kind} accent ${r.accent.toFixed(1)}`, r.sep < 20 && `${r.kind} accent~ink dE ${r.sep.toFixed(0)}`,
  ].filter(Boolean));
  const n = rows[0];
  console.log(`${p.key} ${p.name.padEnd(18)} ${mode.padEnd(5)} ink ${n.ink.toFixed(1)} muted ${n.muted.toFixed(1)} accent ${n.accent.toFixed(1)} minSep ${Math.min(...rows.map((r: any) => r.sep)).toFixed(0)}  ${fails.length ? 'FAIL ' + fails.join(', ') : 'ok'}`);
  bad += fails.length;
}
process.exit(bad ? 1 : 0);
