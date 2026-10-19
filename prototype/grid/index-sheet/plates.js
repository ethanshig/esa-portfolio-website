/* PROTOTYPE (index map #8): variants e (letter grid) and f (square grid). Throwaway.
   The index as a field of Plates on the flat sheet (../project/sheet2d.js, unchanged controls).

   Grid, in dot steps. Every Plate corner sits on a bold lattice node (isBold in ../axon/dimetric.js:
   c even and c/2 + r even), which holds when widths are multiples of 4 and heights even:
     e  cell 28 x 36 (8.5 x 11 is 28 x 36.2), pitch 32 x 40, gutter 4; 11x17 = 2 cells = 60 x 36
     f  cell 28 x 28, pitch 32 x 32, gutter 4; wide = 60 x 28
   Images cover their cell (cropped); the rect's px is the cell's, and CSS sets object-fit: cover.

   Growth: the seed is the Plate with the highest total Facet similarity to all others, at the
   centre. Then, greedily: the unplaced Plate with the largest total similarity to the placed
   ones goes into the free frontier cell (two side-by-side free cells for a wide Plate) whose
   edge neighbours it matches best, plus a small pull toward more neighbours and the centre so
   the field stays a field. It stops when the Plates run out. similarity = shared Facets / 3. */
import { PLATES, RECORDS } from './plates-data.js';
import { renderStills } from './platestill.js';

const GRIDS = {
  e: { pw: 32, ph: 40, ch: 36 },
  f: { pw: 32, ph: 32, ch: 28 },
};
const GUTTER = 4;
const PX_PER_STEP = 20;                 /* resolution of the stills and the px aspect of the rects */
const NAV_H = 84;
const W_NEIGHBOURS = 0.15, W_CENTRE = 0.004;

export const sim = (a, b) => ((a.facets.subject === b.facets.subject) + (a.facets.skill === b.facets.skill) + (a.facets.product === b.facets.product)) / 3;

const svgData = (w, h, body) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);

/* ---------- placement ---------- */
function grow(variant) {
  const g = GRIDS[variant];
  const plates = PLATES.map((p, i) => ({ ...p, i, span: p.size === 'wide' ? 2 : 1 }));
  const n = plates.length;
  const S = plates.map((a) => plates.map((b) => (a === b ? 0 : sim(a, b))));
  const total = S.map((row) => row.reduce((t, x) => t + x, 0));
  let seed = 0;
  for (let i = 1; i < n; i++) if (total[i] > total[seed]) seed = i;

  const cells = new Map();              /* "c,r" -> plate index */
  const key = (c, r) => c + ',' + r;
  const put = (p, c, r) => { p.c = c; p.r = r; for (let k = 0; k < p.span; k++) cells.set(key(c + k, r), p.i); };
  const footprint = (c, r, span) => Array.from({ length: span }, (_, k) => [c + k, r]);
  const neighboursOf = (c, r, span) => {
    const set = new Set();
    for (const [x, y] of footprint(c, r, span)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const j = cells.get(key(x + dx, y + dy));
      if (j !== undefined) set.add(j);
    }
    return set;
  };

  const order = [];
  put(plates[seed], plates[seed].span === 2 ? -1 : 0, 0);
  order.push(seed);
  const placed = new Set([seed]);
  while (placed.size < n) {
    /* the unplaced Plate most like what is already down */
    let best = -1, bestT = -1, bestM = -1;
    for (let i = 0; i < n; i++) {
      if (placed.has(i)) continue;
      let t = 0, m = 0;
      for (const j of placed) { t += S[i][j]; m = Math.max(m, S[i][j]); }
      if (t > bestT + 1e-9 || (Math.abs(t - bestT) < 1e-9 && m > bestM)) { best = i; bestT = t; bestM = m; }
    }
    const p = plates[best];
    /* frontier starts: any free cell next to the field, and for a wide Plate the pair starting there or one left */
    const starts = new Set();
    for (const k of cells.keys()) {
      const [c, r] = k.split(',').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = c + dx, y = r + dy;
        for (let s = 0; s < p.span; s++) starts.add(key(x - s, y));
      }
    }
    let pick = null;
    for (const k of starts) {
      const [c, r] = k.split(',').map(Number);
      if (footprint(c, r, p.span).some(([x, y]) => cells.has(key(x, y)))) continue;
      const nb = neighboursOf(c, r, p.span);
      if (nb.size === 0) continue;
      let s = 0;
      for (const j of nb) s += S[best][j];
      const cx = (c + p.span / 2) * g.pw, cy = (r + 0.5) * g.ph;
      const score = s + W_NEIGHBOURS * nb.size - W_CENTRE * Math.hypot(cx, cy);
      if (!pick || score > pick.score + 1e-9) pick = { c, r, score };
    }
    put(p, pick.c, pick.r);
    placed.add(best);
    order.push(best);
  }

  /* edge-adjacent pairs and their mean similarity */
  const pairs = new Set();
  for (const p of plates) for (const j of neighboursOf(p.c, p.r, p.span)) if (j !== p.i) pairs.add(Math.min(p.i, j) + '-' + Math.max(p.i, j));
  let sum = 0;
  for (const k of pairs) { const [a, b] = k.split('-').map(Number); sum += S[a][b]; }
  return { plates, order, seed, cells, meanEdge: pairs.size ? sum / pairs.size : 0, edgePairs: pairs.size, neighboursOf };
}

