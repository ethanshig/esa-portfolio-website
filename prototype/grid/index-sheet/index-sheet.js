/* PROTOTYPE (index map #8, "Heroic hero layout"). Throwaway.
   The index as a flat sheet: ../project/sheet2d.js runs it unchanged (right/shift+right/middle-drag
   pan, wheel zoom, left-click opens), per "Pan the index, or scroll it". Each variant only decides
   where the heroes lie on the paper (in dot steps) and what the first view frames.
   Heroes are never cropped: every rect keeps its image's aspect. */
import { createSheet } from '../project/sheet2d.js';
import { createPairModel } from './pairmodel.js';
import { layoutPlates, attachPlates } from './plates.js';
import { attachThemeSwitch } from '../theme.js';

/* order is arbitrary for the prototype (order is still fog on the map); real heroes are spread out */
const PIECES = [
  { id: 'uss-lead', model: 'uss-lead-revival', src: '../../../images/tour/a273-gable.jpg', px: [2000, 1545], href: '../../../projects/uss-lead-revival.html' },
  { id: 'rap', aspect: 16 / 10 },
  { id: 'beavers-burden', model: 'beavers-burden', src: '../../../images/tour/bb-catamaraft.jpg', px: [1600, 1067], href: '../../../projects/beavers-burden.html' },
  { id: 'instruments', aspect: 4 / 5 },
  { id: 'ratio', aspect: 16 / 9 },
  { id: 'three-little-pigs', model: 'three-little-pigs', src: '../../../images/tour/tlp-axon.jpg', px: [1600, 1035], href: '../project/three-little-pigs/' },
  { id: 'blind-tools', aspect: 3 / 2 },
  { id: 'kingfisher', aspect: 1 },
  { id: 'artd451', aspect: 2 / 3 },
  { id: 'circuito', aspect: 3 / 2 },
  { id: 'mylo', model: 'mylo-to-go', src: '../../../images/tour/mylo-picnic.jpg', px: [1600, 1067], href: '../../../projects/mylo-to-go.html' },
];

