/* ===================================================================
   LATTICE — the bold dots, lifted into the cube lattice they stand for.
   PROTOTYPE (prototype/grid/project). Ethan chose option A: the dot set
   splits by meaning. Light (cartesian) dots are the ground plane and stay
   on the paper in every view. Bold dots were the 2D stand-in for a cube
   lattice; off the superimposed view they lift into it, and on the way
   home they collapse back, several 3D points stacking onto one bold dot.

   GEOMETRY. One lattice unit is L = 2*sqrt(2) world units across (it
   projects to "2 across, 1 up" on the paper) and Hp = 2 / cos(30 deg)
   world units up (it projects to 2 steps: the paper's drafting vertical).
   From an origin O that projects onto a bold node, the point (i, j, m)
   projects at home to (2(i - m), (i + m) - 2j) steps; half the column plus
   the row is 2(i - j), always even, so every point lands on a bold dot.

   COLLAPSE IS THE DIMETRIC PROJECTION. Each point has a lifted position P
   and a flat one, P slid along the home view direction onto the paper
   plane. The vertex shader draws mix(flat, P, lift); lift is tied to how
   far the camera has turned from home, not to a clock.

   Options (URL params, read by sheet3d.js):
     extent   tight  the model's bounding volume plus one cube
              sheet  every bold node of the sheet, over the model's levels
     drawings clear  no point collapses onto a drawing (a clearance column
                     along the view direction above each drawing rect)
              under  the lattice passes over the drawings
   =================================================================== */
import * as THREE from 'three';
import { isBold } from '../axon/dimetric.js';
import { gridStyle } from './gridstyle.js';

export const L_UNIT = 2 * Math.SQRT2;
export const H_UNIT = 2 / Math.cos(Math.PI / 6);
const MAX_POINTS = 60000;