/* ---------- the layout handed to sheet2d ---------- */
export function layoutPlates(variant, W, H) {
  const g = GRIDS[variant];
  const G = grow(variant);
  for (const p of G.plates) {
    p.rect = { u0: p.c * g.pw, v0: p.r * g.ph, u1: p.c * g.pw + p.span * g.pw - GUTTER, v1: p.r * g.ph + g.ch };
    p.wSteps = p.rect.u1 - p.rect.u0;
    p.hSteps = p.rect.v1 - p.rect.v0;
    p.href = RECORDS[p.record].href;
    p.active = RECORDS[p.record].status === 'active';
    p.placeholder = !p.href;
  }
  /* Records in the order they first appear in the growth; each one's hero is its first Plate down */
  const records = [];
  for (const i of G.order) {
    const p = G.plates[i];
    if (!records.find((r) => r.id === p.record)) records.push({ id: p.record, hero: p });
  }
  const px = (p) => [p.wSteps * PX_PER_STEP, p.hSteps * PX_PER_STEP];
  /* sheet2d gets the real Plates only: placeholders are drawn by the overlay and never picked */
  const drawings = G.plates.filter((p) => !p.placeholder).map((p) => ({
    id: p.id, at: [p.rect.u0, p.rect.v0], w: p.wSteps, px: px(p),
    src: p.src || svgData(...px(p), `<rect width="100%" height="100%" fill="${getComputedStyle(document.documentElement).getPropertyValue('--color-bg-alt').trim() || '#14171a'}"/>`),
  }));
  const frame = (p) => frameAround(p, g, W, H);
  return { variant, g, ...G, records, drawings, frame, arrival: { camera: frame(G.plates[G.seed]) } };
}

/* a camera on a Plate that shows at most 3 cells across and 2 down (Ethan, 2026-10-18): the larger of
   the two fits wins, so neither count is exceeded. Centred on the Plate's column; its row starts just
   under the nav, so the Plate shows whole and whatever room is left shows the row below. */
function frameAround(p, g, W, H) {
  const fw = W, fh = H - NAV_H;
  const s = Math.max(fw / (3 * g.pw), fh / (2 * g.ph));
  return { T: [(p.rect.u0 + p.rect.u1) / 2, p.rect.v0 - GUTTER / 2 + (H / 2 - NAV_H) / s], s };
}

