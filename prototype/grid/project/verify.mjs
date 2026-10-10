/* ===================================================================
   VERIFY — the drawing-sheet project pages (ADR-0007). PROTOTYPE.

   bun prototype/grid/project/verify.mjs [port]

   Needs the worktree root served on PORT (default 8731) and Playwright's
   Chromium. Every check prints PASS/FAIL with the numbers it compared;
   the process exits 1 on any failure. Screenshots go to $SHOTS.

   Env: PW_CORE (playwright-core path), CHROME (executable), SHOTS (dir).
   =================================================================== */
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PORT = Number(process.argv[2] || process.env.PORT || 8731);
const ROOT = `http://localhost:${PORT}`;
const PW_CORE = process.env.PW_CORE || `${process.env.HOME}/.codex-cs199/tools/node_modules/playwright-core`;
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const SHOTS = process.env.SHOTS || '/tmp/claude-1000/-home-ethan/d4c42b7e-e1ba-4bdb-9ef9-88602b0d8392/scratchpad/grid-shots';
mkdirSync(SHOTS, { recursive: true });
const { chromium, devices } = require(PW_CORE);

const PAGES = {
  tlp: { id: 'three-little-pigs', url: `${ROOT}/prototype/grid/project/three-little-pigs/index.html`, generated: `${ROOT}/projects/three-little-pigs.html` },
  plt: { id: 'para-la-tierra', url: `${ROOT}/prototype/grid/project/para-la-tierra/index.html`, generated: `${ROOT}/projects/para-la-tierra.html` },
};

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

