/* PROTOTYPE (index map #8, variants e/f). Throwaway.
   A model Plate is a still: each model is loaded once, inked (../axon/ink.js), drawn once at
   2:1 dimetric (azimuth 45, elevation asin 1/2, as ../axon/dimetric.js) into an offscreen
   canvas the size of its Plate, and handed back as a PNG data URL. No live WebGL per Plate:
   the renderer is disposed when the stills are done. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createInkMaterials, makeInk } from '../axon/ink.js';
import { ELEVATION, AZIMUTH } from '../axon/dimetric.js';

const MARGIN = 0.12;          /* share of the Plate left as paper round the model */

/* PROTOTYPE (#11, Ethan 2026-10-20: keep the lift). How a model Plate moves on hover, ?lift=grow|turn:
   grow  at rest the model lies collapsed on the paper, its footprint drawn in dimetric; hovered it
         grows up to full height in place (no camera move).
   turn  at rest the full model; hovered it turns 90 degrees about its vertical axis.
   The still is the pose at u = 0, and one scale fits every pose, so the live model takes over from
   the still without a jump. */
export const LIFT_MODES = ['grow', 'turn'];
export const liftMode = () => { const m = new URLSearchParams(location.search).get('lift'); return LIFT_MODES.includes(m) ? m : 'grow'; };
const FLAT = 0.02;            /* grow: the collapsed height, as a share of the full one */
export const VIEW = (() => {
  const back = new THREE.Vector3(Math.cos(ELEVATION) * Math.sin(AZIMUTH), Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.cos(AZIMUTH));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), back).normalize();
  const up = new THREE.Vector3().crossVectors(back, right).normalize();
  return { back, right, up };
})();
/* the model in a pivot group: base on the pivot (grow scales from the ground), centred on x and z
   (turn spins in place), the full model's centre at the origin. set(u) poses it, u in 0..1. */
export function posed(object, box, mode) {
  const c = box.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  pivot.position.set(0, box.min.y - c.y, 0);
  object.position.set(-c.x, -box.min.y, -c.z);
  pivot.add(object);
  const corners = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x - c.x, y - c.y, z - c.z));
  /* half-extents on screen over every pose: the box, and for turn every angle on the way round */
  let rx = 0, ry = 0;
  const angles = mode === 'turn' ? [0, 1, 2, 3, 4, 5, 6].map((i) => (i / 6) * Math.PI / 2) : [0];
  for (const a of angles) for (const p of corners) {
    const q = p.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    rx = Math.max(rx, Math.abs(q.dot(VIEW.right))); ry = Math.max(ry, Math.abs(q.dot(VIEW.up)));
  }
  const set = (u) => {
    if (mode === 'grow') pivot.scale.y = FLAT + (1 - FLAT) * u;
    else pivot.rotation.y = u * Math.PI / 2;
  };
  set(0);
  return { pivot, set, extents: [rx, ry] };
}
/* the scale (px per model unit) that fits a w x h px Plate with its margin */
export const fitScale = (extents, w, h) => Math.min(w * (1 - 2 * MARGIN) / 2 / extents[0], h * (1 - 2 * MARGIN) / 2 / extents[1]);
/* the still's line width at its own resolution, so the live model can draw the same weight on screen */
export const stillLineWidth = (wPx) => Math.max(1.5, wPx / 320);

function loadGlb(loader, id) {
  return new Promise((res, rej) => loader.load(new URL(`../models/${id}.glb`, import.meta.url).href, res, undefined, rej));
}

/* jobs: [{ model, w, h }] in px. Resolves to Map(model -> data URL); a model that fails is left out. */
export async function renderStills(jobs, { ink, paper, plate }) {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/');
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);

  const out = new Map();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  } catch (e) {
    console.info(`[plates] no WebGL for model stills (${e.message})`);
    return out;
  }
  renderer.setPixelRatio(1);
  renderer.setClearColor(new THREE.Color(plate), 1);
  const materials = createInkMaterials();
  materials.setColors(ink, plate);
  const mode = liftMode();
  for (const job of jobs) {
    try {
      const g = await loadGlb(loader, job.model);
      const { object, box } = makeInk(g.scene, { materials });
      const pose = posed(object, box, mode);
      const scene = new THREE.Scene();
      scene.add(pose.pivot);
      const k = fitScale(pose.extents, job.w, job.h);
      const cam = new THREE.OrthographicCamera(-job.w / 2 / k, job.w / 2 / k, job.h / 2 / k, -job.h / 2 / k, -1e5, 1e5);
      cam.position.copy(VIEW.back).multiplyScalar(1000);
      cam.up.set(0, 1, 0);
      cam.lookAt(0, 0, 0);
      cam.updateProjectionMatrix();
      renderer.setSize(job.w, job.h, false);
      const lw = stillLineWidth(job.w);
      materials.setLineWidth(lw); materials.setOutlineWidth(lw); materials.setResolution(job.w, job.h);
      renderer.render(scene, cam);
      out.set(job.model, renderer.domElement.toDataURL('image/png'));
    } catch (e) {
      console.info(`[plates] ${job.model}: no still (${e.message})`);
    }
  }
  renderer.dispose();
  renderer.forceContextLoss();
  draco.dispose();
  return out;
}