/* ---------- 2:1 dimetric arrow, in dot steps from its tail node ----------
   The arrow lies flat on the paper along the plan diagonal x - z, which projects to screen-horizontal
   (dimetric.js: x -> (2, 1), z -> (-2, 1)). In (a along, b across) plan units a point is
   x = a + b, z = b - a, so on screen it is (4a, 2b): every vertex is a bold node. It is
   extruded 2 steps up (the paper's "verticals 2 steps"), which keeps the top face on bold nodes too. */
const ARROW = [[0, -1], [2, -1], [2, -2], [4, 0], [2, 2], [2, 1], [0, 1]];
const ARROW_K = 0.75 / 4;          /* scaled to 3 steps long, so it sits inside the 4-step gutter between two squares */
const LIFT = 1.2;                  /* steps of extrusion when hovered; 0 at rest (a flat, 2D arrow) */
const T_ARROW = 0.25;              /* s */
function arrowFaces(dir, lift = LIFT) {
  const base = ARROW.map(([a, b]) => [4 * a * dir * ARROW_K, 2 * b * ARROW_K]);
  const top = base.map(([u, v]) => [u, v - lift]);
  let area = 0;
  for (let i = 0; i < base.length; i++) { const [x0, y0] = base[i], [x1, y1] = base[(i + 1) % base.length]; area += x0 * y1 - x1 * y0; }
  const sides = [];
  for (let i = 0; i < base.length; i++) {
    const j = (i + 1) % base.length;
    const [x0, y0] = base[i], [x1, y1] = base[j];
    /* outward normal of the edge; the face is seen when it points down-screen (toward the viewer) */
    const ny = area > 0 ? -(x1 - x0) : (x1 - x0);       /* outward normal (dy, -dx) when area > 0 */
    if (ny > 1e-9) sides.push({ pts: [base[i], base[j], top[j], top[i]], depth: (y0 + y1) / 2 });
  }
  sides.sort((a, b) => a.depth - b.depth);
  return { sides: sides.map((s) => s.pts), top };
}

