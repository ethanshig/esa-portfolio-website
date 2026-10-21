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

/* PROTOTYPE (#11, Ethan 2026-10-20: keep the lift). A model Plate is read in plan at rest: the whole
   model seen straight down, its axes square to the page's grid, so it is a 2D drawing on the dots.
   Hovered, only the view turns, to 2:1 dimetric (azimuth 0 -> 45, elevation 90 -> 30), and it reads
   as an axon. The model never changes shape (Ethan: no growing, no stretching in z). The still is the
   plan, and one scale fits every view on the way, so the live model takes over without a jump. Model
   Plates have no ground of their own: the model sits on the paper. */
const PLAN_EL = Math.PI / 2;
/* the view from elevation el, azimuth az: back (toward the camera), up and right on screen */
function viewAt(el, az) {
  const back = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  const up = new THREE.Vector3(-Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az));
  const right = new THREE.Vector3().crossVectors(up, back).normalize();
  return { back, up, right };
}
/* the model centred at the origin. view(u), u in 0..1 from plan to dimetric, is the view to draw it from */
export function posed(object, box) {
  const c = box.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  object.position.sub(c);
  pivot.add(object);
  const corners = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x - c.x, y - c.y, z - c.z));
  const view = (u) => viewAt(PLAN_EL + (ELEVATION - PLAN_EL) * u, AZIMUTH * u);
  /* half-extents on screen over every view on the way */
  let rx = 0, ry = 0;
  for (let i = 0; i <= 12; i++) {
    const v = view(i / 12);
    for (const p of corners) { rx = Math.max(rx, Math.abs(p.dot(v.right))); ry = Math.max(ry, Math.abs(p.dot(v.up))); }
  }
  return { pivot, view, extents: [rx, ry] };
}
/* point an orthographic camera along a view */
export function aim(cam, view) {
  cam.position.copy(view.back).multiplyScalar(1000);
  cam.up.copy(view.up);
  cam.lookAt(0, 0, 0);
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
  renderer.setClearColor(0x000000, 0);            /* transparent: the model sits on the paper */
  const materials = createInkMaterials();
  materials.setColors(ink, plate);
  for (const job of jobs) {
    try {
      const g = await loadGlb(loader, job.model);
      const { object, box } = makeInk(g.scene, { materials });
      const pose = posed(object, box);
      const scene = new THREE.Scene();
      scene.add(pose.pivot);
      const k = fitScale(pose.extents, job.w, job.h);
      const cam = new THREE.OrthographicCamera(-job.w / 2 / k, job.w / 2 / k, job.h / 2 / k, -job.h / 2 / k, -1e5, 1e5);
      aim(cam, pose.view(0));
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
