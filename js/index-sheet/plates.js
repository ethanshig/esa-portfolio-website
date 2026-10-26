/* ===================================================================
   PLATES — the live layer over the index's sheet (issue #17, ported from
   prototype/grid/index-sheet, variant F).

   sheet2d.js draws the real Plates' images and runs the controls. This adds
   what lies on the paper around them:
     - placeholder frames (dashed, alt-paper) and their hover titles
     - the dotted outline on active Records' Plates, on the Plate's edge,
       1.5 px, a dot on every node
     - the two drafting arrows beside the current Record's hero, and the
       arrow keys that follow them
     - hover: a model Plate lifts live (platelive.js), an image Plate turns
       to its Record's next Drawing; without hover, the model Plate most
       central and wholly in view turns on its own
     - the model stills (platestill.js), repainted when the theme turns
   JavaScript adds no text: every title is in the HTML (scripts/build-index.js).
   =================================================================== */
import { GRID, NAV_H, frameAround } from './field.js';
import { renderStills } from './platestill.js';
import { createPlateLive } from './platelive.js';

export const PX_PER_STEP = 20;          /* resolution of the stills and the px aspect of the rects */
const OUTLINE_W = 1.5;                  /* px: the active Records' dotted outline (#16) */

export const svgData = (w, h, body) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);

/* ---------- the arrow, built on the paper's dots ----------
   An open drafting arrow: three hairlines, a shaft and a 90-degree head, every end on a dot node. It is
   2 steps long, so it sits in the 4-step gutter with one clear step on either end. Hovered, each line
   rises straight up the page by exactly one step into a thin fin, landing on nodes too. The fins never
   meet as a true solid would, and Ethan keeps that (2026-10-20). */
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