/* ---------- no-JS: the HTML at request time ---------- */
async function textsBySelector(html, selectors) {
  const out = Object.fromEntries(selectors.map((s) => [s, []]));
  let rw = new HTMLRewriter();
  for (const sel of selectors) {
    let buf = null;
    rw = rw.on(sel, {
      element(el) { buf = ''; el.onEndTag(() => { out[sel].push(norm(buf)); buf = null; }); },
      text(t) { if (buf !== null) buf += t.text; },
    });
  }
  await rw.transform(new Response(html)).text();
  return out;
}
const ENT = { '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&#39;': "'", '&nbsp;': ' ' };
const norm = (s) => s.replace(/&[a-z#0-9]+;/gi, (m) => ENT[m] ?? m).replace(/\s+/g, ' ').trim();

async function checkStatic(key) {
  const P = PAGES[key];
  const [proto, gen] = await Promise.all([fetch(P.url).then((r) => r.text()), fetch(P.generated).then((r) => r.text())]);
  const sels = ['h1', '.project-eyebrow', '.project-lead', '.project-meta-item', 'h2.project-section-title',
    '.project-text', '.project-list li', '.narration-line', '.crossing-narrative', '.crossing-plain'];
  const G = await textsBySelector(gen, sels);
  const T = await textsBySelector(proto, sels);
  const flatProto = norm(proto.replace(/<[^>]+>/g, ' '));
  for (const sel of sels) {
    const missing = G[sel].filter((t) => t && !T[sel].includes(t));
    check(`${key} no-JS: every ${sel} of the generated page is in the HTML`, missing.length === 0,
      missing.length ? `missing: ${missing.map((m) => JSON.stringify(m.slice(0, 50))).join(', ')}` : `${G[sel].length} strings`);
  }
  const headings = ['The story', 'What I did', 'Process', 'Outcome', 'Reflection'];
  check(`${key} no-JS: all five Document headings`, headings.every((h) => T['h2.project-section-title'].includes(h)));
  check(`${key} no-JS: both crossing labels on every crossing`, T['.crossing-narrative'].length > 0 &&
    T['.crossing-narrative'].length === T['.crossing-plain'].length - 1, `${T['.crossing-narrative'].length} narrative / ${T['.crossing-plain'].length - 1} plain (+ the plain-only heading)`);
  const ld = proto.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ldOk = false;
  try { const j = JSON.parse(ld[1]); ldOk = j['@type'] === 'CreativeWork' && Array.isArray(j.image) && j.image.every((i) => i.description); } catch { ldOk = false; }
  check(`${key} no-JS: JSON-LD CreativeWork with ImageObjects`, ldOk);
  check(`${key} no-JS: data-story and data-arrival baked on <html>`, /<html[^>]*data-story="on"[^>]*data-arrival="cold"/.test(proto));

  /* every relative path in the HTML resolves */
  const refs = [...proto.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:|mailto:|data:)/.test(u));
  const jsonRefs = [...proto.matchAll(/"(?:src|linework)":\s*"([^"]+)"/g)].map((m) => m[1]);
  const bad = [];
  for (const r of [...new Set([...refs, ...jsonRefs])]) {
    const res = await fetch(new URL(r, P.url));
    if (!res.ok) bad.push(`${r} -> ${res.status}`);
  }
  check(`${key} every relative path resolves`, bad.length === 0, bad.length ? bad.join('; ') : `${new Set([...refs, ...jsonRefs]).size} paths`);
  return { flatProto };
}

/* ---------- browser helpers ---------- */
function watch(page, label, sink) {
  page.on('console', (m) => { if (m.type() === 'error') sink.push(`${label} console.error: ${m.text()}`); });
  page.on('pageerror', (e) => sink.push(`${label} pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) sink.push(`${label} HTTP ${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => sink.push(`${label} failed ${r.url()} (${r.failure() && r.failure().errorText})`));
}
async function open(ctx, url, label, sink) {
  const page = await ctx.newPage();
  watch(page, label, sink);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__env && window.__env.ready, null, { timeout: 30000 });
  await page.evaluate(() => window.__env.ready);
  await page.waitForTimeout(300);
  return page;
}
const dbg = (page) => page.evaluate(() => (window.__env.sheet ? window.__env.sheet.debug() : null));
async function settle(page) {
  await page.waitForFunction(() => !window.__env.sheet || !window.__env.sheet.debug().flying, null, { timeout: 10000 });
  await page.waitForTimeout(120);
}
const camKey = (c) => JSON.stringify([c.q || [], c.T, c.s].flat().map((v) => +v.toFixed(3)));
const qAngle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
async function noPageScroll(page) {
  return page.evaluate(() => {
    window.scrollTo(0, 400);
    const se = document.scrollingElement;
    return { sh: se.scrollHeight, ih: window.innerHeight, sw: se.scrollWidth, iw: window.innerWidth, y: window.scrollY, x: window.scrollX };
  });
}
async function scrollerInfo(page) {
  return page.evaluate(() => {
    const s = document.querySelector('.env-panel-scroll');
    const before = s.scrollTop;
    s.scrollTop = 200;
    const moved = s.scrollTop;
    s.scrollTop = before;
    return { sh: s.scrollHeight, ch: s.clientHeight, moved };
  });
}
const visible = (page, sel) => page.$$eval(sel, (els) => els.map((e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length)));

/* ===================================================================
   run
   =================================================================== */
const sink = [];
await checkStatic('tlp');
await checkStatic('plt');

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

/* ---------- TLP, desktop ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, PAGES.tlp.url, 'tlp', sink);
  await page.waitForTimeout(2600);                       /* the nav's first draw */
  let d = await dbg(page);
  check('tlp: WebGL sheet is up', d && d.webgl === true);
  check('tlp: arrival is the superimposed view', d.ghost === 0 && qAngle(d.camera.q, [-0.2391176, 0.3696438, 0.0990458, 0.8923991]) < 2e-3,
    `ghost ${d.ghost}`);
  const hero = d.drawings.find((x) => x.id === 'hero');
  const heroW = hero.screen[1][0] - hero.screen[0][0];
  const modelXs = d.model.screen.map((p) => p[0]);
  const modelW = Math.max(...modelXs) - Math.min(...modelXs);
  check('tlp: hero leads, model beside it and secondary', heroW > modelW * 1.2 && Math.min(...modelXs) > hero.screen[1][0],
    `hero ${heroW.toFixed(0)} px wide, model ${modelW.toFixed(0)} px, model left ${Math.min(...modelXs).toFixed(0)} > hero right ${hero.screen[1][0].toFixed(0)}`);
  check('tlp: section and axons 1-3 registered with marks; axon-4 has none',
    ['section', 'axon-1', 'axon-2', 'axon-3'].every((id) => d.drawings.find((x) => x.id === id).hasMark) &&
    !d.drawings.find((x) => x.id === 'axon-4').hasMark,
    d.drawings.map((x) => `${x.id}:${x.hasMark ? 'mark' : '-'}(${x.residual === null ? 'raster' : x.residual.toFixed(3)})`).join(' '));
  check('tlp: axon-4 bubble hidden', (await page.$eval('.env-bubble[data-mark="axon-4"]', () => true).catch(() => 'absent')) === 'absent');

  /* the section mark on the model's end face, in the home view */
  const mA = d.marks.find((m) => m.id === 'section');
  const pairs = mA.corners.map((c) => Math.min(...mA.endFace.map((e) => dist(c, e))));
  check('tlp: Section A mark lies on the model end face (home view)', Math.max(...pairs) <= mA.marginPx * Math.SQRT2 + 1.5,
    `corner offsets ${pairs.map((p) => p.toFixed(1)).join(', ')} px; margin ${mA.marginPx.toFixed(1)} px`);
  await page.screenshot({ path: `${SHOTS}/env-tlp-arrival.png` });

  /* no page scroll; the panel is the scroller */
  const ps = await noPageScroll(page);
  check('tlp: the page never scrolls', ps.sh === ps.ih && ps.y === 0 && ps.sw <= ps.iw, JSON.stringify(ps));

  /* hover a drawing -> its mark lights, and back (frame the whole sheet so axon 1 is on the stage) */
  await page.evaluate(() => window.__env.sheet.show('sheet', { animate: false }));
  await page.waitForTimeout(80);
  d = await dbg(page);
  const ax1 = d.drawings.find((x) => x.id === 'axon-1');
  const ax1c = [(ax1.screen[0][0] + ax1.screen[1][0]) / 2, (ax1.screen[0][1] + ax1.screen[1][1]) / 2];
  await page.mouse.move(ax1c[0], ax1c[1]);
  await page.waitForTimeout(100);
  const hotBubble = await page.$eval('.env-bubble[data-mark="axon-1"]', (b) => b.classList.contains('is-hot'));
  check('tlp: hovering Axon 1 highlights its mark', hotBubble && (await dbg(page)).hot === 'axon-1');
  const b2 = await page.$eval('.env-bubble[data-mark="axon-2"]', (b) => { const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.move(b2[0], b2[1]);
  await page.waitForTimeout(100);
  check('tlp: hovering mark 2 highlights Axon 2', (await page.$eval('.env-title[data-drawing="axon-2"]', (t) => t.classList.contains('is-hot'))));
  await page.mouse.move(5, 300);

  /* wheel zooms, to the cursor */
  d = await dbg(page);
  const s0 = d.camera.s;
  const probe = [700, 300];
  const before = await page.evaluate(([x, y]) => window.__env.sheet.debug().drawings.find((q) => q.id === 'hero').screen, probe);
  await page.mouse.move(probe[0], probe[1]);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(150);
  d = await dbg(page);
  check('tlp: wheel zooms in', d.camera.s > s0 * 1.2, `s ${s0.toFixed(2)} -> ${d.camera.s.toFixed(2)}`);
  const after = d.drawings.find((q) => q.id === 'hero').screen;
  /* zoom about the cursor: a hero corner moves away from the cursor by the zoom ratio */
  const ratio = d.camera.s / s0;
  const exp = [probe[0] + (before[0][0] - probe[0]) * ratio, probe[1] + (before[0][1] - probe[1]) * ratio];
  check('tlp: wheel zoom is anchored at the cursor', dist(exp, after[0]) < 1.5, `corner off by ${dist(exp, after[0]).toFixed(2)} px`);
  await page.click('.env-home');
  await settle(page);

  /* right-drag orbits and ghosts */
  d = await dbg(page);
  const k0 = camKey(d.camera);
  await page.mouse.move(1000, 300);
  await page.mouse.down({ button: 'right' });
  for (let i = 1; i <= 10; i++) await page.mouse.move(1000 + i * 14, 300 + i * 6);
  await page.mouse.up({ button: 'right' });
  await page.waitForTimeout(150);
  d = await dbg(page);
  check('tlp: right-drag orbits the camera', camKey(d.camera) !== k0 && qAngle(d.camera.q, [-0.2391176, 0.3696438, 0.0990458, 0.8923991]) > 0.3,
    `off home by ${qAngle(d.camera.q, [-0.2391176, 0.3696438, 0.0990458, 0.8923991]).toFixed(3)} rad`);
  check('tlp: orbiting ghosts the drawings', d.ghost > 0.99 && Math.abs(d.lineOpacity - 0.15) < 0.01 && Math.abs(d.rasterOpacity - 0.15) < 0.01,
    `ghost ${d.ghost.toFixed(2)}, line opacity ${d.lineOpacity.toFixed(2)}, raster opacity ${d.rasterOpacity.toFixed(2)}`);
  const menu = await page.evaluate(() => {
    const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 600, clientY: 300 });
    return !document.querySelector('.env-stage').dispatchEvent(e);
  });
  check('tlp: context menu suppressed over the canvas', menu);
  await page.screenshot({ path: `${SHOTS}/env-tlp-orbited.png` });

  /* shift+right-drag pans (orientation kept); ctrl+right-drag zooms */
  const q1 = d.camera.q, s1 = d.camera.s;
  await page.keyboard.down('Shift');
  await page.mouse.move(800, 300); await page.mouse.down({ button: 'right' });
  for (let i = 1; i <= 6; i++) await page.mouse.move(800 + i * 10, 300);
  await page.mouse.up({ button: 'right' });
  await page.keyboard.up('Shift');
  d = await dbg(page);
  check('tlp: shift+right-drag pans without turning', qAngle(d.camera.q, q1) < 1e-6 && Math.abs(d.camera.s - s1) < 1e-9);
  await page.keyboard.down('Control');
  await page.mouse.move(800, 300); await page.mouse.down({ button: 'right' });
  for (let i = 1; i <= 6; i++) await page.mouse.move(800, 300 - i * 10);
  await page.mouse.up({ button: 'right' });
  await page.keyboard.up('Control');
  d = await dbg(page);
  check('tlp: ctrl+right-drag zooms', d.camera.s > s1 * 1.1 && qAngle(d.camera.q, q1) < 1e-6, `s ${s1.toFixed(2)} -> ${d.camera.s.toFixed(2)}`);

  /* clicking a ghosted drawing snaps home */
  /* any visible point of any drawing, found with the sheet's own hit test */
  const hit = await page.evaluate(() => {
    for (let y = 120; y < 540; y += 20) for (let x = 40; x < 1400; x += 20) {
      const id = window.__env.sheet.drawingAt(x, y);
      if (id) return { id, x, y };
    }
    return null;
  });
  const target = hit ? { id: hit.id } : null;
  const hc = hit ? [hit.x, hit.y] : [0, 0];
  const onStage = !!target;
  console.log(`      (clicking ghosted ${target ? target.id : 'nothing'} at ${hc.map((v) => v.toFixed(0))})`);
  await page.mouse.click(hc[0], hc[1]);
  await settle(page);
  d = await dbg(page);
  check('tlp: clicking a ghosted drawing restores the home view', onStage && d.ghost === 0 && qAngle(d.camera.q, [-0.2391176, 0.3696438, 0.0990458, 0.8923991]) < 2e-3,
    `ghost ${d.ghost}, lines ${d.lineOpacity}`);

  /* the Section A title snaps to the section's own view */
  await page.click('.env-title[data-drawing="section"]');
  await settle(page);
  d = await dbg(page);
  check('tlp: Section A title snaps to the section view (camera looks along the wall)', Math.abs(d.camera.back[0]) > 0.999,
    `camera back ${d.camera.back.map((v) => v.toFixed(4))}`);
  const mS = d.marks.find((m) => m.id === 'section');
  const bb = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const mb = bb(mS.corners), eb = bb(mS.endFace);
  const m = mS.marginPx + 1;
  check('tlp: in the section view the mark frames the end face', Math.abs(mb[0] - (eb[0] - mS.marginPx)) < m && Math.abs(mb[2] - (eb[2] + mS.marginPx)) < m &&
    Math.abs(mb[1] - (eb[1] - mS.marginPx)) < m && Math.abs(mb[3] - (eb[3] + mS.marginPx)) < m,
    `mark ${mb.map((v) => v.toFixed(0))} vs face ${eb.map((v) => v.toFixed(0))} (margin ${mS.marginPx.toFixed(1)} px)`);
  await page.screenshot({ path: `${SHOTS}/env-tlp-section-a.png` });

  /* the A bubble snaps too; axon-1's bubble to axon-1's view */
  await page.click('.env-home'); await settle(page);
  await page.click('.env-bubble[data-mark="axon-1"]'); await settle(page);
  d = await dbg(page);
  const v1 = [0.89331, 0.26221, 0.36504];                /* rhino (x, y, z) -> glb (x, z, -y), toward the viewer */
  const dot1 = d.camera.back[0] * v1[0] + d.camera.back[1] * v1[1] + d.camera.back[2] * v1[2];
  check('tlp: mark 1 snaps to Axon 1\'s fitted view', dot1 > 0.999, `back . viewDir = ${dot1.toFixed(5)}`);
  await page.screenshot({ path: `${SHOTS}/env-tlp-axon-1.png` });
  await page.click('.env-home'); await settle(page);

  /* CYOA: a choice reveals its section and moves the camera */
  const hiddenBefore = await page.$eval('.env-section[data-section="process"]', (e) => getComputedStyle(e).display === 'none');
  const camBefore = camKey((await dbg(page)).camera);
  await page.click('.env-choice[data-choose="process"]');
  await settle(page);
  d = await dbg(page);
  const shownAfter = await page.$eval('.env-section[data-section="process"]', (e) => getComputedStyle(e).display !== 'none');
  check('tlp: choosing Process reveals its section', hiddenBefore && shownAfter);
  check('tlp: choosing Process moves the camera', camKey(d.camera) !== camBefore, `${camBefore} -> ${camKey(d.camera)}`);
  const beat1 = await page.$eval('.narration[data-beat="1"]', (e) => getComputedStyle(e).display !== 'none');
  const beat2 = await page.$eval('.narration[data-beat="2"]', (e) => getComputedStyle(e).display !== 'none');
  check('tlp: the choice reaches the next Narration beat only', beat1 && !beat2);
  await page.click('.env-choice[data-choose="outcome"]');
  await settle(page);
  d = await dbg(page);
  const dotO = d.camera.back[0] * v1[0] + d.camera.back[1] * v1[1] + d.camera.back[2] * v1[2];
  check('tlp: Outcome flies to Axon 1\'s view (proposed)', dotO > 0.999 && d.ghost > 0.99, `back . viewDir = ${dotO.toFixed(5)}`);
  const order = await page.$$eval('.env-panel-scroll > .env-section.is-revealed', (els) => els.map((e) => [e.dataset.section, +e.style.order]));
  check('tlp: revealed sections read in the order chosen', order.find((o) => o[0] === 'process')[1] < order.find((o) => o[0] === 'outcome')[1], JSON.stringify(order));
  const cross = await visible(page, '.crossing-narrative');
  const crossPlain = await visible(page, '.crossing-plain');
  check('tlp story on: narrative crossing label shows, plain hidden', cross.every(Boolean) && crossPlain.every((v) => !v));
  await ctx.close();
}

/* ---------- TLP: JS added no text (DOM text vs served HTML text) ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, PAGES.tlp.url, 'tlp-text', sink);
  await page.click('.env-choice[data-choose="story"]'); await settle(page);
  const live = await page.evaluate(() => {
    const t = document.body.cloneNode(true);
    t.querySelectorAll('script, svg').forEach((n) => n.remove());
    return t.textContent.replace(/\s+/g, ' ').trim();
  });
  const served = await page.evaluate(async (u) => {
    const doc = new DOMParser().parseFromString(await (await fetch(u)).text(), 'text/html');
    doc.body.querySelectorAll('script, svg').forEach((n) => n.remove());
    return doc.body.textContent.replace(/\s+/g, ' ').trim();
  }, PAGES.tlp.url);
  check('tlp: JavaScript added no text', live === served, live === served ? `${live.length} chars, identical` : `live ${live.length} vs served ${served.length}`);
  await ctx.close();
}

/* ---------- TLP: story off, reduced motion, no WebGL ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, `${PAGES.tlp.url}?story=off`, 'tlp-off', sink);
  const secs = await visible(page, '.env-section');
  const narr = await visible(page, '.narration-line');
  const choices = await visible(page, '.env-choices');
  check('tlp story off: every section visible, no gating', secs.length === 5 && secs.every(Boolean));
  check('tlp story off: Narration and choices hidden', narr.every((v) => !v) && choices.every((v) => !v));
  check('tlp story off: plain crossing labels', (await visible(page, '.crossing-plain')).every(Boolean) && (await visible(page, '.crossing-narrative')).every((v) => !v));
  const sc = await scrollerInfo(page);
  check('tlp story off: the panel scrolls', sc.sh > sc.ch && sc.moved > 0, JSON.stringify(sc));
  const ps = await noPageScroll(page);
  check('tlp story off: the page still never scrolls', ps.sh === ps.ih && ps.y === 0, JSON.stringify(ps));
  await page.evaluate(() => { document.querySelector('.env-panel-scroll').scrollTop = 160; });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${SHOTS}/env-tlp-story-off.png` });
  /* the toggle remembers */
  await page.goto(PAGES.tlp.url);
  await page.waitForFunction(() => window.__env && window.__env.sheet);
  await page.click('.story-toggle');
  const stored = await page.evaluate(() => [document.documentElement.dataset.story, localStorage.getItem('esa-story')]);
  await page.reload();
  await page.waitForFunction(() => window.__env);
  const afterReload = await page.evaluate(() => document.documentElement.dataset.story);
  check('tlp: the story toggle persists in localStorage', stored[0] === 'off' && stored[1] === 'off' && afterReload === 'off', JSON.stringify([stored, afterReload]));
  await page.evaluate(() => localStorage.removeItem('esa-story'));
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await open(ctx, PAGES.tlp.url, 'tlp-rm', sink);
  const c0 = camKey((await dbg(page)).camera);
  await page.click('.env-choice[data-choose="whatIDid"]');
  await page.waitForTimeout(50);
  const d = await dbg(page);
  check('tlp reduced motion: the camera cuts', !d.flying && camKey(d.camera) !== c0);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, `${PAGES.tlp.url}?webgl=off`, 'tlp-nogl', sink);
  const st = await page.evaluate(() => ({
    nosheet: document.documentElement.classList.contains('env-nosheet'),
    panelTop: document.querySelector('.env-panel').getBoundingClientRect().top,
    sheet: !!window.__env.sheet,
  }));
  const secs = await visible(page, '.env-section');
  check('tlp no WebGL: the panel is the whole Document', st.nosheet && !st.sheet && st.panelTop < 120 && secs.every(Boolean), JSON.stringify(st));
  check('tlp no WebGL: links to the generated page', (await visible(page, '.env-fallback-note')).every(Boolean));
  await page.screenshot({ path: `${SHOTS}/env-tlp-nowebgl.png` });
  await ctx.close();
}

