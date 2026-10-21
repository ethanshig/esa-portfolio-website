/* PROTOTYPE (index map #8): variants e (letter grid) and f (square grid). Throwaway.
   The index as a field of Plates on the flat sheet (../project/sheet2d.js, unchanged controls).

   Grid, in dot steps. Every Plate corner sits on a bold lattice node (isBold in ../axon/dimetric.js:
   c even and c/2 + r even), which holds when widths are multiples of 4 and heights even:
     e  cell 28 x 36 (8.5 x 11 is 28 x 36.2), pitch 32 x 40, gutter 4; 11x17 = 2 cells = 60 x 36
     f  cell 28 x 28, pitch 32 x 32, gutter 4; wide = 60 x 28
     g  f's cells, grown into a column two cells wide, downward from the seed: the index under
        640px (#12, Ethan 2026-10-20)
   Images cover their cell (cropped); the rect's px is the cell's, and CSS sets object-fit: cover.

   Growth: the seed is the Plate with the highest total Facet similarity to all others, at the
   centre. Then, greedily: the unplaced Plate with the largest total similarity to the placed
   ones goes into the free frontier cell (two side-by-side free cells for a wide Plate) whose
   edge neighbours it matches best, plus a small pull toward more neighbours and the centre so
   the field stays a field. It stops when the Plates run out. similarity = shared Facets / 3. */
import { PLATES, RECORDS, FACETS } from './plates-data.js';
import { renderStills } from './platestill.js';
import { createPlateLive } from './platelive.js';

const GRIDS = {
  e: { pw: 32, ph: 40, ch: 36 },
  f: { pw: 32, ph: 32, ch: 28 },
  g: { pw: 32, ph: 32, ch: 28, cols: 2 },
};
const GUTTER = 4;
const PX_PER_STEP = 20;                 /* resolution of the stills and the px aspect of the rects */
const NAV_H = 84;
const W_NEIGHBOURS = 0.15, W_CENTRE = 0.004;

/* a Facet with no word (a Plate about no cycle) never matches */
export const sim = (a, b) => FACETS.reduce((n, f) => n + (a.facets[f] != null && a.facets[f] === b.facets[f]), 0) / FACETS.length;

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
  put(plates[seed], g.cols || plates[seed].span !== 2 ? 0 : -1, 0);
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
      if (g.cols && (c < 0 || c + p.span > g.cols || r < 0)) continue;   /* the column: its width, and only downward */
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
    src: p.src || svgData(...px(p), p.model ? '' : `<rect width="100%" height="100%" fill="${getComputedStyle(document.documentElement).getPropertyValue('--color-bg-alt').trim() || '#14171a'}"/>`),   /* a model's Plate is bare paper until its still lands */
  }));
  const frame = (p) => frameAround(p, g, W, H);
  const field = {
    u0: Math.min(...G.plates.map((p) => p.rect.u0)), v0: Math.min(...G.plates.map((p) => p.rect.v0)),
    u1: Math.max(...G.plates.map((p) => p.rect.u1)), v1: Math.max(...G.plates.map((p) => p.rect.v1)),
  };
  return { variant, g, ...G, records, drawings, frame, limits: (W1, H1) => limitsFor(g, field, W1, H1), arrival: { camera: frame(G.plates[G.seed]) } };
}

/* how far the index lets a reader go (Ethan, 2026-10-20: zoomed far out the work looks small and
   insignificant). Out: at most 6 cells across and 4 down, twice the arrival's 3 by 2. In: one cell at
   most twice the height under the nav. Pan: the view stops half a cell past the field's edge. */
const MOST_ACROSS = 6, MOST_DOWN = 4, MOST_IN = 2;
function limitsFor(g, field, W, H) {
  const fh = H - NAV_H;
  /* the column (Ethan, 2026-10-20: the phone's index): one fixed scale filling the width, so it only
     travels up and down */
  if (g.cols) { const s = W / (g.cols * g.pw + GUTTER); return { sMin: s, sMax: s, bounds: field, margin: GUTTER }; }
  return { sMin: Math.max(W / (MOST_ACROSS * g.pw), fh / (MOST_DOWN * g.ph)), sMax: MOST_IN * fh / g.ph, bounds: field, margin: g.pw / 2 };
}