/* a placeholder frame at a guessed aspect, so the layouts are judged at the real count of 11 */
function placeholder(aspect) {
  const w = 1200, h = Math.round(w / aspect);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="#1b1e23"/><rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="#3a3f47" stroke-width="4" stroke-dasharray="18 14"/>` +
    `<text x="50%" y="50%" fill="#5d636c" font-family="monospace" font-size="44" text-anchor="middle" dominant-baseline="middle">hero to come</text></svg>`;
  return { src: 'data:image/svg+xml,' + encodeURIComponent(svg), px: [w, h] };
}
const HEROES = PIECES.map((p) => (p.src ? p : { ...p, ...placeholder(p.aspect) }));
const aspectOf = (p) => p.px[0] / p.px[1];
const snap4 = (x) => Math.round(x / 4) * 4;          /* onto the bold (axon) lattice */

const NAV_H = 84;          /* css px the floating nav occupies at the top */
const TITLE = 2.4;         /* steps a title takes under its hero */

/* ---------- A: lead hero. One strip at one height; the first view is the lead, the next peeks in ---------- */
function layoutA(W, H) {
  const h = 32, gap = 12;
  let u = 0;
  const drawings = HEROES.map((p) => { const w = h * aspectOf(p); const d = { id: p.id, at: [u, 0], w }; u += w + gap; return d; });
  const lead = drawings[0], next = drawings[1];
  const s = Math.min(0.66 * (H - NAV_H) / (h + TITLE), 0.8 * W / lead.w);
  const centre = lead.w / 2, peek = next.at[0] - 0.42 * W / s, keepLead = 0.46 * W / s;
  const Tu = Math.min(keepLead, Math.max(centre, peek));
  const Tv = (h + TITLE) / 2 - NAV_H / 2 / s;
  return { drawings, arrival: { camera: { T: [Tu, Tv], s } } };
}

/* ---------- B: scaled field. Three scales, rows centred, every edge on the bold lattice; the two largest lead ---------- */
function layoutB(W, H) {
  const rows = [[0, 2, 26], [2, 6, 14], [6, 11, 10]];      /* [from, to, height in steps] */
  const gap = 4, rowGap = 8;
  const drawings = [];
  let v = 0, row1 = null;
  for (const [a, b, h] of rows) {
    const items = HEROES.slice(a, b);
    const total = items.reduce((t, p) => t + h * aspectOf(p), 0) + gap * (items.length - 1);
    let u = snap4(-total / 2);
    for (const p of items) { const w = h * aspectOf(p); drawings.push({ id: p.id, at: [u, v], w }); u = snap4(u + w + gap); }
    if (!row1) row1 = { u0: snap4(-total / 2), u1: snap4(-total / 2) + total, v0: v, v1: v + h + TITLE };
    v = snap4(v + h + TITLE + rowGap);
  }
  const s = Math.min(0.86 * W / (row1.u1 - row1.u0), 0.62 * (H - NAV_H) / (row1.v1 - row1.v0));
  const Tu = (row1.u0 + row1.u1) / 2;
  const Tv = row1.v0 + (H / 2 - NAV_H - 0.06 * H) / s;     /* row 1's top just under the nav; row 2 rises from the foot */
  return { drawings, arrival: { camera: { T: [Tu, Tv], s } } };
}

/* ---------- C: drawing set. Every hero alone in an equal sheet (contain-fit), 4 x 3. The first view is the
   whole set at a glance, like a set's cover sheet; a hero turns heroic as the reader zooms in ---------- */
function layoutC(W, H) {
  const cw = 48, ch = 36, inW = 38, inH = 26, cols = 4;
  const drawings = HEROES.map((p, i) => {
    const cu = (i % cols) * cw, cv = Math.floor(i / cols) * ch;
    const a = aspectOf(p);
    const w = Math.min(inW, inH * a), h = w / a;
    return { id: p.id, at: [cu + (cw - w) / 2, cv + 4 + (inH - h) / 2], w };
  });
  return { drawings, arrival: 'sheet' };
}

/* ---------- D: pair (KGDVS). Each hero is a photo and its model (or key drawing), side by side.
   A pair's view: the photo cover-fits the left half with its right edge on the screen's centre line,
   so whatever overflows runs off-screen onto the paper (never cropped: pan to it). The right half is
   paper; the model stands in its middle 60%. Arrows step pair to pair; panning stays free. ---------- */
const PH = 40;                      /* photo height, steps */
const PAIR_GAP = 16;
const blank = (w, h) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"/>`);
function zoneArt(w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" fill="none" stroke="#3a3f47" stroke-width="3" stroke-dasharray="14 12"/>` +
    `<text x="50%" y="50%" fill="#5d636c" font-family="monospace" font-size="30" text-anchor="middle" dominant-baseline="middle">model or key drawing to come</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
let PAIRS = [];
function layoutD(W, H) {
  const order = [...HEROES].sort((a, b) => (b.model ? 1 : 0) - (a.model ? 1 : 0));   /* real pieces first */
  const drawings = [];
  PAIRS = [];
  let u = 0;
  for (const p of order) {
    const pw = PH * aspectOf(p);
    const s = Math.max((W / 2) / pw, H / PH);                 /* cover the left half */
    const seam = u + pw, half = (W / 2) / s, vis = H / s;
    drawings.push({ id: p.id, at: [u, 0], w: pw });
    const zone = { u0: seam + 0.2 * half, u1: seam + 0.8 * half, v0: PH / 2 - 0.3 * vis, v1: PH / 2 + 0.3 * vis };
    const zw = zone.u1 - zone.u0, zh = zone.v1 - zone.v0;
    const zid = p.id + '-z';
    if (p.model) drawings.push({ id: zid, at: [zone.u0, zone.v0], w: zw, src: blank(400, Math.round(400 * zh / zw)), px: [400, Math.round(400 * zh / zw)] });
    else drawings.push({ id: zid, at: [zone.u0, zone.v0], w: zw, src: zoneArt(800, Math.round(800 * zh / zw)), px: [800, Math.round(800 * zh / zw)] });
    PAIRS.push({ id: p.id, model: p.model, zone, camera: { T: [seam, PH / 2], s } });
    u = seam + half + PAIR_GAP;
  }
  return { drawings, arrival: { camera: PAIRS[0].camera } };
}

/* ---------- E, F: a field of Plates (plates.js). e = letter grid (default), f = square grid ---------- */
let PLATE_LAYOUT = null;
const layoutPlateVariant = (v) => (W, H) => { PLATE_LAYOUT = layoutPlates(v, W, H); return { drawings: PLATE_LAYOUT.drawings, arrival: PLATE_LAYOUT.arrival }; };

const VARIANTS = { e: layoutPlateVariant('e'), f: layoutPlateVariant('f'), d: layoutD, a: layoutA, b: layoutB, c: layoutC };
const KEYS = Object.keys(VARIANTS);

/* ---------- boot ---------- */
const q = new URLSearchParams(location.search);
const variant = KEYS.includes(q.get('variant')) ? q.get('variant') : 'f';
if (variant === 'e' || variant === 'f') document.documentElement.classList.add('ix-plates', 'ix-plates-' + variant);
const W = window.innerWidth, H = window.innerHeight;
const { drawings, arrival } = VARIANTS[variant](W, H);
const byId = new Map(HEROES.map((p) => [p.id, p]));
const data = { drawings: drawings.map((d) => (d.src ? d : { ...d, src: byId.get(d.id).src, px: byId.get(d.id).px })) };
const views = new Map([['arrival', { section: 'arrival', target: arrival }]]);
const stage = document.querySelector('.env-stage');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sheet = await createSheet({
  stage, data, views, reduceMotion,
  freeRegion: () => ({ left: 0, right: window.innerWidth, top: NAV_H, bottom: window.innerHeight }),
  limits: (W, H) => (PLATE_LAYOUT ? PLATE_LAYOUT.limits(W, H) : null),
  onFocus(id) {
    if (PLATE_LAYOUT) { const p = PLATE_LAYOUT.plates.find((x) => x.id === id); if (p && p.href) location.href = p.href; return; }
    const p = byId.get(id.replace(/-z$/, '')); if (p && p.href) location.href = p.href;
  },
});
document.documentElement.classList.add('env-live');
window.addEventListener('resize', () => sheet.resize());

/* ---------- E, F: placeholders, dotted outlines, the dimetric arrows, model stills ---------- */
let plates = null;
if (PLATE_LAYOUT) {
  plates = attachPlates({ sheet, stage, layout: PLATE_LAYOUT, reduceMotion });
  const pub = () => { window.__plates = plates.state(); requestAnimationFrame(pub); };
  pub();
}

/* ---------- D: the live model and the arrows ---------- */
if (variant === 'd') {
  document.documentElement.classList.add('ix-pairs');
  const pm = createPairModel(stage, stage.querySelector('.env-overlay'));
  const prev = document.querySelector('.ix-arrow[data-dir="-1"]'), next = document.querySelector('.ix-arrow[data-dir="1"]');
  prev.hidden = next.hidden = false;
  const nearest = (cam) => {
    let best = 0, bd = Infinity;
    PAIRS.forEach((p, i) => { const d = Math.abs(p.camera.T[0] - cam.T[0]); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  const step = (dir) => {
    const i = nearest(sheet.debug().camera);
    const j = (i + dir + PAIRS.length) % PAIRS.length;
    sheet.show({ camera: PAIRS[j].camera });
  };
  for (const b of [prev, next]) b.addEventListener('click', () => step(Number(b.dataset.dir)));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
  });
  let over = false;
  stage.addEventListener('pointermove', (e) => {
    const cam = sheet.debug().camera, p = PAIRS[nearest(cam)];
    const u = cam.T[0] + (e.clientX - window.innerWidth / 2) / cam.s, v = cam.T[1] + (e.clientY - window.innerHeight / 2) / cam.s;
    over = !!p.model && u >= p.zone.u0 && u <= p.zone.u1 && v >= p.zone.v0 && v <= p.zone.v1;
    pm.setLift(over);
  });
  stage.addEventListener('pointerleave', () => pm.setLift(false));
  const tick = () => {
    const cam = sheet.debug().camera, p = PAIRS[nearest(cam)];
    if (pm.current !== (p.model || null)) pm.show(p.model || null);
    const z = p.zone;
    const x0 = window.innerWidth / 2 + (z.u0 - cam.T[0]) * cam.s, y0 = window.innerHeight / 2 + (z.v0 - cam.T[1]) * cam.s;
    pm.frame(p.model ? { x: x0, y: y0, w: (z.u1 - z.u0) * cam.s, h: (z.v1 - z.v0) * cam.s } : null, cam.s);
    window.__pair = { i: nearest(cam), id: p.id, model: pm.current, over };
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- the left-drag hint: once per session, only after a left-drag that moved nothing ---------- */
const hint = document.querySelector('.ix-hint');
let seen = false;
try { seen = sessionStorage.getItem('esa-index-hint') === '1'; } catch (e) { /* storage blocked: show it each load */ }
let press = null;
stage.addEventListener('pointerdown', (e) => { press = e.button === 0 && e.pointerType === 'mouse' ? [e.clientX, e.clientY] : null; }, true);
stage.addEventListener('pointermove', (e) => {
  if (!press || seen) return;
  if (Math.hypot(e.clientX - press[0], e.clientY - press[1]) < 12) return;
  seen = true; press = null;
  try { sessionStorage.setItem('esa-index-hint', '1'); } catch (err) { /* in-memory only */ }
  hint.hidden = false;
  requestAnimationFrame(() => hint.classList.add('is-on'));
  setTimeout(() => hint.classList.remove('is-on'), 3500);
}, true);
window.addEventListener('pointerup', () => { press = null; }, true);

/* ---------- light or dark: the nav's half-inked cell, the negative flip (../theme.js) ---------- */
attachThemeSwitch({
  button: document.querySelector('[data-theme-toggle]'),
  reduceMotion,
  onChange() {
    q.delete('theme');                                /* theme.js strips the URL; the variant switcher rebuilds it from q */
    sheet.resize();                                   /* the paper's dots read the page colours on redraw */
    return plates ? plates.retheme() : null;          /* the stills and plain cells are baked in page colours */
  },
});

/* ---------- PROTOTYPE switcher + state (localhost only) ---------- */
const bar = document.querySelector('.ix-proto');
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
  bar.hidden = false;
  bar.querySelector('[data-label]').textContent = variant.toUpperCase();
  bar.querySelector('[data-name]').textContent = bar.querySelector(`[data-variant-name="${variant}"]`).textContent;
  const go = (d) => { const n = KEYS[(KEYS.indexOf(variant) + d + KEYS.length) % KEYS.length]; q.set('variant', n); location.search = q.toString(); };
  bar.addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) go(Number(b.dataset.step)); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === '[') go(-1); else if (e.key === ']') go(1);
  });
  const stateEl = bar.querySelector('[data-state]');
  const report = () => {
    const { camera } = sheet.debug();
    const toX = (u) => window.innerWidth / 2 + (u - camera.T[0]) * camera.s;
    const toY = (v) => window.innerHeight / 2 + (v - camera.T[1]) * camera.s;
    let full = 0, part = 0, biggest = 0;
    for (const d of data.drawings.filter((x) => !x.id.endsWith('-z'))) {
      const h = d.w * d.px[1] / d.px[0];
      const x0 = toX(d.at[0]), x1 = toX(d.at[0] + d.w), y0 = toY(d.at[1]), y1 = toY(d.at[1] + h);
      const inX = x1 > 0 && x0 < window.innerWidth, inY = y1 > NAV_H && y0 < window.innerHeight;
      if (inX && inY) { if (x0 >= 0 && x1 <= window.innerWidth && y0 >= NAV_H && y1 <= window.innerHeight) full++; else part++; }
      if (inX && inY) biggest = Math.max(biggest, (y1 - y0) / window.innerHeight);
    }
    if (plates) {
      const st = plates.state();
      stateEl.textContent = `${st.plates} plates · ${st.records} records · seed ${st.seed} · edge sim ${st.meanEdgeSim.toFixed(2)} · on ${st.current} (${st.currentIndex + 1}/${st.records})`;
      window.__ix = { variant, camera };
      return;
    }
    stateEl.textContent = `${data.drawings.filter((x) => !x.id.endsWith('-z')).length} heroes · in view ${full} whole + ${part} cut · largest ${Math.round(biggest * 100)}% of height · ${camera.s.toFixed(1)} px/step`;
    window.__ix = { variant, full, part, biggest, camera };
  };
  setInterval(report, 400); report();
}
