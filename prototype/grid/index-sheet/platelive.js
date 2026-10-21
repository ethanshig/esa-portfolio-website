/* PROTOTYPE (#11, Ethan 2026-10-20: keep the lift). Throwaway.
   The hovered model Plate, live: one WebGL canvas over the sheet draws only that Plate's model, in
   hidden-line ink (../axon/ink.js), scissored to the Plate's screen rect, transparent so the paper's
   dots show round it; the still beneath is hidden while the live model holds the Plate (onHold).
   The view (platestill.js: plan -> dimetric) runs 0 -> 1 over 0.7 s on hover and back on leave; at 0
   it matches the still, and the canvas lets go. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createInkMaterials, makeInk } from '../axon/ink.js';
import { posed, fitScale, stillLineWidth, aim } from './platestill.js';

const T_LIFT = 0.7;          /* s */
const calm = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/');
loader.setDRACOLoader(draco);
loader.setMeshoptDecoder(MeshoptDecoder);
const ink = createInkMaterials();
const models = new Map();    /* id -> Promise<{ object, box } | null>, inked once */
function load(id) {
  if (!models.has(id)) {
    models.set(id, new Promise((res, rej) => loader.load(new URL(`../models/${id}.glb`, import.meta.url).href, (g) => {
      try { res(makeInk(g.scene, { materials: ink })); } catch (e) { rej(e); }
    }, undefined, rej)).catch((e) => { console.info(`[plates] ${id}: no live model (${e.message})`); return null; }));
  }
  return models.get(id);
}

/* stage: the sheet's stage; before: the element the canvas goes under (the titles and arrows) */
export function createPlateLive({ stage, before, sheet, reduceMotion, pxPerStep, onHold = () => {} }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);
  renderer.autoClear = false;            /* the Plate's opaque clear must survive render() */
  const cv = renderer.domElement;
  cv.className = 'ix-gl';
  stage.insertBefore(cv, before);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1e5, 1e5);

  let cur = null;            /* { plate, pose } : the live Plate */
  let want = null, token = 0;
  let lift = { from: 0, to: 0, t0: 0 };
  let drawn = false;
  let held = null;           /* the Plate whose still is hidden */
  const hold = (p) => { if (held === p) return; if (held) onHold(held, false); held = p; if (held) onHold(held, true); };
  const css = (n, f) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
  const now = () => performance.now() / 1000;
  const value = (t) => (reduceMotion ? lift.to : lift.from + (lift.to - lift.from) * calm((t - lift.t0) / T_LIFT));

  function size() { renderer.setSize(window.innerWidth, window.innerHeight, false); cv.style.width = '100%'; cv.style.height = '100%'; drawn = true; }
  size();
  window.addEventListener('resize', size);

  async function take(plate) {
    const my = ++token;
    const t = await load(plate.model);
    if (!t || my !== token || want !== plate) return;
    if (cur) scene.remove(cur.pose.pivot);
    const pose = posed(t.object.clone(true), t.box);
    scene.add(pose.pivot);
    cur = { plate, pose };
  }

  /* plate: a model Plate under the pointer, or null */
  function hover(plate) {
    const p = plate && plate.model ? plate : null;
    if (p === want) return;
    const t = now();
    if (p && cur && cur.plate !== p) { lift = { from: 0, to: 0, t0: t }; }   /* a new Plate starts from rest */
    want = p;
    if (p) { lift = { from: cur && cur.plate === p ? value(t) : 0, to: 1, t0: t }; if (!cur || cur.plate !== p) take(p); }
    else lift = { from: value(t), to: 0, t0: t };
  }

  /* per frame, from the plates' draw loop; true while it still needs frames */
  function frame() {
    const t = now();
    const u = value(t);
    const W = window.innerWidth, H = window.innerHeight;
    if (!cur || (u <= 1e-4 && lift.to === 0)) {
      if (drawn) { renderer.setScissor(0, 0, W, H); renderer.setViewport(0, 0, W, H); renderer.clear(); drawn = false; }
      hold(null);
      return false;
    }
    const p = cur.plate;
    const [x0, y0] = sheet.toScreen(p.rect.u0, p.rect.v0), [x1, y1] = sheet.toScreen(p.rect.u1, p.rect.v1);
    const w = x1 - x0, h = y1 - y0;
    renderer.setScissor(0, 0, W, H); renderer.setViewport(0, 0, W, H); renderer.clear();
    ink.setColors(css('--color-primary', '#e9ecee'), css('--color-bg', '#0e1013'));
    /* the still's line weight, carried to the screen at the sheet's scale */
    const lw = stillLineWidth(p.wSteps * pxPerStep) * (w / (p.wSteps * pxPerStep));
    ink.setLineWidth(Math.max(1, lw)); ink.setOutlineWidth(Math.max(1, lw)); ink.setResolution(w, h);
    const k = fitScale(cur.pose.extents, w, h);
    camera.left = -w / 2 / k; camera.right = w / 2 / k; camera.top = h / 2 / k; camera.bottom = -h / 2 / k;
    camera.updateProjectionMatrix();
    aim(camera, cur.pose.view(u));
    /* gl's origin is bottom-left */
    const gy = H - y1;
    renderer.setScissor(x0, gy, w, h); renderer.setViewport(x0, gy, w, h);
    renderer.render(scene, camera);
    drawn = true;
    hold(p);
    return t - lift.t0 < T_LIFT;
  }

  return { hover, frame, state: () => ({ live: cur ? cur.plate.id : null, u: value(now()) }) };
}