/* a camera on a Plate that shows at most 3 cells across and 2 down (Ethan, 2026-10-18): the larger of
   the two fits wins, so neither count is exceeded. Centred on the Plate's column; its row starts just
   under the nav, so the Plate shows whole and whatever room is left shows the row below. On a narrow
   screen (#12) the 2-down fit would push a Plate off the sides, so the Plate's own width, a gutter
   either side, caps it. The column (g) is framed on its full width. */
function frameAround(p, g, W, H) {
  const fw = W, fh = H - NAV_H;
  if (g.cols) {
    const s = fw / (g.cols * g.pw + GUTTER);
    return { T: [(g.cols * g.pw - GUTTER) / 2, p.rect.v0 - GUTTER / 2 + (H / 2 - NAV_H) / s], s };
  }
  const s = Math.min(Math.max(fw / (3 * g.pw), fh / (2 * g.ph)), fw / (p.wSteps + 2 * GUTTER));
  return { T: [(p.rect.u0 + p.rect.u1) / 2, p.rect.v0 - GUTTER / 2 + (H / 2 - NAV_H) / s], s };
}

/* ---------- the arrow, built on the paper's dots ----------
   An open drafting arrow: three hairlines, a shaft and a 90-degree head, every end on a dot node. It is
   2 steps long, so it sits in the 4-step gutter with one clear step on either end. Hovered, each line
   rises straight up the page by exactly one step into a thin fin, landing on nodes too. The fins never
   meet as a true solid would, and Ethan keeps that: the form half-emerges from 2D and reads slightly
   wrong (2026-10-20). */
