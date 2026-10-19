/* PROTOTYPE (index map #8, variant D "Pair"). Throwaway.
   The live model in the current pair's half: one WebGL canvas over the sheet, drawing one model
   in hidden-line ink (../axon/ink.js) into a screen rect the sheet hands over every frame.
   At rest the model lies as its plan (seen straight down, KGDVS's plan half); on hover it lifts
   to 2:1 dimetric (azimuth 45, elevation 30) over 0.7 s. One scale holds for both poses, so the
   lift never zooms. Only the current pair's model is live; the others are not drawn. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createInkMaterials, makeInk, lineWidthForStep } from '../axon/ink.js';

const EL_PLAN = Math.PI / 2 - 1e-3, EL_DIM = Math.asin(0.5), AZ = Math.PI / 4;
const T_LIFT = 0.7;
const calm = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/');
loader.setDRACOLoader(draco);
loader.setMeshoptDecoder(MeshoptDecoder);
const ink = createInkMaterials();
const templates = new Map();
function load(id) {
  if (!templates.has(id)) {
    templates.set(id, new Promise((res, rej) => loader.load(new URL(`../models/${id}.glb`, import.meta.url).href, (g) => {
      try { const { object, box } = makeInk(g.scene, { materials: ink }); res({ object, box }); } catch (e) { rej(e); }
    }, undefined, rej)).catch((e) => { console.info(`[pair] ${id}: no model (${e.message})`); templates.delete(id); return null; }));
  }
  return templates.get(id);
}

function dirOf(el) { return new THREE.Vector3(Math.cos(el) * Math.sin(AZ), Math.sin(el), Math.cos(el) * Math.cos(AZ)); }

export function createPairModel(stage, before) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);
  const cv = renderer.domElement;
  cv.className = 'ix-gl';
  stage.insertBefore(cv, before);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e5, 1e5);
  let cur = null;            /* { id, group, radiusFor(el) } */
  let want = null, token = 0;
  let lift = { from: 0, to: 0, t0: 0 };
  let lastKey = '';

  const css = (n, f) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
  function size() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    cv.style.width = '100%'; cv.style.height = '100%';
    lastKey = '';
  }
  size();
  window.addEventListener('resize', size);

  /* half-extents of the model's box seen from elevation el, in model units */
  function extents(box, el) {
    const d = dirOf(el), up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, d).normalize();
    const top = new THREE.Vector3().crossVectors(d, right).normalize();
    const c = box.getCenter(new THREE.Vector3());
    let rx = 0, ry = 0;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const p = new THREE.Vector3(x, y, z).sub(c);
      rx = Math.max(rx, Math.abs(p.dot(right))); ry = Math.max(ry, Math.abs(p.dot(top)));
    }
    return [rx, ry];
  }

  async function show(id) {
    if (want === id) return;
    want = id; const my = ++token;
    if (cur) { scene.remove(cur.group); cur = null; }
    lift = { from: 0, to: 0, t0: 0 };
    lastKey = '';
    if (!id) return;
    const t = await load(id);
    if (!t || my !== token) return;
    const group = new THREE.Group();
    const obj = t.object.clone(true);
    const c = t.box.getCenter(new THREE.Vector3());
    obj.position.sub(c);
    group.add(obj);
    scene.add(group);
    cur = { id, group, plan: extents(t.box, EL_PLAN), dim: extents(t.box, EL_DIM) };
    lastKey = '';
  }

  function setLift(on) {
    const now = performance.now() / 1000;
    const v = valueNow(now);
    if ((on ? 1 : 0) === lift.to) return;
    lift = { from: v, to: on ? 1 : 0, t0: now };
  }
  function valueNow(now) { return lift.from + (lift.to - lift.from) * calm((now - lift.t0) / T_LIFT); }
  const moving = (now) => now - lift.t0 < T_LIFT;

  /* rect: css px { x, y, w, h } of the model's box on screen, or null when no pair is current */
  function frame(rect, stepPx) {
    const now = performance.now() / 1000;
    const u = valueNow(now);
    const key = rect && cur ? `${cur.id}|${rect.x.toFixed(1)}|${rect.y.toFixed(1)}|${rect.w.toFixed(1)}|${u.toFixed(4)}` : 'none';
    if (key === lastKey && !moving(now)) return false;
    lastKey = key;
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setScissor(0, 0, W, H); renderer.setViewport(0, 0, W, H); renderer.clear();
    if (!rect || !cur || rect.x > W || rect.x + rect.w < 0 || rect.y > H || rect.y + rect.h < 0) return moving(now);
    ink.setColors(css('--color-primary', '#e9ecee'), css('--color-bg', '#0e1013'));
    const lw = lineWidthForStep(stepPx);
    ink.setLineWidth(lw); ink.setOutlineWidth(lw); ink.setResolution(rect.w, rect.h);
    /* one scale for both poses: the larger of the two silhouettes fits the rect */
    const k = Math.min(rect.w / 2 / Math.max(cur.plan[0], cur.dim[0]), rect.h / 2 / Math.max(cur.plan[1], cur.dim[1]));
    const el = EL_PLAN + (EL_DIM - EL_PLAN) * u;
    const d = dirOf(el);
    camera.position.copy(d.multiplyScalar(1000));
    camera.up.set(0, 1, 0);
    if (el > 1.5) camera.up.set(-Math.sin(AZ), 0, -Math.cos(AZ));   /* straight down: keep the dimetric's heading */
    camera.lookAt(0, 0, 0);
    camera.left = -rect.w / 2 / k; camera.right = rect.w / 2 / k; camera.top = rect.h / 2 / k; camera.bottom = -rect.h / 2 / k;
    camera.updateProjectionMatrix();
    const y = H - rect.y - rect.h;
    renderer.setViewport(rect.x, y, rect.w, rect.h); renderer.setScissor(rect.x, y, rect.w, rect.h);
    renderer.render(scene, camera);
    return moving(now);
  }

  return { show, setLift, frame, get current() { return cur && cur.id; } };
}
