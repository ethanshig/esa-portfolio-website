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
  const back = new THREE.Vector3(Math.cos(ELEVATION) * Math.sin(AZIMUTH), Math.sin(ELEVATION), Math.cos(ELEVATION) * Math.cos(AZIMUTH));
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), back).normalize();
  const up = new THREE.Vector3().crossVectors(back, right).normalize();

  for (const job of jobs) {
    try {
      const g = await loadGlb(loader, job.model);
      const { object, box } = makeInk(g.scene, { materials });
      const c = box.getCenter(new THREE.Vector3());
      object.position.sub(c);
      const scene = new THREE.Scene();
      scene.add(object);
      /* the box's half-extents seen along the dimetric axes */
      let rx = 0, ry = 0;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const p = new THREE.Vector3(x, y, z).sub(c);
        rx = Math.max(rx, Math.abs(p.dot(right))); ry = Math.max(ry, Math.abs(p.dot(up)));
      }
      const k = Math.min(job.w * (1 - 2 * MARGIN) / 2 / rx, job.h * (1 - 2 * MARGIN) / 2 / ry);
      const cam = new THREE.OrthographicCamera(-job.w / 2 / k, job.w / 2 / k, job.h / 2 / k, -job.h / 2 / k, -1e5, 1e5);
      cam.position.copy(back).multiplyScalar(1000);
      cam.up.set(0, 1, 0);
      cam.lookAt(0, 0, 0);
      cam.updateProjectionMatrix();
      renderer.setSize(job.w, job.h, false);
      const lw = Math.max(1.5, job.w / 320);
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