/* ---------- touch helpers (CDP) ---------- */
async function touchDrag(page, cdp, tracks, steps = 8) {
  const pts = (i) => tracks.map((t, id) => ({ x: t[0][0] + (t[1][0] - t[0][0]) * i / steps, y: t[0][1] + (t[1][1] - t[0][1]) * i / steps, id }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
  for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(i) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(120);
}

/* ---------- TLP, phone ---------- */
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
  const page = await open(ctx, PAGES.tlp.url, 'tlp-phone', sink);
  await page.waitForTimeout(2600);
  const ps = await noPageScroll(page);
  check('tlp phone: no horizontal scroll, no page scroll', ps.sw <= ps.iw && ps.sh === ps.ih && ps.x === 0, JSON.stringify(ps));
  const cur = await page.$$eval('.narration-line.is-current', (els) => els.map((e) => e.offsetHeight > 0));
  const others = await page.$$eval('.env-panel-scroll > .env-head', (els) => els.map((e) => e.offsetHeight));
  check('tlp phone: collapsed sheet shows only the current Narration line', cur.length === 1 && cur[0] && others.every((h) => h === 0));
  await page.screenshot({ path: `${SHOTS}/env-tlp-phone.png` });
  const cdp = await ctx.newCDPSession(page);
  let d = await dbg(page);
  const c0 = d.camera;
  await touchDrag(page, cdp, [[[200, 300], [120, 260]]]);
  d = await dbg(page);
  check('tlp phone: one-finger drag pans', qAngle(d.camera.q, c0.q) < 1e-6 && dist(d.camera.T, c0.T) > 0.5, `T moved ${dist(d.camera.T, c0.T).toFixed(2)}`);
  const c1 = d.camera;
  await touchDrag(page, cdp, [[[150, 300], [100, 300]], [[250, 300], [300, 300]]]);
  d = await dbg(page);
  check('tlp phone: pinch zooms', d.camera.s > c1.s * 1.5, `s ${c1.s.toFixed(2)} -> ${d.camera.s.toFixed(2)}`);
  const c2 = d.camera;
  await touchDrag(page, cdp, [[[150, 300], [190, 360]], [[250, 300], [290, 360]]]);
  d = await dbg(page);
  check('tlp phone: two-finger drag orbits', qAngle(d.camera.q, c2.q) > 0.1 && d.ghost > 0.5, `turned ${qAngle(d.camera.q, c2.q).toFixed(3)} rad`);
  const h0 = await page.$eval('.env-panel', (p) => p.getBoundingClientRect().height);
  await page.tap('.env-handle');
  await page.waitForTimeout(450);
  const h1 = await page.$eval('.env-panel', (p) => [p.getBoundingClientRect().height, p.dataset.sheet]);
  check('tlp phone: tapping the handle expands the panel', h1[1] === 'expanded' && h1[0] > h0 * 3, `${h0.toFixed(0)} -> ${h1[0].toFixed(0)} px`);
  await page.tap('.env-choice[data-choose="story"]');
  await page.waitForTimeout(300);
  const ps2 = await noPageScroll(page);
  check('tlp phone: still no horizontal scroll with the sheet open', ps2.sw <= ps2.iw && ps2.x === 0, JSON.stringify(ps2));
  await page.screenshot({ path: `${SHOTS}/env-tlp-phone-expanded.png` });
  await ctx.close();
}

/* ---------- PLT ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    window.__contexts = [];
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) { window.__contexts.push(type); return orig.call(this, type, ...rest); };
  });
  const page = await open(ctx, PAGES.plt.url, 'plt', sink);
  await page.waitForTimeout(2600);
  const ctxs = await page.evaluate(() => window.__contexts);
  check('plt: never creates a WebGL context', ctxs.every((t) => !/webgl/i.test(t)), `contexts: ${JSON.stringify(ctxs)}`);
  const three = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => /three/.test(r.name)).length);
  check('plt: three.js is never loaded', three === 0);
  let d = await dbg(page);
  check('plt: flat sheet is up', d && d.webgl === false && d.dots > 0);
  const canoe = d.drawings.find((x) => x.id === 'plt-canoe');
  check('plt: arrival frames the hero drawing', canoe.screen[0] > 0 && canoe.screen[2] < 1440 && canoe.screen[1] > 60, JSON.stringify(canoe.screen.map((v) => +v.toFixed(0))));
  await page.screenshot({ path: `${SHOTS}/env-plt-arrival.png` });
  const ps = await noPageScroll(page);
  check('plt: the page never scrolls', ps.sh === ps.ih && ps.y === 0 && ps.sw <= ps.iw, JSON.stringify(ps));

  const c0 = d.camera;
  await page.mouse.move(700, 300); await page.mouse.down({ button: 'right' });
  for (let i = 1; i <= 8; i++) await page.mouse.move(700 + i * 12, 300 + i * 5);
  await page.mouse.up({ button: 'right' });
  d = await dbg(page);
  check('plt: right-drag pans (no orbit, no tilt)', Math.abs(d.camera.s - c0.s) < 1e-9 && dist(d.camera.T, c0.T) > 1 && !d.camera.q, `T ${c0.T.map((v) => v.toFixed(1))} -> ${d.camera.T.map((v) => v.toFixed(1))}`);
  const s0 = d.camera.s;
  await page.mouse.move(600, 300); await page.mouse.wheel(0, -300); await page.waitForTimeout(100);
  d = await dbg(page);
  check('plt: wheel zooms', d.camera.s > s0 * 1.2, `s ${s0.toFixed(2)} -> ${d.camera.s.toFixed(2)}`);
  const camBefore = camKey(d.camera);
  await page.click('.env-choice[data-choose="outcome"]');
  await settle(page);
  d = await dbg(page);
  check('plt: choosing Outcome reveals it and moves the camera to the poster',
    camKey(d.camera) !== camBefore && (await page.$eval('.env-section[data-section="outcome"]', (e) => getComputedStyle(e).display !== 'none')));
  const poster = d.drawings.find((x) => x.id === 'plt-poster').screen;
  check('plt: the poster is framed', poster[0] >= 0 && poster[2] <= 1440, JSON.stringify(poster.map((v) => +v.toFixed(0))));
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, `${PAGES.plt.url}?story=off`, 'plt-off', sink);
  await page.waitForTimeout(2600);
  const secs = await visible(page, '.env-section');
  check('plt story off: every section visible', secs.length === 5 && secs.every(Boolean));
  const sc = await scrollerInfo(page);
  check('plt story off: the panel scrolls, the page does not', sc.sh > sc.ch && (await noPageScroll(page)).y === 0, JSON.stringify(sc));
  await page.screenshot({ path: `${SHOTS}/env-plt-story-off.png` });
  await ctx.close();
}
{
  const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
  const page = await open(ctx, PAGES.plt.url, 'plt-phone', sink);
  const ps = await noPageScroll(page);
  check('plt phone: no horizontal scroll', ps.sw <= ps.iw && ps.x === 0, JSON.stringify(ps));
  const cdp = await ctx.newCDPSession(page);
  let d = await dbg(page);
  const c0 = d.camera;
  await touchDrag(page, cdp, [[[150, 300], [190, 360]], [[250, 300], [290, 360]]]);
  d = await dbg(page);
  check('plt phone: two-finger drag pans, never turns', dist(d.camera.T, c0.T) > 0.5 && !d.camera.q);
  await page.tap('.env-handle'); await page.waitForTimeout(450);
  check('plt phone: the panel expands', (await page.$eval('.env-panel', (p) => p.dataset.sheet)) === 'expanded');
  await page.screenshot({ path: `${SHOTS}/env-plt-phone.png` });
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, `${PAGES.tlp.url}?theme=light`, 'tlp-light', sink);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${SHOTS}/env-tlp-light.png` });
  await ctx.close();
}

await browser.close();
check('zero console errors, page errors, 404s or failed requests on both pages', sink.length === 0, sink.join('\n      '));
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
