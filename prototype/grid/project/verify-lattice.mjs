/* VERIFY the paper-in-3D prototype (lattice.js, proto.js). PROTOTYPE.
   bun prototype/grid/project/verify-lattice.mjs [port]   — same env vars as verify.mjs. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PORT = Number(process.argv[2] || 8731);
const { chromium } = require(process.env.PW_CORE || `${process.env.HOME}/.codex-cs199/tools/node_modules/playwright-core`);
const SHOTS = process.env.SHOTS || '/tmp/claude-1000/-home-ethan/d4c42b7e-e1ba-4bdb-9ef9-88602b0d8392/scratchpad/grid-shots';
const BASE = `http://localhost:${PORT}/prototype/grid/project/three-little-pigs/index.html`;
const PRESETS = {
  P1: 'extent=tight&drawings=clear&verticals=lattice',
  P2: 'extent=tight&drawings=clear&verticals=all',
  P3: 'extent=sheet&drawings=under&verticals=lattice',
  P4: 'extent=sheet&drawings=clear&verticals=all',
};
let fails = 0;
const check = (n, ok, d = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? `  — ${d}` : ''}`); };
const browser = await chromium.launch({
  executablePath: process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const dbg = (p) => p.evaluate(() => window.__env.sheet.debug());
for (const [name, qs] of Object.entries(PRESETS)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}?${qs}`);
  await page.waitForFunction(() => window.__env && window.__env.sheet, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  let d = await dbg(page);
  const L = d.lattice;
  const pressed = await page.$$eval('.proto-bar [aria-pressed="true"]', (b) => b.map((x) => x.dataset.preset || x.dataset.value));
  check(`${name}: bar shows the preset and its values`, pressed.includes(name) && Object.values(d.options).every((v) => pressed.includes(v)), pressed.join(' '));
  check(`${name}: at home the lattice lies on the paper (lift 0, paper bold dots)`, d.lift === 0 && L.maxFromCollapsedPx < 0.01, `lift ${d.lift}`);
  check(`${name}: every lattice point projects onto a bold dot (collapsed and lifted)`, L.maxFlatErrPx < 0.5 && L.maxLiftedErrPx < 0.5,
    `${L.count} points; max error ${L.maxFlatErrPx.toFixed(3)} / ${L.maxLiftedErrPx.toFixed(3)} px`);
  console.log(`      ${name}: model top corners from nearest bold dot at home: ${L.topCornerErrPx.map((e) => e.toFixed(1)).join(', ')} px (vScale ${L.vScale.toFixed(3)})`);
  /* orbit: the lattice lifts */
  await page.mouse.move(500, 300); await page.mouse.down({ button: 'right' });
  for (let i = 1; i <= 12; i++) await page.mouse.move(500 + i * 13, 300 + i * 7);
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(300);
  d = await dbg(page);
  check(`${name}: orbiting lifts the lattice into 3D`, d.lift > 0.99 && d.lattice.maxFromCollapsedPx > 20,
    `lift ${d.lift.toFixed(2)}, points up to ${d.lattice.maxFromCollapsedPx.toFixed(0)} px off their collapsed dots`);
  await page.screenshot({ path: `${SHOTS}/env5-${name}-orbit.png` });
  if (name === 'P1') {
    /* record lift every frame inside the page while the camera flies home */
    const rec = page.evaluate(() => new Promise((resolve) => {
      const out = [];
      const t0 = performance.now();
      (function f() {
        const s = window.__env.sheet.debug();
        out.push([s.lift, s.lattice.maxFromCollapsedPx]);
        if ((!s.flying && s.lift === 0) || performance.now() - t0 > 8000) resolve(out); else requestAnimationFrame(f);
      }());
    }));
    await page.click('.env-home');
    const samples = await rec;
    /* lift is a function of the orbit angle alone, so the mid-collapse frame is a partial orbit */
    await page.mouse.move(500, 300); await page.mouse.down({ button: 'right' });
    for (let i = 1; i <= 6; i++) await page.mouse.move(500 + i * 8, 300 + i * 3);
    await page.mouse.up({ button: 'right' });
    await page.waitForTimeout(300);
    const midLift = (await dbg(page)).lift;
    await page.screenshot({ path: `${SHOTS}/env5-collapse-mid.png` });
    const last = samples.at(-1);
    const mono = samples.every((x, i) => i === 0 || x[0] <= samples[i - 1][0] + 1e-9);
    const between = samples.filter((x) => x[0] > 0.02 && x[0] < 0.98).length;
    check('P1: snap home collapses the lattice (lift falls monotonically to 0 over several frames, points converge)', mono && between >= 1 && last[0] === 0 && midLift > 0.2 && midLift < 0.8 && last[1] < 0.01,
      `${samples.length} frames, ${between} mid-collapse; screenshot at lift ${midLift.toFixed(2)}; ` + samples.map((x) => x[0].toFixed(2)).join(' '));
  }
  check(`${name}: zero console errors / 404s`, errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(fails ? `${fails} failed` : 'all checks passed');
process.exit(fails ? 1 : 0);