/* field: growField()'s result. records: the data's RECORDS (for each Record's drawings). */
export function attachPlates({ sheet, stage, field, records, reduceMotion }) {
  const L = field;
  const root = document.documentElement;
  const css = (n, f) => getComputedStyle(root).getPropertyValue(n).trim() || f;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = stage.querySelector('.ix-plates-svg');
  const overlay = stage.querySelector('.env-overlay');
  if (!svg || !overlay) throw new Error('plates: the stage needs .ix-plates-svg and .env-overlay');
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
      dots.style.strokeWidth = OUTLINE_W;
      g.appendChild(dots);
    }
    svg.appendChild(g);
    const title = p.placeholder ? overlay.querySelector(`[data-plate="${p.id}"]`) : null;
    if (p.placeholder && !title) throw new Error(`plates: placeholder ${p.id} has no title in the HTML`);
    return { p, frame, dots, title };
  });

  /* the arrows: buttons in the HTML holding an empty svg; JS draws the shape only */
  const noHover = window.matchMedia('(hover: none)').matches;
  const btns = [...stage.querySelectorAll('.ix-axarrow')];
  if (btns.length !== 2) throw new Error(`plates: expected 2 arrows in the HTML, found ${btns.length}`);
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
  /* An arrow goes to the Record it was aimed at when drawn, and that Record stays current until the
     reader moves the view: at the field's edge the pan limit shifts the frame, which could leave a
     neighbour's hero nearer the centre. */
  let pinned = null;                                  /* { i, key }: key is the camera it came to rest at */
  function go(a) { pinned = { i: a.target, key: null }; sheet.show({ camera: frameAround(L.records[a.target].hero, W(), H()) }, { animate: !reduceMotion }); }
  for (const b of btns) b.addEventListener('click', (e) => { e.stopPropagation(); go(arrowSvg.get(b)); });
  const KEY_WAY = { ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' };
  document.addEventListener('keydown', (e) => {
    if (root.classList.contains('ls-landing')) return;                  /* the mark is still up */
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
    if (phHot) phHot.title.classList.remove('is-hot');
    phHot = sh;
    if (phHot) phHot.title.classList.add('is-hot');
  };

  const real = L.plates.filter((p) => !p.placeholder);
  const imgs = [...stage.querySelectorAll('.env-plane .env-plane-img')];   /* sheet2d appends them in data order */
  if (imgs.length !== real.length) throw new Error(`plates: ${real.length} real Plates but ${imgs.length} images on the sheet`);

  /* the lift and the turn (ADR-0007's index hover): a model Plate lifts live, a drawing Plate turns to
     its Record's next Drawing. One Plate at a time. */
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
  /* Without hover a tap simply opens the Plate. The model Plates turn of their own accord instead: the
     one most central and wholly in view waits in plan, swings to the axon, holds, swings back, holds,
     and again, for as long as it stays in view. Only one turns at a time. */
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
  const inside = (p, u, v) => u >= p.rect.u0 && u <= p.rect.u1 && v >= p.rect.v0 && v <= p.rect.v1;
  stage.addEventListener('pointermove', (e) => {
    if (e.buttons || e.pointerType === 'touch') return;                  /* a finger has no hover */
    if (e.target.closest && e.target.closest('button')) { setPh(null); hoverPlate(null); return; }
    const r = stage.getBoundingClientRect();
    const [u, v] = sheet.toPaper(e.clientX - r.left, e.clientY - r.top);
    setPh(shapes.find((sh) => sh.p.placeholder && inside(sh.p, u, v)) || null);
    hoverPlate(real.find((q) => inside(q, u, v)) || null);
  });
  stage.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; setPh(null); hoverPlate(null); });   /* touch leaves on every lift */
  /* keyboard: a focused Plate title is a hover */
  overlay.addEventListener('focusin', (e) => { const t = e.target.closest('[data-drawing]'); hoverPlate(t ? real.find((q) => q.id === t.dataset.drawing) || null : null); });
  overlay.addEventListener('focusout', () => hoverPlate(null));

  /* per frame: redraw the overlay only when the camera moved */
  let lastKey = '', arrowKey = '';
  let cur = 0;
  function draw() {
    const { camera, flying } = sheet.debug();
    const k = `${camera.T[0].toFixed(3)}|${camera.T[1].toFixed(3)}|${camera.s.toFixed(4)}|${W()}|${H()}`;
    if (pinned && flying) cur = pinned.i;
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
          sh.dots.setAttribute('x', x0); sh.dots.setAttribute('y', y0);
          sh.dots.setAttribute('width', x1 - x0); sh.dots.setAttribute('height', y1 - y0);
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
    /* arrows beside the current Record's hero, each on the side that faces the Record it leads to */
    const hero = L.records[cur].hero;
    const n = L.records.length;
    const aims = [...arrowSvg.values()].map((a) => { a.target = (cur + a.dir + n) % n; a.way = wayTo(hero, L.records[a.target].hero); return a; });
    const shared = aims[0].way === aims[1].way;
    const nowS = performance.now() / 1000;
    const lifts = aims.map((a) => liftOf(a, nowS).toFixed(3)).join(',');
    const ak = k + '|' + cur + '|' + aims.map((a) => a.way).join(',') + '|' + lifts;
    if (ak !== arrowKey) {
      arrowKey = ak;
      for (const [b, a] of arrowSvg) {
        const tail = tailFor(hero.rect, a.way, shared ? (a.dir > 0 ? 4 : -4) : 0);   /* two on one side: four nodes apart */
        const faces = arrowFaces(a.way, LIFT * liftOf(a, nowS)).faces;
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
          poly.setAttribute('points', faces[i].map(([u, v]) => `${((u - minU) * s).toFixed(2)},${((v - minV) * s).toFixed(2)}`).join(' '));
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

  for (const p of real) if (p.model) imgs[real.indexOf(p)].classList.add('ix-model');

  /* The turn: each drawing Plate gets its Record's next Drawing laid on top, clipped away until hovered.
     Next = the first of the Record's Drawings after this Plate's own that no Plate shows, else simply
     the next one round. */
  const shown = new Set(real.map((p) => p.drawing).filter(Boolean));
  const turns = new Map();
  for (const p of real) {
    const list = records[p.record].drawings;
    const at = list.indexOf(p.drawing);
    if (!p.drawing || at < 0 || list.length < 2) continue;
    const round = list.slice(at + 1).concat(list.slice(0, at));
    const next = round.find((d) => !shown.has(d)) || round[0];
    const img = imgs[real.indexOf(p)];
    const turned = img.cloneNode(false);
    turned.classList.add('ix-next');
    turned.src = new URL(next, document.baseURI).href;
    turned.dataset.src = next;
    turned.alt = '';
    img.after(turned);
    turns.set(p, turned);
  }

  /* model stills: rendered once offscreen, then swapped into their images; again when the theme turns */
  const modelPlates = real.filter((p) => p.model);
  const stills = { done: false, count: 0 };
  let paintRun = 0;
  function paint() {
    const run = ++paintRun;
    stills.done = false; stills.count = 0;
    return renderStills(modelPlates.map((p) => ({ model: p.model, w: p.wSteps * PX_PER_STEP, h: p.hSteps * PX_PER_STEP })), {
      ink: css('--color-primary', '#e9ecee'), paper: css('--color-bg-alt', '#14171a'), plate: css('--color-bg', '#0e1013'),
    }).then((map) => {
      if (run !== paintRun) return;                          /* a newer theme won */
      for (const p of modelPlates) {
        const url = map.get(p.model);
        if (url) { imgs[real.indexOf(p)].src = url; stills.count++; }
      }
      stills.done = true;
    });
  }
  paint();

  return {
    /* the theme changed: the stills are baked in page colours, so they repaint */
    retheme: paint,
    /* verification only (exposed as window.__plates behind ?debug) */
    state() {
      const r = L.records[cur];
      return {
        plates: L.plates.length,
        records: L.records.length,
        seed: L.plates[L.seed].id,
        meanEdgeSim: Number(L.meanEdge.toFixed(3)),
        edgePairs: L.edgePairs,
        current: r.id,
        currentIndex: cur,
        hero: r.hero.id,
        order: L.records.map((x) => x.id),
        growth: L.order.map((i) => L.plates[i].id),
        stills: { ...stills },
        lift: live.state(),
        noHover,
        turns: [...turns].map(([p, n]) => ({ id: p.id, next: n.dataset.src.split('/').pop(), turned: n.classList.contains('is-turned') })),
        camera: sheet.debug().camera,
        grid: GRID,
        placement: L.plates.map((p) => ({ id: p.id, c: p.c, r: p.r, span: p.span, rect: p.rect })),
      };
    },
  };
}
