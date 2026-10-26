#!/usr/bin/env bun
/**
 * Renders images/plates/<model>.png: each model Plate's still, in plan, for the no-JS index
 * (scripts/build-index.js points each model Plate's <img> at it). The browser draws its own
 * stills in the page's colours; this one is drawn once in the dark paper's ink on a
 * transparent ground, and css/index-sheet.css inverts it on light paper.
 *
 * It runs the same code the page runs (js/index-sheet/platestill.js) in headless Chromium,
 * so it needs a browser and playwright-core, neither of which the site depends on:
 *
 *   PLAYWRIGHT_CORE=/path/to/playwright-core/index.mjs \
 *   CHROME=/path/to/chrome \
 *   bun scripts/render-model-stills.js
 *
 * Rerun it when a model or a model Plate's size changes, then rerun build-index.js.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as DATA from '../data/plates.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PX_PER_STEP = 20;
const DARK = { ink: '#e9ecee', paper: '#14171a', plate: '#0d0f11' };   /* css/style.css's dark tokens */
const TIMEOUT_MS = 60000;

const fail = (msg) => { console.error(`render-model-stills: ${msg}`); process.exit(1); };
const { PLAYWRIGHT_CORE, CHROME } = process.env;
if (!PLAYWRIGHT_CORE || !existsSync(PLAYWRIGHT_CORE)) fail('set PLAYWRIGHT_CORE to playwright-core/index.mjs');
if (!CHROME || !existsSync(CHROME)) fail('set CHROME to a Chromium executable');

const jobs = DATA.PLATES.filter((p) => p.model).map((p) => ({
  model: p.model, w: (p.size === 'wide' ? 60 : 28) * PX_PER_STEP, h: 28 * PX_PER_STEP,
}));
if (!jobs.length) fail('no model Plates in data/plates.js');

const HARNESS = `<!DOCTYPE html><html><head><script type="importmap">{"imports":{
  "three":"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
  "three/addons/":"https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"}}</script></head><body>
<script type="module">
import { renderStills } from '/js/index-sheet/platestill.js';
window.__render = async (jobs, colours) => Object.fromEntries(await renderStills(jobs, colours));
window.__ready = true;
</script></body></html>`;

const server = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (path === '/favicon.ico') return new Response(null, { status: 204 });   /* the browser asks; the harness has none */
    if (path === '/__harness.html') return new Response(HARNESS, { headers: { 'content-type': 'text/html' } });
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) return new Response('forbidden', { status: 403 });
    const f = Bun.file(file);
    return f.size ? new Response(f) : new Response('not found', { status: 404 });
  },
});

const { chromium } = await import(pathToFileURL(PLAYWRIGHT_CORE).href);
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${server.port}/__harness.html`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: TIMEOUT_MS });
  const out = await page.evaluate(([j, c]) => window.__render(j, c), [jobs, DARK]);
  if (errors.length) fail(`the page reported errors:\n  ${errors.join('\n  ')}`);
  mkdirSync(join(root, 'images/plates'), { recursive: true });
  for (const { model } of jobs) {
    const url = out[model];
    if (typeof url !== 'string' || !url.startsWith('data:image/png;base64,')) fail(`${model}: no still came back`);
    const file = join(root, `images/plates/${model}.png`);
    writeFileSync(file, Buffer.from(url.slice('data:image/png;base64,'.length), 'base64'));
    console.log(`wrote images/plates/${model}.png`);
  }
} finally {
  await browser.close();
  server.stop(true);
}
