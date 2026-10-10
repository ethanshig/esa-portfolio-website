/* ===================================================================
   LIFT — the plan rises into 2:1 dimetric. PROTOTYPE (prototype/grid/axon).

   One three.js stage, reused. On lift, the card's image becomes a textured
   plane lying on the paper, seen straight down at exactly the size the HTML
   image had. The orthographic camera then swings to azimuth 45 / elevation
   30 (see dimetric.js) while the zoom settles to 2*sqrt(2) px per unit per
   dot step, so the plan axes land on the bold lattice at slope 1/2.
   If the record has a model, it grows up from the paper in hidden-line ink
   and the plane fades; if not (or it fails to load), the sheet stays.
   =================================================================== */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as D from './dimetric.js';

const DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/';
const EDGE_ANGLE = 25;              /* deg: creases sharper than this are drawn */
const EDGE_ANGLE_DENSE = 45;        /* fallback for very dense meshes */
const DENSE_SEGMENTS = 150000;      /* above this many edge segments, use the fallback */
const MAX_INSTANCES = 2000;         /* per InstancedMesh, edges are drawn per instance */
const LOAD_TIMEOUT_MS = 20000;

/* choreography, seconds */
const T_CAMERA = 0.9;               /* plan -> dimetric */
const T_GROW_DELAY = 0.35;          /* model starts rising this far into the swing */
const T_GROW = 0.9;
const T_FADE_DELAY = 0.3;           /* after the model starts */
const T_FADE = 0.5;
const T_DROP = 0.6;
const T_TURN = 0.55;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, u) => a + (b - a) * u;
const calm = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
const nowS = () => performance.now() / 1000;

/* ---------- tweens: a value with a target, a start time and a duration ---------- */
function tween(v) { return { from: v, to: v, t0: 0, dur: 0, ease: calm }; }
function valueAt(tw, t) {
  if (tw.dur <= 0 || t >= tw.t0 + tw.dur) return tw.to;
  if (t <= tw.t0) return tw.from;
  return lerp(tw.from, tw.to, tw.ease((t - tw.t0) / tw.dur));
}
function retarget(tw, to, dur, t, delay = 0, ease = calm) {
  tw.from = valueAt(tw, t);
  tw.to = to;
  tw.t0 = t + delay;
  tw.dur = dur;
  tw.ease = ease;
}
function settled(tw, t) { return tw.dur <= 0 || t >= tw.t0 + tw.dur; }

function docRect(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

function cssToken(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/* ===================================================================
   model preparation: one template per record, cloned per lift
   =================================================================== */
function edgeSegmentsFor(geometry, angle) {
  const eg = new THREE.EdgesGeometry(geometry, angle);
  const n = eg.attributes.position.count / 2;
  return { eg, n };
}

/* Turn any Object3D into hidden-line ink: bg-coloured faces pushed back by
   polygon offset, crease edges as screen-width lines on top. Returns the
   template and its bounding box in its own units. Throws if there is
   nothing drawable. */
function inkTemplate(root, mats) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (box.isEmpty() || ![size.x, size.y, size.z].every(Number.isFinite)) {
    throw new Error('model has no measurable geometry');
  }

  const meshes = [];
  const lines = [];
  root.traverse((o) => {
    if (o.isMesh) meshes.push(o);
    else if (o.isLine || o.isLineSegments || o.isPoints) lines.push(o);
  });
  if (!meshes.length && !lines.length) throw new Error('model has no meshes or lines');

  /* edge density check first, so a scanned mesh does not turn to a black blot */
  let angle = EDGE_ANGLE;
  let built = meshes.map((m) => edgeSegmentsFor(m.geometry, angle));
  const total = meshes.reduce((s, m, i) =>
    s + built[i].n * (m.isInstancedMesh ? Math.min(m.count, MAX_INSTANCES) : 1), 0);
  if (total > DENSE_SEGMENTS) {
    built.forEach((b) => b.eg.dispose());
    angle = EDGE_ANGLE_DENSE;
    built = meshes.map((m) => edgeSegmentsFor(m.geometry, angle));
  }

  const disposeMaterial = (m) => {
    for (const mat of Array.isArray(m) ? m : [m]) {
      if (!mat) continue;
      for (const k of Object.keys(mat)) { const v = mat[k]; if (v && v.isTexture) v.dispose(); }
      mat.dispose();
    }
  };

  meshes.forEach((mesh, i) => {
    disposeMaterial(mesh.material);
    mesh.material = mats.face;
    mesh.castShadow = mesh.receiveShadow = false;
    const lg = new LineSegmentsGeometry().fromEdgesGeometry(built[i].eg);
    built[i].eg.dispose();
    if (mesh.isInstancedMesh) {
      /* LineSegments2 cannot instance: one line object per instance, capped. */
      const count = Math.min(mesh.count, MAX_INSTANCES);
      const m4 = new THREE.Matrix4();
      for (let k = 0; k < count; k++) {
        mesh.getMatrixAt(k, m4);
        const line = new LineSegments2(lg, mats.line);
        line.matrixAutoUpdate = false;
        line.matrix.copy(m4);
        mesh.add(line);
      }
    } else {
      mesh.add(new LineSegments2(lg, mats.line));
    }
  });
  lines.forEach((o) => { disposeMaterial(o.material); o.material = o.isPoints ? mats.points : mats.thin; });

  return { root, box, edgeAngle: angle };
}

/* A glb-free solid: a gabled house with a chimney, to prove the camera and
   the hidden-line edges without any exported model. Units are arbitrary. */
function testSolid() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3));
  body.position.set(0, 1, 0);
  const tri = new THREE.Shape();
  tri.moveTo(-2, 0); tri.lineTo(2, 0); tri.lineTo(0, 1.4); tri.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 3, bevelEnabled: false }));
  roof.position.set(0, 2, -1.5);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5));
  chimney.position.set(1.1, 2.9, 0.6);
  const porch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1));
  porch.position.set(-0.8, 0.15, 2);
  g.add(body, roof, chimney, porch);
  return g;
}

