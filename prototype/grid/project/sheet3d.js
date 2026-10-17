/* ===================================================================
   SHEET 3D — a Record with a model: drawings flat on the paper, the model
   standing in 2:1 dimetric beside them (ADR-0007). PROTOTYPE
   (prototype/grid/project).

   ONE WORLD, TWO READINGS. World units are dot steps. The paper is the
   plane through the origin facing the home camera (azimuth 45, elevation
   30 — axon/dimetric.js): paper point (u, v) = u * right_h - v * up_h.
   Seen from the home camera the paper is the cartesian sheet, undistorted,
   and anything standing on the world's ground (y up) reads in 2:1
   dimetric with its plan axes on the bold lattice. That coincidence is
   the "superimposed view". The model stands in front of the paper, so
   orbiting is honest 3D: the model turns as a solid and the paper tilts
   away, which is when the drawings ghost.

   The model is the glb in feet, scaled so `ftPerLattice` feet is one
   lattice unit (2 steps across, 1 down), and placed so its footprint's
   back corner sits on a bold node.

   MARKS ARE MEASURED (ADR-0007). Each Make2D drawing carries a fit
   drawing2D ~= A . rhino3D + t. Converted to glb coordinates:
     rhino = (gx + ox, -gz + oy, gy + oz)
     A_g = [A_x, A_z, -A_y],  t_g = A . o + t
   Its rows are the drawing's screen right and up in the model; their cross
   product points at the viewer. A drawing whose fit residual is over
   REGISTER_FT gets no mark and no snap view (axon-4).

   Section A: an end-of-wall section. The cut plane is the model's end
   face toward the section's viewer; its extent is the drawing's linework
   mapped back through the fit, clipped to the model. Axons: a view arrow
   along each fitted view direction, aimed at the same end.
   =================================================================== */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as D from '../axon/dimetric.js';
import { createInkMaterials, makeInk, lineWidthForStep } from '../axon/ink.js';
import { DotField } from './dots.js';
import { attachGestures } from './gestures.js';
import { NoSheetError } from './errors.js';
import { buildLattice, cornerRings } from './lattice.js';
import { starField } from './palette.js';

/* The paper in 3D (prototype, Ethan's option A): the three open decisions as URL params.
   Defaults are P1, the coordinator's recommendation. */
const OPTIONS = {
  extent: ['tight', 'sheet'], drawings: ['clear', 'under'], verticals: ['lattice', 'all'],
  /* where the model meets the paper (prototype round 3):
     float   wholly in front of the paper, touching nothing (round 2)
     origin  the paper passes through the model's Rhino origin, which sits on a bold node
     ground  origin, plus the plane the model stands on: the lattice lifts as that one level */
  seat: ['float', 'origin', 'ground'],
  /* what marks the origin: nothing, a datum (ring + one-unit ticks), the datum with its three axes
     running on to the edge of the view in all six directions, or Rhino's red/green axis lines */
  axes: ['none', 'datum', 'infinite', 'rhino'],
};
function readOptions() {
  const q = new URLSearchParams(location.search);
  const out = { extent: 'tight', drawings: 'clear', verticals: 'lattice', seat: 'ground', axes: 'datum' };   /* Ethan, round 3: ground + datum */
  for (const [key, allowed] of Object.entries(OPTIONS)) {
    const v = q.get(key);
    if (v !== null && allowed.includes(v)) out[key] = v;
  }
  return out;
}
const LIFT_TO = 0.6;                /* radians off home (34 deg) at which the lattice is fully lifted: wide, so a snap home visibly collapses it */

const REGISTER_FT = 0.5;            /* a fit worse than this (median residual, ft) is not a registration */
const LOAD_TIMEOUT_MS = 20000;
const DIST = 1000;                  /* camera stand-off along its back axis, world units */
const S_MIN = 1.2, S_MAX = 220;     /* px per world unit (= per step in the home view) */
const PAD_PX = 28;
const T_FLY = 0.9;                  /* seconds */
const ORBIT_RAD_PER_PX = 0.0055;
const GHOST_FROM = 0.012, GHOST_TO = 0.08;   /* radians off the home orientation */
const GHOST_OPACITY = 0.15;
const TITLE_GAP = 0.6;              /* steps between a drawing and its title */
const TITLE_ROOM = 2.4;             /* steps reserved under a drawing for its title when framing */
const MARK_MARGIN_FT = 0.5;
/* section / view marks: quiet at rest, full on hover (round 6) */
const MARK_W = { rest: 1.0, hot: 1.8 };
const MARK_A = { rest: 0.55, hot: 1 };
const MARK_FILL = { rest: 0.05, hot: 0.18 };         /* the cut rectangle stands this far proud of the end face */

/* line weights, css px at a 16 px step; scaled with zoom inside [0.55, 1.5] */
const WEIGHT_PX = { heavy: 2.1, medium: 1.25, light: 0.65 };

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const calm = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