/* ---------- live: the overlay (placeholders, dotted outlines), arrows, hover, stills ---------- */
export function attachPlates({ sheet, stage, layout, reduceMotion }) {
  const L = layout;
  const css = (n, f) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = stage.querySelector('.ix-plates-svg');
  const overlay = stage.querySelector('.env-overlay');
  const shapes = L.plates.map((p) => {
    const g = document.createElementNS(NS, 'g');
    let frame = null, dots = null;
    if (p.placeholder) {
      frame = document.createElementNS(NS, 'rect');
      frame.setAttribute('class', 'ix-ph');
      g.appendChild(frame);
    }
    if (p.active) {
      dots = document.createElementNS(NS, 'rect');
      dots.setAttribute('class', 'ix-active');
      g.appendChild(dots);
    }
    svg.appendChild(g);
    const title = p.placeholder ? overlay.querySelector(`.ix-plate-title[data-plate="${p.id}"]`) : null;
    if (p.placeholder && !title) console.warn(`[plates] ${p.id}: no title in the HTML`);
    return { p, frame, dots, title };
  });

  /* the arrows: buttons in the HTML holding an empty svg; JS draws the shape only */
  const btns = [...stage.querySelectorAll('.ix-axarrow')];
  const arrowSvg = new Map();
  for (const b of btns) {
    b.hidden = false;
    const dir = Number(b.dataset.dir);
    const s = b.querySelector('svg');
    const f = arrowFaces(dir);
    for (let i = 0; i < f.sides.length + 1; i++) s.appendChild(document.createElementNS(NS, 'polygon'));
    const a = { dir, s, polys: [...s.querySelectorAll('polygon')], all: [...f.sides.flat(), ...f.top], lift: { from: 0, to: 0, t0: 0 } };
    const aim = (to) => { const now = performance.now() / 1000; a.lift = { from: liftOf(a, now), to, t0: now }; };
    b.addEventListener('pointerenter', () => aim(1));
    b.addEventListener('pointerleave', () => aim(0));
    b.addEventListener('focus', () => aim(1));
    b.addEventListener('blur', () => aim(0));
    arrowSvg.set(b, a);
  }
  function liftOf(a, now) {
    if (reduceMotion) return a.lift.to;
    const u = Math.min(1, Math.max(0, (now - a.lift.t0) / T_ARROW));
    return a.lift.from + (a.lift.to - a.lift.from) * (0.5 - 0.5 * Math.cos(Math.PI * u));
  }

  const W = () => window.innerWidth, H = () => window.innerHeight;
  const centre = (p) => [(p.rect.u0 + p.rect.u1) / 2, (p.rect.v0 + p.rect.v1) / 2];
  function currentIndex() {
    const { camera } = sheet.debug();
    const Tc = [camera.T[0], camera.T[1] + (NAV_H / 2) / camera.s];
    let best = 0, bd = Infinity;
    L.records.forEach((r, i) => { const [u, v] = centre(r.hero); const d = Math.hypot(u - Tc[0], v - Tc[1]); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function step(dir) {
    const i = currentIndex();
    const j = (i + dir + L.records.length) % L.records.length;
    sheet.show({ camera: L.frame(L.records[j].hero, L.g, W(), H()) }, { animate: !reduceMotion });
  }
  for (const b of btns) b.addEventListener('click', (e) => { e.stopPropagation(); step(Number(b.dataset.dir)); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  /* placeholder hover: sheet2d never sees placeholders, so their titles are shown here */
  let phHot = null;
  const setPh = (sh) => {
    if (phHot === sh) return;
    if (phHot && phHot.title) phHot.title.classList.remove('is-hot');
    phHot = sh;
    if (phHot && phHot.title) phHot.title.classList.add('is-hot');
  };
  stage.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    if (e.target.closest && e.target.closest('button, a')) { setPh(null); return; }
    const { camera } = sheet.debug();
    const r = stage.getBoundingClientRect();
    const u = camera.T[0] + (e.clientX - r.left - r.width / 2) / camera.s, v = camera.T[1] + (e.clientY - r.top - r.height / 2) / camera.s;
    setPh(shapes.find((sh) => sh.p.placeholder && u >= sh.p.rect.u0 && u <= sh.p.rect.u1 && v >= sh.p.rect.v0 && v <= sh.p.rect.v1) || null);
  });
  stage.addEventListener('pointerleave', () => setPh(null));

  /* per frame: redraw only when the camera moved */
  let lastKey = '';
  let cur = 0;
  function draw() {
    const { camera } = sheet.debug();
    const k = `${camera.T[0].toFixed(3)}|${camera.T[1].toFixed(3)}|${camera.s.toFixed(4)}|${W()}|${H()}`;
    cur = currentIndex();
    if (k !== lastKey) {
      lastKey = k;
      const s = camera.s;
      svg.setAttribute('width', W()); svg.setAttribute('height', H());
      for (const sh of shapes) {
        const [x0, y0] = sheet.toScreen(sh.p.rect.u0, sh.p.rect.v0), [x1, y1] = sheet.toScreen(sh.p.rect.u1, sh.p.rect.v1);
        if (sh.frame) {
          const inset = Math.min(3, s * 0.4);
          sh.frame.setAttribute('x', x0 + inset); sh.frame.setAttribute('y', y0 + inset);
          sh.frame.setAttribute('width', Math.max(0, x1 - x0 - 2 * inset)); sh.frame.setAttribute('height', Math.max(0, y1 - y0 - 2 * inset));
        }
        if (sh.dots) {
          const o = s * 1;                                     /* one step out, in the gutter */
          sh.dots.setAttribute('x', x0 - o); sh.dots.setAttribute('y', y0 - o);
          sh.dots.setAttribute('width', x1 - x0 + 2 * o); sh.dots.setAttribute('height', y1 - y0 + 2 * o);
          sh.dots.style.strokeDasharray = `0 ${Math.max(4, s * 0.9).toFixed(1)}`;
        }
        if (sh.title) {
          const [tx, ty] = sheet.toScreen(sh.p.rect.u0, sh.p.rect.v1 + 0.6);
          sh.title.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
        }
      }
    }
    /* arrows beside the current Record's hero: tail one gutter out, at the hero's mid row */
    const hero = L.records[cur].hero;
    const midV = hero.rect.v0 + Math.round((hero.rect.v1 - hero.rect.v0) / 4) * 2;   /* even row: a bold node */
    const nowS = performance.now() / 1000;
    const lifts = [...arrowSvg.values()].map((a) => liftOf(a, nowS).toFixed(3)).join(',');
    const ak = k + '|' + cur + '|' + lifts;
    if (ak !== draw.ak) {
      draw.ak = ak;
      for (const [b, a] of arrowSvg) {
        /* centred in the gutter beside the hero */
        const inset = (GUTTER - 4 * 4 * ARROW_K) / 2;
        const tail = a.dir > 0 ? [hero.rect.u1 + inset, midV] : [hero.rect.u0 - inset, midV];
        const f = arrowFaces(a.dir, LIFT * liftOf(a, nowS));
        const faces = [...f.sides, f.top];
        a.polys.forEach((poly, i) => { poly.dataset.pts = JSON.stringify(faces[i]); poly.classList.toggle('is-side', i < f.sides.length); });
        const s = camera.s;
        const us = a.all.map(([u]) => u), vs = a.all.map(([, v]) => v);
        const pad = 2;
        const minU = Math.min(...us), maxU = Math.max(...us), minV = Math.min(...vs), maxV = Math.max(...vs);
        const [bx, by] = sheet.toScreen(tail[0] + minU, tail[1] + minV);
        const bw = (maxU - minU) * s, bh = (maxV - minV) * s;
        b.style.transform = `translate(${(bx - pad).toFixed(1)}px, ${(by - pad).toFixed(1)}px)`;
        b.style.width = (bw + 2 * pad) + 'px'; b.style.height = (bh + 2 * pad) + 'px';
        a.s.setAttribute('viewBox', `${-pad} ${-pad} ${bw + 2 * pad} ${bh + 2 * pad}`);
        a.s.setAttribute('width', bw + 2 * pad); a.s.setAttribute('height', bh + 2 * pad);
        for (const poly of a.polys) {
          const pts = JSON.parse(poly.dataset.pts);
          poly.setAttribute('points', pts.map(([u, v]) => `${((u - minU) * s).toFixed(2)},${((v - minV) * s).toFixed(2)}`).join(' '));
        }
        b.dataset.tail = tail.join(',');
      }
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* model stills: rendered once offscreen, then swapped into their images (sheet2d appends in data order) */
  const imgs = [...stage.querySelectorAll('.env-plane .env-plane-img')];
  const real = L.plates.filter((p) => !p.placeholder);
  const modelPlates = real.filter((p) => p.model);
  const stills = { done: false, count: 0 };
  renderStills(modelPlates.map((p) => ({ model: p.model, w: p.wSteps * PX_PER_STEP, h: p.hSteps * PX_PER_STEP })), {
    ink: css('--color-primary', '#e9ecee'), paper: css('--color-bg-alt', '#14171a'), plate: css('--color-bg-alt', '#14171a'),
  }).then((map) => {
    for (const p of modelPlates) {
      const url = map.get(p.model);
      const img = imgs[real.indexOf(p)];
      if (url && img) { img.src = url; stills.count++; }
    }
    stills.done = true;
  });

  return {
    state() {
      const r = L.records[cur];
      return {
        variant: L.variant,
        plates: L.plates.length,
        records: L.records.length,
        seed: L.plates[L.seed].id,
        meanEdgeSim: Number(L.meanEdge.toFixed(3)),
        edgePairs: L.edgePairs,
        current: r.id,
        currentIndex: cur,
        hero: r.hero.id,
        order: L.records.map((x) => x.id),
        stills,
        camera: sheet.debug().camera,
        placement: L.plates.map((p) => ({ id: p.id, c: p.c, r: p.r, span: p.span })),
      };
    },
  };
}