const VERT = /* glsl */ `
attribute vec3 aFlat;
attribute float aAlpha;
uniform float uLift;
uniform float uSize;
varying float vAlpha;
void main() {
  vec3 p = mix(aFlat, position, uLift);
  vAlpha = aAlpha;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize;
}`;
const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uRing;
uniform float uShape;   /* 0 dot, 2 plus, 3 cross (the 2:1 plan axes) */
uniform float uStroke;  /* stroke half-width, as a share of the sprite */
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r = length(c);
  if (uShape > 2.5) {
    vec2 d1 = normalize(vec2(2.0, -1.0)), d2 = normalize(vec2(2.0, 1.0));
    float e1 = abs(c.x * d1.y - c.y * d1.x), e2 = abs(c.x * d2.y - c.y * d2.x);
    if (r > 1.0 || min(e1, e2) > uStroke) discard;
  } else if (uShape > 1.5) {
    if (max(abs(c.x), abs(c.y)) > 1.0 || min(abs(c.x), abs(c.y)) > uStroke) discard;
  } else {
    if (r > 1.0) discard;
    if (uRing > 0.5 && r < 0.55) discard;
  }
  gl_FragColor = vec4(uColor, uOpacity * vAlpha);
}`;

/* these shaders write gl_FragColor straight to the canvas, so the CSS colour goes in as-is:
   a default Color() would convert sRGB to linear and draw every mark darker and harsher */
const rawColor = (css) => new THREE.Color().setStyle(css, THREE.LinearSRGBColorSpace);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* origin: world point projecting onto a bold node; backH: the home view's back vector;
   toUV(world) -> [u, v] steps on the paper. box: the model's world-space bounds (Box3). */
export function buildLattice({ origin, backH, toUV, nodeUV, box, extent, drawingRects, clearDrawings, sheetRect, color, accent = color }) {
  if (!['tight', 'sheet', 'ground'].includes(extent)) throw new Error(`lattice: extent must be tight, sheet or ground, got "${extent}"`);
  const st = gridStyle();
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const R = 0.5 * size.length();
  const rel = box.min.clone().sub(origin);
  const i0 = Math.floor(rel.x / L_UNIT) - 1, i1 = Math.ceil((rel.x + size.x) / L_UNIT) + 1;
  const m0 = Math.floor(rel.z / L_UNIT) - 1, m1 = Math.ceil((rel.z + size.z) / L_UNIT) + 1;
  const j0 = Math.floor(rel.y / H_UNIT) - 1, j1 = Math.ceil((rel.y + size.y) / H_UNIT) + 1;

  const blocked = (u, v) => clearDrawings && drawingRects.some((r) => u >= r.u0 - 1 && u <= r.u1 + 1 && v >= r.v0 - 1 && v <= r.v1 + 1);
  const pos = [], flat = [], alpha = [];
  const fade = extent === 'tight' ? [0.55 * R, 1.25 * R] : extent === 'ground' ? [0.7 * R, 1.6 * R] : [0.9 * R, 3.2 * R];
  const P = new THREE.Vector3();
  function add(i, j, m) {
    P.set(origin.x + i * L_UNIT, origin.y + j * H_UNIT, origin.z + m * L_UNIT);
    const [u, v] = toUV(P);
    if (blocked(u, v)) return;
    const a = 1 - smooth(fade[0], fade[1], P.distanceTo(center));
    if (a <= 0.02) return;
    const d = P.dot(backH);
    pos.push(P.x, P.y, P.z);
    flat.push(P.x - backH.x * d, P.y - backH.y * d, P.z - backH.z * d);
    alpha.push(a);
  }
  if (extent === 'ground') {
    /* one level: the plane the model stands on (j = 0 is the origin's level), a margin around the footprint */
    for (let i = i0 - 2; i <= i1 + 2; i++) for (let m = m0 - 2; m <= m1 + 2; m++) add(i, 0, m);
  } else if (extent === 'tight') {
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) for (let m = m0; m <= m1; m++) add(i, j, m);
  } else {
    /* every bold node of the sheet, one point per level: node (c, r) relative to the origin's
       node, level j  ->  i - m = dc / 2, i + m = dr + 2j */
    const [c0, r0] = nodeUV;
    for (let r = Math.floor(sheetRect.v0); r <= Math.ceil(sheetRect.v1); r++) {
      for (let c = Math.floor(sheetRect.u0); c <= Math.ceil(sheetRect.u1); c++) {
        if (!isBold(c, r)) continue;
        const dc = c - c0, dr = r - r0;
        for (let j = j0; j <= j1; j++) {
          const s = dr + 2 * j, dd = dc / 2;
          if ((s + dd) % 2 !== 0) continue;               /* cannot happen for bold nodes; guards the algebra */
          add((s + dd) / 2, j, (s - dd) / 2);
        }
      }
    }
  }
  const count = alpha.length;
  if (count > MAX_POINTS) throw new Error(`lattice: ${count} points is over the cap (${MAX_POINTS})`);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aFlat', new THREE.Float32BufferAttribute(flat, 3));
  geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
    uniforms: {
      uLift: { value: 0 }, uSize: { value: 4 }, uColor: { value: rawColor(st.tint ? accent : color) },
      uOpacity: { value: 1 }, uRing: { value: 0 },
      uShape: { value: st.shape === 'plus' ? 2 : st.shape === 'cross' ? 3 : 0 }, uStroke: { value: 0.12 },
    },
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 0;

  return {
    points, count, pos, flat,
    /* lift: 0..1; stepPx: css px per step; dpr; opacity: the paper's ink strength */
    update(lift, stepPx, dpr, opacity) {
      mat.uniforms.uLift.value = lift;
      /* the style's mark, at the style's weight; 'lines' has no node mark, so a small quiet dot stands in */
      const marked = st.shape === 'plus' || st.shape === 'cross';
      const r = marked ? Math.max(st.arm * stepPx, 2) : Math.max((st.rBold || st.rLight) * stepPx, 0.8);
      mat.uniforms.uSize.value = 2 * r * dpr;
      mat.uniforms.uStroke.value = marked ? Math.min(0.45, 0.6 / r) : 0.12;
      mat.uniforms.uOpacity.value = opacity * lift * (st.shape === 'lines' ? 0.6 : st.aBold);
      points.visible = lift > 0.001;
    },
    pointAt(k, lift) {
      return new THREE.Vector3(
        flat[3 * k] + (pos[3 * k] - flat[3 * k]) * lift,
        flat[3 * k + 1] + (pos[3 * k + 1] - flat[3 * k + 1]) * lift,
        flat[3 * k + 2] + (pos[3 * k + 2] - flat[3 * k + 2]) * lift);
    },
  };
}

/* the model's top edges, ringed in the accent: at home they sit on bold dots only when the
   model's verticals are on paper spacing and its height is a whole number of units */
export function cornerRings(cornersWorld, color) {
  const geo = new THREE.BufferGeometry();
  const flatPos = cornersWorld.flatMap((c) => [c.x, c.y, c.z]);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(flatPos, 3));
  geo.setAttribute('aFlat', new THREE.Float32BufferAttribute(flatPos, 3));
  geo.setAttribute('aAlpha', new THREE.Float32BufferAttribute(cornersWorld.map(() => 1), 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false,
    uniforms: {
      uLift: { value: 1 }, uSize: { value: 11 }, uColor: { value: rawColor(color) },
      uOpacity: { value: 0.95 }, uRing: { value: 1 }, uShape: { value: 0 }, uStroke: { value: 0.12 },
    },
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  return { points: pts, setSize(px) { mat.uniforms.uSize.value = px; } };
}