function cssToken(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function withTimeout(promise, ms, what) {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

/* ---------- data ---------- */
function validateSheet(data) {
  if (!Array.isArray(data.drawings) || data.drawings.length === 0) throw new Error('sheet3d: no drawings');
  const ids = new Set();
  for (const d of data.drawings) {
    if (typeof d.id !== 'string' || ids.has(d.id)) throw new Error(`sheet3d: bad or duplicate drawing id "${d.id}"`);
    ids.add(d.id);
    if (!Array.isArray(d.at) || !d.at.every(Number.isFinite)) throw new Error(`sheet3d: ${d.id} needs at [u, v]`);
    if (d.kind === 'raster') {
      if (typeof d.src !== 'string' || !(d.w > 0) || !Array.isArray(d.px) || !(d.px[0] > 0 && d.px[1] > 0)) {
        throw new Error(`sheet3d: raster ${d.id} needs src, w and px`);
      }
    } else if (d.kind === 'vector') {
      if (typeof d.source !== 'string' || !(d.scale > 0) || !d.weights) {
        throw new Error(`sheet3d: vector ${d.id} needs source, scale and weights`);
      }
    } else {
      throw new Error(`sheet3d: ${d.id} has unknown kind "${d.kind}"`);
    }
    if (d.markLabel !== undefined) {
      if (d.kind !== 'vector') throw new Error(`sheet3d: ${d.id}: only a measured (vector) drawing can carry a mark`);
      if (d.markKind !== 'section' && d.markKind !== 'view') throw new Error(`sheet3d: ${d.id}: markKind must be "section" or "view"`);
    }
  }
  if (!data.model || typeof data.model.src !== 'string' || !(data.model.ftPerLattice > 0) ||
      !Array.isArray(data.model.box) || data.model.box.length !== 4) {
    throw new Error('sheet3d: model needs src, ftPerLattice and box [u0, v0, u1, v1]');
  }
  if (typeof data.linework !== 'string') throw new Error('sheet3d: linework url missing');
}

function validateLinework(json) {
  if (!json || typeof json !== 'object' || !json.drawings || typeof json.drawings !== 'object') {
    throw new Error('sheet3d: linework has no drawings');
  }
  if (!Array.isArray(json.glbOffsetRhino) || json.glbOffsetRhino.length !== 3 || !json.glbOffsetRhino.every(Number.isFinite)) {
    throw new Error('sheet3d: linework has no glbOffsetRhino');
  }
  for (const [id, d] of Object.entries(json.drawings)) {
    if (!Array.isArray(d.lines)) throw new Error(`sheet3d: linework ${id} has no lines`);
    for (const l of d.lines) {
      if (typeof l.k !== 'string' || !Array.isArray(l.p) || l.p.length < 2) {
        throw new Error(`sheet3d: linework ${id} has a malformed line`);
      }
    }
  }
}

async function fetchJSON(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), LOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* The fit in glb coordinates, and what it is good for. Returns null when
   the drawing has no usable fit. */
function fitInGlb(fit, offset) {
  if (!fit || !Array.isArray(fit.A) || fit.A.length !== 2 || !Array.isArray(fit.t)) return null;
  const [ox, oy, oz] = offset;
  const rows = fit.A.map((r) => [r[0], r[2], -r[1]]);                 /* columns gx, gy, gz */
  const t = fit.A.map((r, i) => r[0] * ox + r[1] * oy + r[2] * oz + fit.t[i]);
  if (!rows.flat().concat(t).every(Number.isFinite)) return null;
  const r0 = V(rows[0]), r1 = V(rows[1]);
  const back = new THREE.Vector3().crossVectors(r0, r1);
  if (back.lengthSq() < 1e-12) return null;
  back.normalize();
  const up = r1.clone().addScaledVector(back, -r1.dot(back)).normalize();
  const right = new THREE.Vector3().crossVectors(up, back).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, back));
  const residual = Number(fit.medianResidualFt);
  return {
    rows, t, q, back, right, up, residual,
    registered: Number.isFinite(residual) && residual <= REGISTER_FT,
  };
}

/* ===================================================================
   createSheet
   =================================================================== */