/* ===================================================================
   the stage
   =================================================================== */
export function createStage({ stageEl, paper, reduceMotion }) {
  if (!stageEl) throw new Error('lift: stage element missing');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  stageEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
  const turnGroup = new THREE.Group();
  scene.add(turnGroup);

  const mats = {
    face: new THREE.MeshBasicMaterial({
      color: 0xffffff, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    }),
    line: new LineMaterial({ color: 0x000000, linewidth: 1.2, worldUnits: false }),
    thin: new THREE.LineBasicMaterial({ color: 0x000000 }),
    points: new THREE.PointsMaterial({ color: 0x000000, size: 2, sizeAttenuation: false }),
    plane: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, toneMapped: false }),
    planeLine: new LineMaterial({ color: 0x000000, linewidth: 1.2, worldUnits: false, transparent: true }),
  };

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);

  /* id -> Promise<template>. A failed load is forgotten so the next lift
     retries: models are being exported while this page is open. */
  const templates = new Map();
  let testTemplate = null;

  function loadTemplate(id) {
    if (templates.has(id)) return templates.get(id);
    const url = new URL(`../models/${encodeURIComponent(id)}.glb`, import.meta.url).href;
    const pr = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timed out after ${LOAD_TIMEOUT_MS} ms`)), LOAD_TIMEOUT_MS);
      loader.load(url, (gltf) => {
        clearTimeout(timer);
        try { resolve(inkTemplate(gltf.scene, mats)); } catch (e) { reject(e); }
      }, undefined, (err) => { clearTimeout(timer); reject(err instanceof Error ? err : new Error(String(err))); });
    }).catch((err) => {
      templates.delete(id);
      console.info(`[axon] ${id}: no model (${err.message}); showing the sheet`);
      return null;
    });
    templates.set(id, pr);
    return pr;
  }

  function getTestTemplate() {
    if (!testTemplate) testTemplate = inkTemplate(testSolid(), mats);
    return Promise.resolve(testTemplate);
  }

  function applyColors() {
    const ink = cssToken('--color-primary', '#1a1a1a');
    const bg = cssToken('--color-bg', '#fafafa');
    mats.face.color.set(bg);
    mats.line.color.set(ink);
    mats.thin.color.set(ink);
    mats.points.color.set(ink);
    mats.planeLine.color.set(ink);
  }

  function lineWidthPx() { return Math.min(1.6, Math.max(1, paper.p * 0.06)); }

  let cur = null;          /* the lifted card's state, or null */
  let token = 0;           /* bumps on every lift / teardown so late loads are ignored */
  let raf = 0;
  let waiters = [];        /* resolve() callbacks waiting for all tweens to settle */

  /* ---------- geometry of the current card ---------- */
  function measureCard(state) {
    const p = paper.p;
    const sheet = docRect(state.sheetEl);
    const img = docRect(state.imgEl);
    const s0 = 4 * p;                       /* plan: one unit = 4 steps = one L */
    const s1 = D.UNIT_PX_PER_STEP * p;      /* dimetric */
    const docW = document.documentElement.clientWidth;
    const m = 0.5 * Math.max(sheet.w, sheet.h);
    const x0 = Math.max(0, sheet.x - m), x1 = Math.min(docW, sheet.x + sheet.w + m);
    const y0 = Math.max(0, sheet.y - m), y1 = sheet.y + sheet.h + m;
    Object.assign(state, {
      p, sheet, img, s0, s1,
      stage: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
      planeW: img.w / s0, planeH: img.h / s0,
    });
    stageEl.style.left = x0 + 'px';
    stageEl.style.top = y0 + 'px';
    stageEl.style.width = (x1 - x0) + 'px';
    stageEl.style.height = (y1 - y0) + 'px';
    renderer.setSize(x1 - x0, y1 - y0, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    const lw = lineWidthPx();
    for (const lm of [mats.line, mats.planeLine]) {
      lm.linewidth = lw;
      lm.resolution.set(x1 - x0, y1 - y0);
    }
  }

  /* Where the footprint centre (world origin) must project, in document px,
     so the footprint's min corner sits on the nearest bold node and the
     projected box is centred in the sheet. a, b: plan extents along X, Z;
     h: projected height factor (units of height already multiplied by the
     vertical mode). */
  function placement(state, a, b, h) {
    const p = state.p, S = state.sheet;
    const cx = S.x + S.w / 2, cy = S.y + S.h / 2;
    const ideal = [
      cx - (a - b) * p,
      cy - ((a + b) - D.TRUE_VERTICAL_STEPS * h) / 2 * p,
    ];
    const [cs, rs] = paper.stepsAt(ideal[0], ideal[1]);
    const node = D.nearestBold(cs, rs);
    const corner = node ? paper.dotPx(node[0], node[1]) : ideal;
    return { anchor: [corner[0] + (a - b) * p, corner[1] + (a + b) / 2 * p], cornerNode: node };
  }

  function dims(state) {
    if (state.model) {
      const { k, sx, sy, sz } = state.model;
      return [k * sx, k * sz, k * sy * state.vScale];
    }
    return [state.planeW, state.planeH, 0];
  }

  function fitModel(state) {
    const m = state.model;
    m.k = D.fitScale(m.sx, m.sy, m.sz, state.sheet.w, state.sheet.h, state.p, state.vScale, 1);
  }

  /* ---------- the plane: the card's own image lying on the paper ---------- */
  function buildPlane(state) {
    const img = state.imgEl;
    let tex = null;
    if (img.complete && img.naturalWidth > 0) {
      tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      /* object-fit: cover, centred */
      const bw = state.img.w, bh = state.img.h, nw = img.naturalWidth, nh = img.naturalHeight;
      const sc = Math.max(bw / nw, bh / nh);
      const fx = bw / (nw * sc), fy = bh / (nh * sc);
      tex.repeat.set(fx, fy);
      tex.offset.set((1 - fx) / 2, (1 - fy) / 2);
      tex.needsUpdate = true;
    }
    /* image failed to load: a blank sheet in the page colour, still outlined */
    mats.plane.map = tex;
    mats.plane.color.set(tex ? 0xffffff : cssToken('--color-bg', '#fafafa'));
    mats.plane.needsUpdate = true;

    const geo = new THREE.PlaneGeometry(state.planeW, state.planeH);
    geo.rotateX(-Math.PI / 2);              /* image top -> -Z: screen top in plan */
    const plane = new THREE.Mesh(geo, mats.plane);
    plane.renderOrder = -1;
    const outline = new LineSegments2(
      new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geo)), mats.planeLine);
    plane.add(outline);
    turnGroup.add(plane);
    state.plane = plane;
    state.texture = tex;
  }

  function attachModel(state, tpl) {
    const inner = tpl.root.clone(true);
    const size = tpl.box.getSize(new THREE.Vector3());
    const center = tpl.box.getCenter(new THREE.Vector3());
    inner.position.set(-center.x, -tpl.box.min.y, -center.z);
    const holder = new THREE.Group();
    holder.add(inner);
    turnGroup.add(holder);
    state.model = { holder, sx: size.x, sy: size.y, sz: size.z, k: 1, edgeAngle: tpl.edgeAngle };
    fitModel(state);

    const t = nowS();
    const [a, b, h] = dims(state);
    const place = placement(state, a, b, h);
    state.cornerNode = place.cornerNode;
    const growStart = Math.max(t, state.cam.t0 + T_GROW_DELAY);
    const dur = reduceMotion ? 0 : T_GROW;
    retarget(state.ax, place.anchor[0], dur, t, reduceMotion ? 0 : growStart - t);
    retarget(state.ay, place.anchor[1], dur, t, reduceMotion ? 0 : growStart - t);
    retarget(state.grow, 1, dur, t, reduceMotion ? 0 : growStart - t, easeOut);
    retarget(state.fade, 0, reduceMotion ? 0 : T_FADE, t, reduceMotion ? 0 : growStart - t + T_FADE_DELAY);
    kick();
  }

  /* ---------- per-frame ---------- */
  function setCamera(state, t) {
    const c = valueAt(state.cam, t);
    const theta = lerp(Math.PI / 2, D.ELEVATION, c);
    const phi = lerp(0, D.AZIMUTH, c);
    const zoom = lerp(state.s0, state.s1, c);
    const ax = valueAt(state.ax, t), ay = valueAt(state.ay, t);
    const R = state.stage;
    /* Frustum in world units around the target (camera.zoom scales about the
       frustum centre, not the target, so the px -> unit division is done here). */
    camera.left = (R.x - ax) / zoom;
    camera.right = (R.x + R.w - ax) / zoom;
    camera.top = (ay - R.y) / zoom;
    camera.bottom = (ay - (R.y + R.h)) / zoom;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    const B = D.cameraBasis(theta, phi);
    camera.position.set(B.back[0] * 100, B.back[1] * 100, B.back[2] * 100);
    camera.up.set(B.up[0], B.up[1], B.up[2]);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    return c;
  }

  function render() {
    raf = 0;
    if (!cur) return;
    const t = nowS();
    const c = setCamera(cur, t);
    turnGroup.rotation.y = valueAt(cur.turn, t);
    const fade = valueAt(cur.fade, t);
    mats.plane.opacity = fade;
    mats.planeLine.opacity = fade * c;
    cur.plane.visible = fade > 0.001;
    if (cur.model) {
      const g = valueAt(cur.grow, t);
      const k = cur.model.k;
      cur.model.holder.visible = g > 0.001;
      cur.model.holder.scale.set(k, k * cur.vScale * Math.max(g, 0.001), k);
    }
    renderer.render(scene, camera);
    const busy = [cur.cam, cur.ax, cur.ay, cur.grow, cur.fade, cur.turn].some((tw) => !settled(tw, t));
    if (busy) raf = requestAnimationFrame(render);
    else { const w = waiters; waiters = []; w.forEach((f) => f()); }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(render); }
  function whenSettled() { return new Promise((res) => { waiters.push(res); kick(); }); }

  function teardown() {
    token++;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    const w = waiters; waiters = []; w.forEach((f) => f());
    if (!cur) return;
    if (cur.plane) {
      cur.plane.geometry.dispose();
      cur.plane.children.forEach((o) => o.geometry.dispose());
      turnGroup.remove(cur.plane);
    }
    if (cur.texture) cur.texture.dispose();
    if (cur.model) turnGroup.remove(cur.model.holder);   /* geometry is the template's: kept */
    turnGroup.rotation.y = 0;
    stageEl.hidden = true;
    cur = null;
  }

  /* ---------- public ---------- */
  return {
    /* opts.source: 'glb' | 'test' | 'sheet'. opts.vertical: 'true' | 'paper'.
       Resolves once the first frame is on screen (the caller hides the HTML
       image then); `.settled` resolves when the swing has finished. */
    lift(card, opts) {
      teardown();
      const my = ++token;
      const sheetEl = card.querySelector('.ax-sheet');
      const imgEl = sheetEl && sheetEl.querySelector('img');
      if (!sheetEl || !imgEl) throw new Error('lift: card has no .ax-sheet img');
      applyColors();
      const state = {
        card, sheetEl, imgEl, model: null,
        vScale: opts.vertical === 'paper' ? D.PAPER_VERTICAL_SQUASH : 1,
        cam: tween(0), ax: tween(0), ay: tween(0), grow: tween(0), fade: tween(1), turn: tween(0),
      };
      cur = state;
      stageEl.hidden = false;
      measureCard(state);
      buildPlane(state);

      const t = nowS();
      const start = [state.img.x + state.img.w / 2, state.img.y + state.img.h / 2];
      state.ax = tween(start[0]); state.ay = tween(start[1]);
      const [a, b, h] = dims(state);
      const place = placement(state, a, b, h);
      state.cornerNode = place.cornerNode;
      const dur = reduceMotion ? 0 : T_CAMERA;
      retarget(state.cam, 1, dur, t);
      retarget(state.ax, place.anchor[0], dur, t);
      retarget(state.ay, place.anchor[1], dur, t);
      render();                                   /* first frame now, synchronously */

      let tplPromise = null;
      if (opts.source === 'test') tplPromise = getTestTemplate();
      else if (opts.source === 'glb' && card.dataset.model) tplPromise = loadTemplate(card.dataset.model);
      if (tplPromise) {
        tplPromise.then((tpl) => {
          if (my !== token || !tpl || cur !== state) return;
          attachModel(state, tpl);
        });
      }
      kick();
      const settledP = whenSettled();
      return { settled: settledP };
    },

    /* Lay the card back down. Resolves when it is flat again. */
    drop() {
      if (!cur) return Promise.resolve();
      const state = cur, my = token, t = nowS();
      const dur = reduceMotion ? 0 : T_DROP;
      const start = [state.img.x + state.img.w / 2, state.img.y + state.img.h / 2];
      const turnBack = Math.round(valueAt(state.turn, t) / (Math.PI * 2)) * Math.PI * 2;
      retarget(state.cam, 0, dur, t);
      retarget(state.ax, start[0], dur, t);
      retarget(state.ay, start[1], dur, t);
      retarget(state.grow, 0, dur * 0.7, t);
      retarget(state.fade, 1, dur * 0.6, t);
      retarget(state.turn, turnBack, dur, t);
      kick();
      return whenSettled().then(() => { if (my === token) teardown(); });
    },

    dropNow() { teardown(); },

    turn(dir) {
      if (!cur) return;
      const t = nowS();
      const target = cur.turn.to - dir * Math.PI / 2;
      retarget(cur.turn, target, reduceMotion ? 0 : T_TURN, t);
      kick();
    },

    /* Layout changed while lifted: re-measure and jump to the end state. */
    reflow() {
      if (!cur) return;
      const state = cur;
      measureCard(state);
      if (state.plane) {
        const g = new THREE.PlaneGeometry(state.planeW, state.planeH);
        g.rotateX(-Math.PI / 2);
        state.plane.geometry.dispose();
        state.plane.geometry = g;
        const line = state.plane.children[0];
        line.geometry.dispose();
        line.geometry = new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(g));
      }
      if (state.model) fitModel(state);
      const [a, b, h] = dims(state);
      const lifted = state.cam.to === 1;
      const target = lifted ? placement(state, a, b, h).anchor
        : [state.img.x + state.img.w / 2, state.img.y + state.img.h / 2];
      state.cam = tween(state.cam.to);
      state.ax = tween(target[0]); state.ay = tween(target[1]);
      kick();
    },

    recolor() { if (cur) { applyColors(); kick(); } },

    isLifted() { return !!cur; },

    /* Numbers for the verifier: project world axes through the live camera. */
    debug() {
      if (!cur) return null;
      const t = nowS();
      setCamera(cur, t);
      const R = cur.stage;
      const toDoc = (v) => {
        const q = v.clone().project(camera);
        return [R.x + (q.x + 1) / 2 * R.w, R.y + (1 - q.y) / 2 * R.h];
      };
      const o = toDoc(new THREE.Vector3(0, 0, 0));
      const ex = toDoc(new THREE.Vector3(1, 0, 0));
      const ez = toDoc(new THREE.Vector3(0, 0, 1));
      const ey = toDoc(new THREE.Vector3(0, 1, 0));
      const [a, b] = dims(cur);
      const rot = valueAt(cur.turn, t);
      const cornerW = new THREE.Vector3(-a / 2, 0, -b / 2).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      const corner = toDoc(cornerW);
      const cs = paper.stepsAt(corner[0], corner[1]);
      const p = cur.p;
      return {
        camProgress: valueAt(cur.cam, t),
        xSlope: (ex[1] - o[1]) / (ex[0] - o[0]),
        zSlope: (ez[1] - o[1]) / (ez[0] - o[0]),
        xAxisSteps: [(ex[0] - o[0]) / p, (ex[1] - o[1]) / p],
        zAxisSteps: [(ez[0] - o[0]) / p, (ez[1] - o[1]) / p],
        verticalStepsPerUnit: Math.hypot(ey[0] - o[0], ey[1] - o[1]) / p * cur.vScale,   /* as the model is drawn */
        cornerSteps: cs,
        cornerIsBold: D.isBold(Math.round(cs[0]), Math.round(cs[1])) &&
          Math.abs(cs[0] - Math.round(cs[0])) < 1e-3 && Math.abs(cs[1] - Math.round(cs[1])) < 1e-3,
        hasModel: !!cur.model,
        modelScale: cur.model ? cur.model.k : null,
        edgeAngle: cur.model ? cur.model.edgeAngle : null,
        footprintUnits: [a, b],
      };
    },
  };
}