const LINES = [[[0, 0], [2, 0]], [[1, -1], [2, 0]], [[1, 1], [2, 0]]];   /* pointing +u, tail at the origin */
const LIFT = 1;                    /* steps */
const T_ARROW = 0.25;              /* s */
const TURN = {                     /* whole-step rotations keep every corner on a node */
  right: ([a, b]) => [a, b], left: ([a, b]) => [-a, b], down: ([a, b]) => [-b, a], up: ([a, b]) => [b, -a],
};
function arrowFaces(way, lift) {
  const up = ([u, v]) => [u, v - lift];
  const lines = LINES.map((l) => l.map(TURN[way]));
  const faces = lines.map(([p, q]) => [p, q, up(q), up(p)]);       /* at rest, the hairline itself */
  return { faces, pts: [...lines.flat(), ...lines.flat().map(up)] };
}
/* which side of the hero faces another Plate: the dominant axis between their centres */
function wayTo(from, to) {
  const du = (to.rect.u0 + to.rect.u1 - from.rect.u0 - from.rect.u1) / 2, dv = (to.rect.v0 + to.rect.v1 - from.rect.v0 - from.rect.v1) / 2;
  return Math.abs(du) >= Math.abs(dv) ? (du >= 0 ? 'right' : 'left') : (dv >= 0 ? 'down' : 'up');
}
/* the tail node for an arrow on one side of a Plate, `along` steps from that side's middle node */
function tailFor(r, way, along) {
  const mu = Math.round((r.u0 + r.u1) / 2) + along, mv = Math.round((r.v0 + r.v1) / 2) + along;
  return way === 'right' ? [r.u1 + 1, mv] : way === 'left' ? [r.u0 - 1, mv] : way === 'down' ? [mu, r.v1 + 1] : [mu, r.v0 - 1];
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
  const noHover = window.matchMedia('(hover: none)').matches;
  const btns = L.g.cols ? [] : [...stage.querySelectorAll('.ix-axarrow')];   /* the column has none */
  const arrowSvg = new Map();
  for (const b of btns) {
    b.hidden = false;
    const dir = Number(b.dataset.dir);
    const s = b.querySelector('svg');
    for (let i = 0; i < LINES.length; i++) s.appendChild(document.createElementNS(NS, 'polygon'));   /* one fin per line */
    const a = { dir, s, polys: [...s.querySelectorAll('polygon')], way: 'right', target: 0, lift: { from: 0, to: 0, t0: 0 } };
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
  /* an arrow goes where it points: to the Record it was aimed at when drawn */
  /* it stays the current Record until the reader moves the view: at the field's edge the pan limit
     shifts the frame, which could leave a neighbour's hero nearer the centre */
  let pinned = null;                                  /* { i, key }: key is the camera it came to rest at */
  function go(a) { pinned = { i: a.target, key: null }; sheet.show({ camera: L.frame(L.records[a.target].hero, L.g, W(), H()) }, { animate: !reduceMotion }); }
  for (const b of btns) b.addEventListener('click', (e) => { e.stopPropagation(); go(arrowSvg.get(b)); });
  const KEY_WAY = { ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' };
  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    const way = KEY_WAY[e.key];
    if (!way) return;
    const a = [...arrowSvg.values()].find((x) => x.way === way);   /* a key only works when an arrow points its way */
    if (a) { e.preventDefault(); go(a); }
  });

  /* placeholder hover: sheet2d never sees placeholders, so their titles are shown here */
  let phHot = null;
  const setPh = (sh) => {
    if (phHot === sh) return;
    if (phHot && phHot.title) phHot.title.classList.remove('is-hot');
    phHot = sh;
    if (phHot && phHot.title) phHot.title.classList.add('is-hot');
  };
  /* the lift and the turn (ADR-0007's index hover, kept 2026-10-20): a model Plate lifts live, a
     drawing Plate turns to its Record's next Drawing. One Plate at a time. */
  const live = createPlateLive({ stage, before: overlay, sheet, reduceMotion, pxPerStep: PX_PER_STEP,
    onHold: (p, on) => { const img = imgs[real.indexOf(p)]; if (img) img.style.visibility = on ? 'hidden' : ''; } });
  let hovered = null;
  function hoverPlate(p) {
    if (p === hovered) return;
    if (hovered && turns.has(hovered)) turns.get(hovered).classList.remove('is-turned');
    hovered = p;
    if (p && turns.has(p)) turns.get(p).classList.add('is-turned');
    live.hover(p);
  }
  /* without hover (a phone, #12, Ethan 2026-10-20) a tap simply opens the Plate: no turn first. The
     model Plates turn of their own accord instead: the one most central and wholly in view swings to
     the axon, holds, swings back to plan, holds, and again, for as long as it stays in view. */
  const AUTO_DELAY = 0.6, AUTO_UP = 3.7, AUTO_CYCLE = 6.4;        /* s: plan first, axon (0.7 + 3), back (0.7 + 2) */
  let auto = null;                                                /* { p, t0 } */
  function autoTurn() {
    const f = { left: 0, right: W(), top: NAV_H, bottom: H() };
    let best = null, bd = Infinity;
    for (const p of real) {
      if (!p.model) continue;
      const [x0, y0] = sheet.toScreen(p.rect.u0, p.rect.v0), [x1, y1] = sheet.toScreen(p.rect.u1, p.rect.v1);
      if (x0 < f.left || x1 > f.right || y0 < f.top || y1 > f.bottom) continue;
      const d = Math.hypot((x0 + x1 - f.left - f.right) / 2, (y0 + y1 - f.top - f.bottom) / 2);
      if (d < bd) { bd = d; best = p; }
    }
    const now = performance.now() / 1000;
    if (!auto || auto.p !== best) auto = { p: best, t0: now + AUTO_DELAY };
    const e = now - auto.t0;
    live.hover(best && e >= 0 && e % AUTO_CYCLE < AUTO_UP ? best : null);
  }
  const plateAt = (u, v) => L.plates.find((q) => !q.placeholder && u >= q.rect.u0 && u <= q.rect.u1 && v >= q.rect.v0 && v <= q.rect.v1) || null;
  stage.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    if (e.target.closest && e.target.closest('button')) { setPh(null); hoverPlate(null); return; }
    const { camera } = sheet.debug();
    const r = stage.getBoundingClientRect();
    const u = camera.T[0] + (e.clientX - r.left - r.width / 2) / camera.s, v = camera.T[1] + (e.clientY - r.top - r.height / 2) / camera.s;
    setPh(shapes.find((sh) => sh.p.placeholder && u >= sh.p.rect.u0 && u <= sh.p.rect.u1 && v >= sh.p.rect.v0 && v <= sh.p.rect.v1) || null);
    hoverPlate(plateAt(u, v));
  });
  stage.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; setPh(null); hoverPlate(null); });   /* touch leaves on every lift */
  /* keyboard: a focused Plate title is a hover */
  overlay.addEventListener('focusin', (e) => { const t = e.target.closest('[data-drawing]'); hoverPlate(t ? L.plates.find((q) => q.id === t.dataset.drawing) || null : null); });
  overlay.addEventListener('focusout', () => hoverPlate(null));

  /* per frame: redraw only when the camera moved */
  let lastKey = '';
  let cur = 0;
  function draw() {
    const { camera } = sheet.debug();
    const k = `${camera.T[0].toFixed(3)}|${camera.T[1].toFixed(3)}|${camera.s.toFixed(4)}|${W()}|${H()}`;
    if (pinned && sheet.debug().flying) cur = pinned.i;
    else if (pinned && (pinned.key === null || pinned.key === k)) { pinned.key = k; cur = pinned.i; }
    else { pinned = null; cur = currentIndex(); }
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
          const every = Math.max(1, Math.ceil(4 / s));          /* a dot on every node, or every nth when zoomed out */
          sh.dots.style.strokeDasharray = `0 ${(every * s).toFixed(3)}`;
        }
        if (sh.title) {
          const [tx, ty] = sheet.toScreen(sh.p.rect.u0, sh.p.rect.v1 + 0.6);
          sh.title.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
        }
      }
    }
    if (noHover && !reduceMotion) autoTurn();
    if (L.g.cols) { live.frame(); requestAnimationFrame(draw); return; }   /* the column scrolls: no arrows */
    /* arrows beside the current Record's hero, each on the side that faces the Record it leads to */
    const hero = L.records[cur].hero;
    const n = L.records.length;
    const aims = [...arrowSvg.values()].map((a) => { a.target = (cur + a.dir + n) % n; a.way = wayTo(hero, L.records[a.target].hero); return a; });
    const shared = aims.length === 2 && aims[0].way === aims[1].way;
    const nowS = performance.now() / 1000;
    const lifts = aims.map((a) => liftOf(a, nowS).toFixed(3)).join(',');
    const ak = k + '|' + cur + '|' + aims.map((a) => a.way).join(',') + '|' + lifts;
    if (ak !== draw.ak) {
      draw.ak = ak;
      for (const [b, a] of arrowSvg) {
        const tail = tailFor(hero.rect, a.way, shared ? (a.dir > 0 ? 4 : -4) : 0);   /* two on one side: four nodes apart */
        const f = arrowFaces(a.way, LIFT * liftOf(a, nowS));
        const faces = f.faces;
        const all = arrowFaces(a.way, LIFT).pts;                                     /* the box holds the full lift */
        const s = camera.s, pad = 2;
        const minU = Math.min(...all.map(([u]) => u)), maxU = Math.max(...all.map(([u]) => u));
        const minV = Math.min(...all.map(([, v]) => v)), maxV = Math.max(...all.map(([, v]) => v));
        const [bx, by] = sheet.toScreen(tail[0] + minU, tail[1] + minV);
        const bw = (maxU - minU) * s, bh = (maxV - minV) * s;
        b.style.transform = `translate(${(bx - pad).toFixed(1)}px, ${(by - pad).toFixed(1)}px)`;
        b.style.width = (bw + 2 * pad) + 'px'; b.style.height = (bh + 2 * pad) + 'px';
        a.s.setAttribute('viewBox', `${-pad} ${-pad} ${bw + 2 * pad} ${bh + 2 * pad}`);
        a.s.setAttribute('width', bw + 2 * pad); a.s.setAttribute('height', bh + 2 * pad);
        a.polys.forEach((poly, i) => {
          const pts = faces[i];
          poly.style.display = pts ? '' : 'none';
          if (pts) poly.setAttribute('points', pts.map(([u, v]) => `${((u - minU) * s).toFixed(2)},${((v - minV) * s).toFixed(2)}`).join(' '));
        });
        b.dataset.tail = tail.join(',');
        b.dataset.way = a.way;
        b.dataset.target = L.records[a.target].id;
      }
    }
    live.frame();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* model stills: rendered once offscreen, then swapped into their images (sheet2d appends in data order) */
  const imgs = [...stage.querySelectorAll('.env-plane .env-plane-img')];
  const real = L.plates.filter((p) => !p.placeholder);
  for (const p of real) if (p.model) imgs[real.indexOf(p)].classList.add('ix-model');

  /* the turn: each drawing Plate gets its Record's next Drawing laid on top, clipped away until hovered.
     Next = the first of the Record's Drawings after this Plate's own that no Plate shows, else simply
     the next one round (most Records have no Drawing that is not already a Plate yet). */
  const shown = new Set(real.map((p) => p.src).filter(Boolean));
  const turns = new Map();
  for (const p of real) {
    const list = (RECORDS[p.record] && RECORDS[p.record].drawings) || [];
    const at = list.indexOf(p.src);
    if (!p.src || at < 0 || list.length < 2) continue;
    const round = list.slice(at + 1).concat(list.slice(0, at));
    const next = round.find((d) => !shown.has(d)) || round[0];
    const img = imgs[real.indexOf(p)];
    const n = img.cloneNode(false);
    n.classList.add('ix-next');
    n.src = next;
    n.alt = '';
    img.after(n);
    turns.set(p, n);
  }
  const modelPlates = real.filter((p) => p.model);
  const stills = { done: false, count: 0 };
  let paintRun = 0;
  function paint() {
    const run = ++paintRun;
    const bg = css('--color-bg-alt', '#14171a');
    for (const p of real) if (!p.src && !p.model) imgs[real.indexOf(p)].src = svgData(p.wSteps * PX_PER_STEP, p.hSteps * PX_PER_STEP, `<rect width="100%" height="100%" fill="${bg}"/>`);
    stills.done = false; stills.count = 0;
    return renderStills(modelPlates.map((p) => ({ model: p.model, w: p.wSteps * PX_PER_STEP, h: p.hSteps * PX_PER_STEP })), {
      ink: css('--color-primary', '#e9ecee'), paper: bg, plate: css('--color-bg', '#0e1013'),
    }).then((map) => {
      if (run !== paintRun) return;                          /* a newer theme won */
      for (const p of modelPlates) {
        const url = map.get(p.model);
        const img = imgs[real.indexOf(p)];
        if (url && img) { img.src = url; stills.count++; }
      }
      stills.done = true;
    });
  }
  paint();

  return {
    /* the theme changed: the stills and plain cells are baked in page colours, so they repaint */
    retheme: paint,

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
        lift: live.state(),
        noHover,
        turns: [...turns].map(([p, n]) => ({ id: p.id, next: n.getAttribute('src').split('/').pop(), turned: n.classList.contains('is-turned') })),
        camera: sheet.debug().camera,
        placement: L.plates.map((p) => ({ id: p.id, c: p.c, r: p.r, span: p.span })),
      };
    },
  };
}