export async function createSheet({ stage, data, views, reduceMotion, freeRegion, onFocus = () => {}, onHold = () => {} }) {
  validateSheet(data);
  const dotsCanvas = stage.querySelector('canvas.env-dots');
  const glHost = stage.querySelector('.env-gl');
  const overlay = stage.querySelector('.env-overlay');
  const homeBtn = stage.querySelector('.env-home');
  if (!dotsCanvas || !glHost || !overlay) throw new Error('sheet3d: stage structure missing');

  /* ---------- renderer first: no WebGL is the expected failure ---------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  } catch (err) {
    throw new NoSheetError(`WebGL is unavailable (${err && err.message ? err.message : err})`);
  }
  if (!renderer.getContext()) throw new NoSheetError('WebGL is unavailable');
  /* render-loop state first: texture loads call kick() whenever they land */
  let dirty = true;
  let raf = 0;
  let ready = false;          /* nothing renders until the sheet is fully built */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  glHost.appendChild(renderer.domElement);

  const colors = {
    ink: cssToken('--color-primary', '#e9ecee'),
    bg: cssToken('--color-bg', '#0d0f11'),
    accent: cssToken('--color-accent', '#c47a5c'),
  };

  const dots = new DotField(dotsCanvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2 * DIST);

  /* ---------- the home basis and the paper ---------- */
  const hb = D.cameraBasis(D.ELEVATION, D.AZIMUTH);
  const R_H = V(hb.right), U_H = V(hb.up), B_H = V(hb.back);
  const Q_HOME = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(R_H, U_H, B_H));
  const paper = (u, v) => R_H.clone().multiplyScalar(u).addScaledVector(U_H, -v);
  const toPaperUV = (X) => [X.dot(R_H), -X.dot(U_H)];

  /* camera state: orientation q, the world point T at the stage centre, scale s.
     Declared before anything async, since a texture landing early renders a frame. */
  let W = 0, H = 0;
  const cam = { q: Q_HOME.clone(), T: new THREE.Vector3(), s: 16 };
  let fly = null;
  let ghost = 0;
  let lift = 0;                     /* how far the bold dots have lifted into the lattice */

  /* ---------- materials ---------- */
  const lineMat = (color, width, extra = {}) => new LineMaterial({
    color, linewidth: width, worldUnits: false, transparent: true, depthWrite: false, ...extra,
  });
  const weightMats = {
    heavy: lineMat(colors.ink, WEIGHT_PX.heavy),
    medium: lineMat(colors.ink, WEIGHT_PX.medium),
    light: lineMat(colors.ink, WEIGHT_PX.light),
  };
  const frameMat = lineMat(colors.accent, 1.6);
  const rasterMats = [];

  /* ---------- linework ---------- */
  const linework = await fetchJSON(new URL(data.linework, document.baseURI).href);
  validateLinework(linework);
  const offset = linework.glbOffsetRhino;

  const paperGroup = new THREE.Group();
  scene.add(paperGroup);

  function rectOutline(rect, mat) {
    const c = [paper(rect.u0, rect.v0), paper(rect.u1, rect.v0), paper(rect.u1, rect.v1), paper(rect.u0, rect.v1)];
    const pos = [];
    for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    const g = new LineSegmentsGeometry().setPositions(pos);
    const line = new LineSegments2(g, mat);
    line.renderOrder = 3;
    line.visible = false;
    return line;
  }

  const drawings = [];
  for (const d of data.drawings) {
    const title = overlay.querySelector(`.env-title[data-drawing="${d.id}"]`);
    if (!title) console.warn(`[sheet3d] ${d.id}: no title in the HTML`);
    const item = { ...d, title, fit: null, mark: null };

    if (d.kind === 'vector') {
      const src = linework.drawings[d.source];
      if (!src) throw new Error(`sheet3d: linework has no drawing "${d.source}"`);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const l of src.lines) for (const [x, y] of l.p) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      const sc = d.scale;
      item.rect = { u0: d.at[0], v0: d.at[1], u1: d.at[0] + (x1 - x0) * sc, v1: d.at[1] + (y1 - y0) * sc };
      item.bounds2d = { x0, y0, x1, y1 };
      const buckets = { heavy: [], medium: [], light: [] };
      for (const l of src.lines) {
        const w = d.weights[l.k];
        if (!buckets[w]) throw new Error(`sheet3d: ${d.id} has no weight for line kind "${l.k}"`);
        const arr = buckets[w];
        for (let i = 0; i + 1 < l.p.length; i++) {
          const a = paper(d.at[0] + (l.p[i][0] - x0) * sc, d.at[1] + (y1 - l.p[i][1]) * sc);
          const b = paper(d.at[0] + (l.p[i + 1][0] - x0) * sc, d.at[1] + (y1 - l.p[i + 1][1]) * sc);
          arr.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
      for (const [w, arr] of Object.entries(buckets)) {
        if (!arr.length) continue;
        const line = new LineSegments2(new LineSegmentsGeometry().setPositions(arr), weightMats[w]);
        line.renderOrder = 2;
        paperGroup.add(line);
      }
      item.fit = fitInGlb(src.fit, offset);
    } else {
      const h = d.w * (d.px[1] / d.px[0]);
      item.rect = { u0: d.at[0], v0: d.at[1], u1: d.at[0] + d.w, v1: d.at[1] + h };
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      });
      rasterMats.push(mat);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(d.w, h), mat);
      const c = paper((item.rect.u0 + item.rect.u1) / 2, (item.rect.v0 + item.rect.v1) / 2);
      plane.quaternion.copy(Q_HOME);
      plane.position.copy(c);
      plane.renderOrder = 1;
      paperGroup.add(plane);
      item.plane = plane;
      new THREE.TextureLoader().loadAsync(new URL(d.src, document.baseURI).href).then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        mat.map = tex;
        mat.needsUpdate = true;
        kick();
      }).catch((err) => {
        /* a blank sheet in the page colour, outlined, rather than nothing */
        console.warn(`[sheet3d] ${d.id}: image failed to load (${d.src})`, err);
        mat.color.set(colors.bg);
        const edge = rectOutline(item.rect, weightMats.light);
        edge.visible = true;
        paperGroup.add(edge);
        kick();
      });
    }
    item.frame = rectOutline(item.rect, frameMat);
    paperGroup.add(item.frame);
    drawings.push(item);
  }
  const byId = new Map(drawings.map((d) => [d.id, d]));

  /* ---------- the model ---------- */
  const ink = createInkMaterials();
  ink.setColors(colors.ink, colors.bg);
  const k = (2 * Math.SQRT2) / data.model.ftPerLattice;   /* ft -> world units */
  const opts = readOptions();
  /* verticals=all: the model's heights on paper spacing too (unit height 2 steps, not sqrt 6) */
  const vs = opts.verticals === 'all' ? 2 / Math.sqrt(6) : 1;
  const kv = new THREE.Vector3(k, k * vs, k);
  let model = null;      /* { group, box (glb ft), center (world), endX, ... } */
  const modelTitle = overlay.querySelector('.env-title[data-model]');
  try {
    const gltf = await withTimeout(new GLTFLoader().loadAsync(new URL(data.model.src, document.baseURI).href),
      LOAD_TIMEOUT_MS, 'model');
    const { object, box } = makeInk(gltf.scene, { materials: ink });
    const group = new THREE.Group();
    group.scale.copy(kv);
    group.add(object);

    /* place: centre the projected box in model.box, then put the footprint's back corner on a bold node */
    const corners = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      corners.push(new THREE.Vector3(x, y, z).multiply(kv));
    }
    const uv = corners.map(toPaperUV);
    const pu0 = Math.min(...uv.map((p) => p[0])), pu1 = Math.max(...uv.map((p) => p[0]));
    const pv0 = Math.min(...uv.map((p) => p[1])), pv1 = Math.max(...uv.map((p) => p[1]));
    const [bu0, bv0, bu1, bv1] = data.model.box;
    let du = (bu0 + bu1) / 2 - (pu0 + pu1) / 2;
    let dv = (bv0 + bv1) / 2 - (pv0 + pv1) / 2;
    const backCorner = toPaperUV(new THREE.Vector3(box.min.x, box.min.y, box.min.z).multiply(kv));
    const node = D.nearestBold(backCorner[0] + du, backCorner[1] + dv);
    if (node) { du = node[0] - backCorner[0]; dv = node[1] - backCorner[1]; }
    const diag = box.getSize(new THREE.Vector3()).length() * k;
    /* Rhino's world origin, in glb (glb = rhino (x - ox, z - oz, -(y - oy))) */
    const oGlb = new THREE.Vector3(-offset[0], -offset[2], offset[1]);
    let originLocal = new THREE.Vector3(box.min.x, box.min.y, box.min.z).multiply(kv);
    let seatNode = node;
    if (opts.seat === 'float') {
      group.position.copy(paper(du, dv)).addScaledVector(B_H, diag + 2);   /* wholly in front of the paper */
    } else {
      /* the paper passes through the origin, and the origin sits on a bold node */
      originLocal = oGlb.clone().multiply(kv);
      const o = toPaperUV(originLocal);
      seatNode = D.nearestBold(o[0] + du, o[1] + dv) || [Math.round(o[0] + du), Math.round(o[1] + dv)];
      du = seatNode[0] - o[0]; dv = seatNode[1] - o[1];
      group.position.copy(paper(du, dv)).addScaledVector(B_H, -originLocal.dot(B_H));
    }
    scene.add(group);
    group.updateMatrixWorld(true);

    const center = box.getCenter(new THREE.Vector3());
    model = {
      group, box, node: seatNode,
      center: group.localToWorld(center.clone()),
      paperRect: { u0: pu0 + du, v0: pv0 + dv, u1: pu1 + du, v1: pv1 + dv },
      cornersWorld: corners.map((c) => c.clone().add(group.position)),
      originWorld: originLocal.clone().add(group.position),
      unit: new THREE.Vector3(5 * k, 5 * k * vs, 5 * k),        /* five feet along each axis, in world */
    };
  } catch (err) {
    console.warn('[sheet3d] the model did not load; the sheet shows drawings only', err);
    if (modelTitle) modelTitle.hidden = true;
  }

  /* ---------- marks ---------- */
  const marks = [];
  const bubbleFor = (id) => overlay.querySelector(`.env-bubble[data-mark="${id}"]`);

  function arrow(group, from, to, mat) {
    const g = new LineSegmentsGeometry().setPositions([from.x, from.y, from.z, to.x, to.y, to.z]);
    const shaft = new LineSegments2(g, mat);
    shaft.renderOrder = 4;
    group.add(shaft);
    /* an open, drafted arrowhead: two short strokes back from the tip, in the plane that faces
       the home view (Ethan, round 6: no cone tips) */
    const dir = to.clone().sub(from).normalize();
    let side = new THREE.Vector3().crossVectors(dir, B_H);
    if (side.lengthSq() < 1e-4) side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
    side.normalize();
    const len = 1.1, spread = Math.tan(Math.PI / 7);
    const back = to.clone().addScaledVector(dir, -len);
    const l = back.clone().addScaledVector(side, len * spread), r = back.clone().addScaledVector(side, -len * spread);
    const head = new LineSegments2(new LineSegmentsGeometry().setPositions([l.x, l.y, l.z, to.x, to.y, to.z, to.x, to.y, to.z, r.x, r.y, r.z]), mat);
    head.renderOrder = 4;
    group.add(head);
  }

  if (model) {
    const { box, group } = model;
    let axonIndex = 0;
    const axonOffsets = [4.5, 0, -4.5];          /* ft, so near-parallel arrows (axon 2 and 3 differ by ~2 deg) do not overlap */
    for (const d of drawings) {
      if (!d.markLabel) continue;
      const bubble = bubbleFor(d.id);
      if (!d.fit || !d.fit.registered) {
        console.warn(`[sheet3d] ${d.id}: fit ${d.fit ? `residual ${d.fit.residual} ft` : 'missing'}; no mark`);
        if (bubble) bubble.hidden = true;
        continue;
      }
      const lineM = lineMat(colors.accent, MARK_W.rest, { opacity: MARK_A.rest });    /* round 6: subtle until hovered */
      const markGroup = new THREE.Group();
      const mark = { id: d.id, kind: d.markKind, group: markGroup, lineM, bubble };

      if (d.markKind === 'section') {
        const back = d.fit.back;                 /* glb, unit, toward the section's viewer */
        if (Math.abs(back.x) < 0.99) {
          console.warn(`[sheet3d] ${d.id}: view is not along the wall (back ${back.toArray()}); no mark`);
          if (bubble) bubble.hidden = true;
          continue;
        }
        const sgn = Math.sign(back.x);
        const xEnd = sgn > 0 ? box.max.x : box.min.x;
        /* the drawing's extent through the fit: solve [A_gy A_gz] [gy gz]^T = P - t - A_gx * x */
        const [r0, r1] = d.fit.rows, t = d.fit.t;
        const a = r0[1], b = r0[2], c = r1[1], e = r1[2];
        const det = a * e - b * c;
        if (Math.abs(det) < 1e-9) { if (bubble) bubble.hidden = true; continue; }
        const back2d = (X, Y) => {
          const p = X - t[0] - r0[0] * xEnd, q = Y - t[1] - r1[0] * xEnd;
          return [(p * e - b * q) / det, (a * q - p * c) / det];
        };
        const B2 = d.bounds2d;
        const pts = [back2d(B2.x0, B2.y0), back2d(B2.x1, B2.y0), back2d(B2.x0, B2.y1), back2d(B2.x1, B2.y1)];
        /* The drawing's extent through the fit, clipped to the face. Where it covers most of
           the face (COVER), the cut is the face: the fit's scale is a least-squares estimate
           (the section's runs 1.068 across, yet its linework is exactly the model's 35.67 ft). */
        const COVER = 0.8;
        const fy0 = box.min.y - MARK_MARGIN_FT, fy1 = box.max.y + MARK_MARGIN_FT;
        const fz0 = box.min.z - MARK_MARGIN_FT, fz1 = box.max.z + MARK_MARGIN_FT;
        let gy0 = Math.max(Math.min(...pts.map((p) => p[0])), fy0);
        let gy1 = Math.min(Math.max(...pts.map((p) => p[0])), fy1);
        let gz0 = Math.max(Math.min(...pts.map((p) => p[1])), fz0);
        let gz1 = Math.min(Math.max(...pts.map((p) => p[1])), fz1);
        if ((gy1 - gy0) >= COVER * (fy1 - fy0)) { gy0 = fy0; gy1 = fy1; }
        if ((gz1 - gz0) >= COVER * (fz1 - fz0)) { gz0 = fz0; gz1 = fz1; }
        if (!(gy1 > gy0 && gz1 > gz0)) {
          console.warn(`[sheet3d] ${d.id}: the drawing does not overlap the model through its fit; no mark`);
          if (bubble) bubble.hidden = true;
          continue;
        }
        const x = xEnd + sgn * 0.04;                       /* just proud of the face */
        const rc = [[x, gy0, gz0], [x, gy0, gz1], [x, gy1, gz1], [x, gy1, gz0]].map(V);
        const pos = [];
        for (let i = 0; i < 4; i++) { const p = rc[i], q2 = rc[(i + 1) % 4]; pos.push(p.x, p.y, p.z, q2.x, q2.y, q2.z); }
        const outline = new LineSegments2(new LineSegmentsGeometry().setPositions(pos), lineM);
        outline.renderOrder = 4;
        markGroup.add(outline);
        const fillM = new THREE.MeshBasicMaterial({
          color: colors.accent, transparent: true, opacity: MARK_FILL.rest, depthWrite: false, side: THREE.DoubleSide,
        });
        const fill = new THREE.Mesh(new THREE.PlaneGeometry(gz1 - gz0, gy1 - gy0), fillM);
        fill.rotation.y = Math.PI / 2;                     /* plane normal along x */
        fill.position.set(x, (gy0 + gy1) / 2, (gz0 + gz1) / 2);
        fill.renderOrder = 4;
        markGroup.add(fill);
        /* the view arrow: from outside the face toward it, at the top of the cut */
        const ya = gy1 + 1.4, za = (gz0 + gz1) / 2;
        arrow(markGroup, V([x + sgn * 3.4, ya, za]), V([x + sgn * 0.5, ya, za]), lineM);
        Object.assign(mark, {
          fillM,
          rect: { x, gy0, gy1, gz0, gz1 },
          anchor: V([x + sgn * 4.4, ya, za]),
          endFace: [[xEnd, box.min.y, box.min.z], [xEnd, box.min.y, box.max.z], [xEnd, box.max.y, box.max.z], [xEnd, box.max.y, box.min.z]].map(V),
          cornersLocal: rc,
        });
      } else {
        const back = d.fit.back;
        const xEnd = back.x >= 0 ? box.max.x : box.min.x;
        const off = axonOffsets[axonIndex % axonOffsets.length];
        axonIndex++;
        /* aimed at the upper part of the end, where the wall stands above its ground */
        const E = V([xEnd, box.min.y + 0.62 * (box.max.y - box.min.y) + off, (box.min.z + box.max.z) / 2]);
        const head = E.clone().addScaledVector(back, 2.4);
        const tail = E.clone().addScaledVector(back, 8.5);
        arrow(markGroup, tail, head, lineM);
        Object.assign(mark, { from: tail, to: head, anchor: E.clone().addScaledVector(back, 9.6) });
      }
      group.add(markGroup);
      d.mark = mark;
      marks.push(mark);
    }
    group.updateMatrixWorld(true);
  } else {
    for (const b of overlay.querySelectorAll('.env-bubble')) b.hidden = true;
  }

  /* ---------- the lattice: the bold dots, lifted (lattice.js) ---------- */
  let lattice = null, rings = null, seatRing = null;
  const axisLines = [];
  if (model) {
    const wbox = new THREE.Box3().setFromPoints(model.cornersWorld);
    const rects = drawings.map((d) => ({ u0: d.rect.u0, v0: d.rect.v0, u1: d.rect.u1, v1: d.rect.v1 + TITLE_ROOM }));
    const all = rects.concat([model.paperRect]);
    const sheetRect = {
      u0: Math.min(...all.map((r) => r.u0)) - 6, v0: Math.min(...all.map((r) => r.v0)) - 6,
      u1: Math.max(...all.map((r) => r.u1)) + 6, v1: Math.max(...all.map((r) => r.v1)) + 6,
    };
    lattice = buildLattice({
      origin: model.originWorld, backH: B_H, toUV: toPaperUV, nodeUV: model.node, box: wbox,
      extent: opts.seat === 'ground' ? 'ground' : opts.extent, drawingRects: rects,
      clearDrawings: opts.drawings === 'clear', sheetRect, color: colors.ink, accent: colors.accent,
      stars: starField(colors.ink),
    });
    scene.add(lattice.points);
    /* the bounding box's top corners: where they land at home is the verticals decision. Measured
       (latticeDebug) but no longer ringed: they are corners of the box, not of the wall, so on
       screen they floated in empty paper (Ethan, round 3) */
    model.tops = model.cornersWorld.filter((c, i) => i % 4 >= 2);      /* corners with y = max */
  }
  /* the ground line, and the origin's marks (prototype round 3: seat, axes) */
  const seatMats = [];
  function seatLine(points, color, width, opacity, depthTest = true) {
    const m = lineMat(color, width, { opacity, depthTest });
    m.userData.base = opacity;
    seatMats.push(m);
    const l = new LineSegments2(new LineSegmentsGeometry().setPositions(points.flatMap((p) => [p.x, p.y, p.z])), m);
    l.renderOrder = 5;
    scene.add(l);
    return l;
  }
  function buildSeat(wbox) {
    const O = model.originWorld, u = model.unit;
    const reach = wbox.getSize(new THREE.Vector3()).length() * 0.6;
    /* the ground line spans the model's own paper rect, not the sheet */
    const gu = [model.paperRect.u0 - 1, model.paperRect.u1 + 1].map((u) => u - model.node[0]);
    if (opts.seat === 'ground') {
      /* where the ground meets the paper: a horizontal line in both planes, through the origin */
      seatLine([O.clone().addScaledVector(R_H, gu[0]), O.clone().addScaledVector(R_H, gu[1])], colors.ink, 1, 0.35);
    }
    const X = new THREE.Vector3(1, 0, 0), Yr = new THREE.Vector3(0, 0, -1), Z = new THREE.Vector3(0, 1, 0);
    if (opts.axes === 'datum') {
      /* each axis through the origin spans the model's whole extent along it, and one lattice unit
         (5 ft) past the box at both ends (Ethan, round 5: larger, past the model's extents) */
      for (const [d, m] of [[X, u.x], [Yr, u.z], [Z, u.y]]) {
        const t = model.cornersWorld.map((c) => c.clone().sub(O).dot(d));
        seatLine([O.clone().addScaledVector(d, Math.min(0, ...t) - m), O.clone().addScaledVector(d, Math.max(0, ...t) + m)],
          colors.accent, 1.1, 0.45, false);      /* round 6: subtle, a construction line, not a mark */
      }
    } else if (opts.axes === 'infinite') {
      for (const [d, len] of [[X, u.x], [Yr, u.z], [Z, u.y]]) seatLine([O, O.clone().addScaledVector(d, len)], colors.accent, 1.6, 0.95, false);
    }
    if (opts.axes === 'infinite') {
      /* each axis a unit segment through the origin, scaled every frame to run past the view's edge */
      for (const d of [X, Yr, Z]) {
        const l = seatLine([d.clone().negate(), d], colors.accent, 1, 0.38);
        l.position.copy(O);
        axisLines.push({ line: l, dir: d });
      }
    } else if (opts.axes === 'rhino') {
      /* Rhino's grid axes: X red, Y green, through the origin across the ground; Z a short blue.
         Drawn over the model: the X axis lies at grade, in the ground slab's top face */
      seatLine([O.clone().addScaledVector(X, -reach), O.clone().addScaledVector(X, reach)], '#c8524c', 1.2, 0.8, false);
      seatLine([O.clone().addScaledVector(Yr, -reach), O.clone().addScaledVector(Yr, reach)], '#58a85a', 1.2, 0.8, false);
      seatLine([O, O.clone().addScaledVector(Z, u.y)], '#5a78d0', 1.2, 0.9, false);
    }
    if (opts.axes !== 'none') {
      const ring = cornerRings([O], colors.accent);
      if (opts.axes === 'datum') ring.points.material.uniforms.uOpacity.value = 0.6;
      scene.add(ring.points);
      seatRing = ring;
    }
  }
  if (model) buildSeat(new THREE.Box3().setFromPoints(model.cornersWorld));
  const paperInk = parseFloat(getComputedStyle(stage).getPropertyValue('--env-paper')) || 0.34;

  /* ===================================================================
     camera: orientation q, the world point T at the stage centre, scale s
     =================================================================== */

  const camAxes = () => ({
    right: new THREE.Vector3(1, 0, 0).applyQuaternion(cam.q),
    up: new THREE.Vector3(0, 1, 0).applyQuaternion(cam.q),
    back: new THREE.Vector3(0, 0, 1).applyQuaternion(cam.q),
  });

  function project(X) {
    const { right, up } = camAxes();
    const d = X.clone().sub(cam.T);
    return [W / 2 + d.dot(right) * cam.s, H / 2 - d.dot(up) * cam.s];
  }

  function pointsFor(target) {
    if (target === 'sheet') {
      const ids = drawings.map((d) => d.id);
      return model ? pointsFor(ids).concat(model.cornersWorld) : pointsFor(ids);
    }
    if (target === 'model') {
      if (!model) return [];
      return model.cornersWorld.slice();
    }
    if (Array.isArray(target)) return target.flatMap((t) => pointsFor(t));
    const d = byId.get(target);
    if (!d) throw new Error(`sheet3d: view target "${target}" is not on this sheet`);
    const r = d.rect;
    return [paper(r.u0, r.v0), paper(r.u1, r.v0), paper(r.u0, r.v1 + TITLE_ROOM), paper(r.u1, r.v1 + TITLE_ROOM)];
  }

  function frame(points, q) {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    let r0 = Infinity, r1 = -Infinity, u0 = Infinity, u1 = -Infinity;
    const mean = new THREE.Vector3();
    for (const p of points) {
      const r = p.dot(right), u = p.dot(up);
      if (r < r0) r0 = r; if (r > r1) r1 = r; if (u < u0) u0 = u; if (u > u1) u1 = u;
      mean.add(p);
    }
    mean.multiplyScalar(1 / points.length);
    const free = freeRegion();
    const fw = Math.max(40, free.right - free.left), fh = Math.max(40, free.bottom - free.top);
    const s = clamp(Math.min((fw - 2 * PAD_PX) / Math.max(r1 - r0, 1e-3), (fh - 2 * PAD_PX) / Math.max(u1 - u0, 1e-3)), S_MIN, S_MAX);
    const C = mean.clone()
      .addScaledVector(right, (r0 + r1) / 2 - mean.dot(right))
      .addScaledVector(up, (u0 + u1) / 2 - mean.dot(up));
    /* the content centre lands on the free region's centre, not the stage's */
    const fcx = (free.left + free.right) / 2, fcy = (free.top + free.bottom) / 2;
    return { q: q.clone(), T: C.addScaledVector(up, (fcy - H / 2) / s).addScaledVector(right, -(fcx - W / 2) / s), s };
  }

  /* resolve a view target to a camera; unknown or unusable targets fall back loudly */
  function cameraFor(target) {
    if (target && typeof target === 'object' && !Array.isArray(target)) {
      if (target.camera) {
        const c = target.camera;
        if (!Array.isArray(c.q) || c.q.length !== 4 || !Array.isArray(c.T) || c.T.length !== 3 || !(c.s > 0)) {
          throw new Error('sheet3d: a camera view needs q [x, y, z, w], T [x, y, z] and s');
        }
        return { q: new THREE.Quaternion(...c.q).normalize(), T: V(c.T), s: clamp(c.s, S_MIN, S_MAX) };
      }
      if (typeof target.snap === 'string') {
        const d = byId.get(target.snap);
        if (!d) throw new Error(`sheet3d: snap target "${target.snap}" is not on this sheet`);
        if (!d.fit || !d.fit.registered || !model) {
          console.warn(`[sheet3d] ${d.id} has no registered view; framing the drawing instead`);
          return frame(pointsFor(d.id), Q_HOME);
        }
        return frame(model.cornersWorld, d.fit.q);
      }
      throw new Error('sheet3d: an object view target needs { snap } or { camera }');
    }
    let pts = pointsFor(target);
    if (!pts.length) pts = pointsFor('sheet');
    return frame(pts, Q_HOME);
  }

  function setCam(c) { cam.q.copy(c.q); cam.T.copy(c.T); cam.s = c.s; dirty = true; kick(); }

  let lastTarget = views.get('arrival').target;
  let moved = false;              /* the reader has driven the camera since the last view */
  function show(target, { animate = !reduceMotion } = {}) {
    const to = cameraFor(target);
    lastTarget = target;
    moved = false;
    if (!animate) { fly = null; setCam(to); return; }
    fly = { from: { q: cam.q.clone(), T: cam.T.clone(), s: cam.s }, to, t0: performance.now() / 1000, dur: T_FLY };
    kick();
  }
  const home = (opts) => show(views.get('arrival').target, opts);
  const focusOf = (t) => (typeof t === 'string' ? t : Array.isArray(t) ? t[0] : t && t.snap) || null;
  const snapTo = (id) => show({ snap: id });

  function stepFly(t) {
    if (!fly) return;
    const u = calm((t - fly.t0) / fly.dur);
    const { from, to } = fly;
    cam.q.slerpQuaternions(from.q, to.q, u);
    cam.T.lerpVectors(from.T, to.T, u);
    cam.s = Math.exp(Math.log(from.s) + (Math.log(to.s) - Math.log(from.s)) * u);
    dirty = true;
    if (u >= 1) fly = null;
  }

  /* ---------- input ---------- */
  function screenRay(x, y) {
    const { right, up, back } = camAxes();
    const o = cam.T.clone()
      .addScaledVector(right, (x - W / 2) / cam.s)
      .addScaledVector(up, -(y - H / 2) / cam.s)
      .addScaledVector(back, DIST);
    return new THREE.Ray(o, back.clone().negate());
  }
  function paperHit(x, y) {
    const ray = screenRay(x, y);
    const dn = ray.direction.dot(B_H);
    if (Math.abs(dn) < 1e-4) return null;              /* paper edge-on */
    const t = -ray.origin.dot(B_H) / dn;
    return ray.at(t, new THREE.Vector3());
  }

  function pivot() {
    if (model) {
      const [x, y] = project(model.center);
      const free = freeRegion();
      if (x >= 0 && x <= W && y >= free.top && y <= free.bottom) return model.center.clone();
    }
    const free = freeRegion();
    return paperHit(W / 2, (free.top + free.bottom) / 2) || cam.T.clone();
  }

  function rotateAbout(P, rot) {
    cam.q.premultiply(rot).normalize();
    cam.T.sub(P).applyQuaternion(rot).add(P);
    dirty = true; kick();
  }
  let orbitPivot = null;

  function zoomAt(f, x, y) {
    const s1 = clamp(cam.s * f, S_MIN, S_MAX);
    const { right, up } = camAxes();
    const ox = x - W / 2, oy = y - H / 2;
    cam.T.addScaledVector(right, ox * (1 / cam.s - 1 / s1)).addScaledVector(up, -oy * (1 / cam.s - 1 / s1));
    cam.s = s1;
    dirty = true; kick();
  }
  function panBy(dx, dy) {
    const { right, up } = camAxes();
    cam.T.addScaledVector(right, -dx / cam.s).addScaledVector(up, dy / cam.s);
    dirty = true; kick();
  }

  /* what is under a screen point: a mark first (they stand in front), then a drawing */
  function markAt(x, y) {
    if (!model) return null;
    for (const m of marks) {
      if (m.kind === 'section') {
        const ray = screenRay(x, y);
        const inv = model.group.matrixWorld.clone().invert();
        const o = ray.origin.clone().applyMatrix4(inv);
        const dir = ray.direction.clone().transformDirection(inv);
        if (Math.abs(dir.x) < 1e-6) continue;
        const t = (m.rect.x - o.x) / dir.x;
        const p = o.addScaledVector(dir, t);
        if (p.y >= m.rect.gy0 && p.y <= m.rect.gy1 && p.z >= m.rect.gz0 && p.z <= m.rect.gz1) return m.id;
      } else {
        const a = project(model.group.localToWorld(m.from.clone()));
        const b = project(model.group.localToWorld(m.to.clone()));
        const abx = b[0] - a[0], aby = b[1] - a[1];
        const L2 = abx * abx + aby * aby;
        const u = L2 > 0 ? clamp(((x - a[0]) * abx + (y - a[1]) * aby) / L2, 0, 1) : 0;
        if (Math.hypot(a[0] + u * abx - x, a[1] + u * aby - y) < 8) return m.id;
      }
    }
    return null;
  }
  /* is the model under a screen point: a ray against its faces (the ink's hulls, slightly proud of
     the faces, make the target a hair larger than the linework, which is what a hand wants) */
  const modelMeshes = [];
  if (model) model.group.traverse((o) => { if (o.isMesh && !o.isLineSegments2 && !o.isLine2) modelMeshes.push(o); });   /* faces only: fat lines are meshes too */
  const raycaster = new THREE.Raycaster();
  function modelAt(x, y) {
    if (!modelMeshes.length) return false;
    raycaster.ray.copy(screenRay(x, y));
    return raycaster.intersectObjects(modelMeshes, false).length > 0;
  }
  function drawingAt(x, y) {
    const X = paperHit(x, y);
    if (!X) return null;
    const [u, v] = toPaperUV(X);
    for (let i = drawings.length - 1; i >= 0; i--) {
      const r = drawings[i].rect;
      if (u >= r.u0 && u <= r.u1 && v >= r.v0 && v <= r.v1) return drawings[i].id;
    }
    return null;
  }

  let hot = null;
  function setHot(id) {
    if (hot === id) return;
    const paint = (did, on) => {
      const d = byId.get(did);
      if (!d) return;
      d.frame.visible = on;
      if (d.title) d.title.classList.toggle('is-hot', on);
      if (d.mark) {
        d.mark.lineM.linewidth = on ? MARK_W.hot : MARK_W.rest;
        d.mark.lineM.opacity = on ? MARK_A.hot : MARK_A.rest;
        if (d.mark.fillM) d.mark.fillM.opacity = on ? MARK_FILL.hot : MARK_FILL.rest;
        if (d.mark.bubble) d.mark.bubble.classList.toggle('is-hot', on);
      }
    };
    if (hot) paint(hot, false);
    hot = id;
    if (hot) paint(hot, true);
    stage.classList.toggle('is-over-drawing', !!hot);
    dirty = true; kick();
  }

  function activate(id, how) {
    const d = byId.get(id);
    if (!d) return;
    if (how === 'body' && ghost > 0.5) { home(); onFocus(focusOf(views.get('arrival').target)); return; }
    onFocus(id);
    if (how !== 'body' && d.fit && d.fit.registered && model && d.mark) { snapTo(id); return; }
    show(id);
  }

  attachGestures(stage, {
    begin() { fly = null; orbitPivot = null; moved = true; onHold(); },
    orbit(dx, dy) {
      if (!orbitPivot) orbitPivot = pivot();
      const { right } = camAxes();
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -dx * ORBIT_RAD_PER_PX);
      const pitch = new THREE.Quaternion().setFromAxisAngle(right, -dy * ORBIT_RAD_PER_PX);
      rotateAbout(orbitPivot, yaw.multiply(pitch));
    },
    pan: panBy,
    zoom: zoomAt,
    roll(angle, x, y) {
      const { back } = camAxes();
      const P = screenRay(x, y).origin.addScaledVector(back, -DIST);
      rotateAbout(P, new THREE.Quaternion().setFromAxisAngle(back, -angle));
    },
    pick(x, y) {
      const m = markAt(x, y);
      if (m) { onHold(); activate(m, 'mark'); return; }
      /* off home, a click on the model keeps the 3D view; a click anywhere else returns to the
         superimposed view (Ethan, round 7: the empty sheet is the way home, not a button) */
      if (ghost > 0.01) {
        if (modelAt(x, y)) return;
        home(); onFocus(focusOf(views.get('arrival').target));
        return;
      }
      const d = drawingAt(x, y);
      if (d) { onHold(); activate(d, 'body'); }
    },
    hover(x, y) { setHot(markAt(x, y) || drawingAt(x, y)); },
    leave() { setHot(null); },
  });

  overlay.addEventListener('click', (e) => {
    const t = e.target.closest('.env-title[data-drawing], .env-bubble[data-mark]');
    if (!t) return;
    const id = t.dataset.drawing || t.dataset.mark;
    if (byId.has(id)) { onHold(); activate(id, t.dataset.mark ? 'mark' : 'title'); }
  });
  const hoverTarget = (e) => {
    const t = e.target.closest('.env-title[data-drawing], .env-bubble[data-mark]');
    return t ? (t.dataset.drawing || t.dataset.mark) : null;
  };
  overlay.addEventListener('pointerover', (e) => { const id = hoverTarget(e); if (id && byId.has(id)) setHot(id); });
  overlay.addEventListener('pointerout', (e) => {
    const t = e.target.closest('.env-title, .env-bubble');
    if (t && !t.contains(e.relatedTarget)) setHot(null);
  });
  overlay.addEventListener('focusin', (e) => { const id = hoverTarget(e); if (id && byId.has(id)) setHot(id); });
  overlay.addEventListener('focusout', () => setHot(null));
  if (homeBtn) homeBtn.addEventListener('click', () => { home(); onFocus(focusOf(views.get('arrival').target)); });
  stage.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ghost > 0.01) { e.preventDefault(); home(); } });

  /* ===================================================================
     drawing
     =================================================================== */
  function render() {
    const { right, up, back } = camAxes();
    camera.quaternion.copy(cam.q);
    camera.position.copy(cam.T).addScaledVector(back, DIST);
    camera.left = -W / 2 / cam.s; camera.right = W / 2 / cam.s;
    camera.top = H / 2 / cam.s; camera.bottom = -H / 2 / cam.s;
    camera.near = 0; camera.far = 2 * DIST;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    /* ghost: how far the camera has left the superimposed view (roll counts) */
    const dot = Math.min(1, Math.abs(cam.q.dot(Q_HOME)));
    const angle = 2 * Math.acos(dot);
    ghost = smooth(GHOST_FROM, GHOST_TO, angle);
    lift = smooth(GHOST_FROM, LIFT_TO, angle);
    if (lattice) { lattice.update(lift, cam.s, renderer.getPixelRatio(), paperInk); lattice.setTime(performance.now() / 1000); }
    if (rings) rings.setSize(11 * renderer.getPixelRatio());
    if (seatRing) seatRing.setSize((opts.axes === 'datum' ? 15 : 13) * renderer.getPixelRatio());
    for (const a of axisLines) {
      /* long enough to cross the whole view from wherever the origin is; capped so the far end
         stays inside the camera's depth range (an axis pointing at the camera is short on screen anyway) */
      const O = a.line.position;
      const across = (Math.hypot(W, H) / cam.s) + O.distanceTo(cam.T);
      const depth = Math.abs(a.dir.dot(back)), slack = 0.9 * DIST - Math.abs(O.clone().sub(cam.T).dot(back));
      const len = depth > 1e-6 ? Math.min(across, slack / depth) : across;
      a.line.scale.setScalar(Math.max(len, 0.001));
      a.line.updateMatrixWorld();
    }
    const op = 1 - (1 - GHOST_OPACITY) * ghost;
    const zoomK = clamp(cam.s / 16, 0.55, 1.5) * (1 - 0.45 * ghost);
    for (const [w, m] of Object.entries(weightMats)) { m.linewidth = WEIGHT_PX[w] * zoomK; m.opacity = op; }
    for (const m of rasterMats) m.opacity = op;
    frameMat.opacity = Math.max(op, 0.5);
    const inkW = lineWidthForStep(clamp(cam.s, 12, 26));
    ink.setLineWidth(inkW);
    ink.setOutlineWidth(inkW);
    stage.style.setProperty('--env-ghost', ghost.toFixed(3));
    stage.classList.toggle('is-ghosted', ghost > 0.5);

    renderer.render(scene, camera);

    /* the paper's affine map for the dots */
    const o = project(new THREE.Vector3());
    const a = [R_H.dot(right) * cam.s, -R_H.dot(up) * cam.s];
    const b = [-U_H.dot(right) * cam.s, U_H.dot(up) * cam.s];
    dots.draw({ origin: o, a, b }, { ink: colors.ink, accent: colors.accent, fade: 1 - 0.7 * ghost, boldFade: lattice ? 1 - lift : 1 });

    overlay.style.setProperty('--env-title-size', clamp(cam.s * 0.8, 11, 17) + 'px');
    for (const d of drawings) {
      if (!d.title) continue;
      const [x, y] = project(paper(d.rect.u0, d.rect.v1 + TITLE_GAP));
      d.title.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
    if (model && modelTitle) {
      const [x, y] = project(paper(model.paperRect.u0, model.paperRect.v1 + TITLE_GAP));
      modelTitle.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
    for (const m of marks) {
      if (!m.bubble) continue;
      const [x, y] = project(model.group.localToWorld(m.anchor.clone()));
      m.bubble.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  /* verification: how far the drawn lattice points, and the model's top corners, sit from the
     nearest bold dot on screen (meaningful at home, where they should coincide) */
  function latticeDebug() {
    const err = (X) => {
      const [u, v] = toPaperUV(X);
      const n = D.nearestBold(u, v);
      const a = project(X), b = project(paper(n[0], n[1]));
      return Math.hypot(a[0] - b[0], a[1] - b[1]);
    };
    let maxFlat = 0, maxNow = 0, maxLifted = 0;
    const step = Math.max(1, Math.floor(lattice.count / 4000));
    for (let i = 0; i < lattice.count; i += step) {
      maxFlat = Math.max(maxFlat, err(lattice.pointAt(i, 0)));
      maxLifted = Math.max(maxLifted, err(lattice.pointAt(i, 1)));
      const a = project(lattice.pointAt(i, lift)), b = project(lattice.pointAt(i, 0));
      maxNow = Math.max(maxNow, Math.hypot(a[0] - b[0], a[1] - b[1]));
    }
    const sample = [0, Math.floor(lattice.count / 2), lattice.count - 1].map((i) => project(lattice.pointAt(i, lift)));
    return {
      count: lattice.count, maxFlatErrPx: maxFlat, maxLiftedErrPx: maxLifted, maxFromCollapsedPx: maxNow, sample,
      topCornerErrPx: model.tops.map(err), vScale: vs,
    };
  }

  let lastTwinkle = 0;
  const TWINKLE_DT = 1 / 20;          /* stars breathe at 20 fps: slow enough, and cheap */
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    raf = 0;
    if (!ready) return;               /* the first frame is drawn at the end of createSheet */
    const now = performance.now() / 1000;
    stepFly(now);
    if (dirty) { dirty = false; render(); lastTwinkle = now; }
    else if (now - lastTwinkle >= TWINKLE_DT) {
      /* a star frame: the paper redraws; the GL only while the lattice is lifted */
      lastTwinkle = now;
      dots.twinkle(now);
      if (lattice && lattice.twinkling && lift > 0.001) { lattice.setTime(now); renderer.render(scene, camera); }
    }
    if (fly || dots.twinkling) kick();
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!(W > 0 && H > 0)) return;
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    ink.setResolution(W, H);
    dots.resize(W, H);
    dirty = true;
    kick();
  }

  ready = true;
  resize();
  home({ animate: false });
  render();
  dirty = false;
  stage.classList.add('is-ready');

  return {
    kind: '3d',
    show,
    home,
    snapTo,
    resize,
    /* re-frame the last view for a new free region, unless the reader has moved the camera */
    refit({ force = false, animate = !reduceMotion } = {}) { if (force || !moved) show(lastTarget, { animate }); },
    zoomBy(f) {
      const free = freeRegion();
      fly = null;
      zoomAt(f, (free.left + free.right) / 2, (free.top + free.bottom) / 2);
    },
    /* verification only: numbers, never text */
    debug() {
      const { back } = camAxes();
      const out = {
        camera: { q: cam.q.toArray(), T: cam.T.toArray(), s: cam.s, back: back.toArray() },
        flying: !!fly,
        ghost,
        webgl: true,
        hot,
        lineOpacity: weightMats.light.opacity,
        rasterOpacity: rasterMats.length ? rasterMats[0].opacity : null,
        dots: dots.lastCount,
        model: model ? { node: model.node, screen: model.cornersWorld.map(project) } : null,
        drawings: drawings.map((d) => ({
          id: d.id,
          registered: !!(d.fit && d.fit.registered),
          residual: d.fit ? d.fit.residual : null,
          hasMark: !!d.mark,
          screen: [project(paper(d.rect.u0, d.rect.v0)), project(paper(d.rect.u1, d.rect.v1))],
        })),
        options: opts,
        lift,
        lattice: lattice ? latticeDebug() : null,
        marks: marks.map((m) => ({
          id: m.id,
          kind: m.kind,
          anchor: project(model.group.localToWorld(m.anchor.clone())),
          corners: m.cornersLocal ? m.cornersLocal.map((c) => project(model.group.localToWorld(c.clone()))) : null,
          endFace: m.endFace ? m.endFace.map((c) => project(model.group.localToWorld(c.clone()))) : null,
          marginPx: MARK_MARGIN_FT * k * cam.s,
        })),
      };
      return out;
    },
    project: (xyz) => project(V(xyz)),
    drawingAt: (x, y) => drawingAt(x, y),   /* verification: the same hit test a click uses */
  };
}
