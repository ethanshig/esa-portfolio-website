/* ===================================================================
   INK — hidden-line drawing for any three.js object. PROTOTYPE
   (prototype/grid/axon). Shared by the index lift and the project page.

   Three marks, all in one ink colour over faces in the page colour:
     faces       page colour, pushed back by polygon offset so lines win
     creases     edges sharper than `edgeAngle`, as screen-width lines
     silhouettes an inverted hull: the back faces, pushed outward in
                 screen space by `outlineWidth` px along a smoothed normal,
                 drawn in ink behind everything. Where a form curves away
                 (a fillet, a cylinder) no crease fires, and this is what
                 draws its outline.

   The hull's push is in screen px, computed in the vertex shader from the
   view-space normal, so it stays the same width at any zoom, under the
   non-uniform scale the lift uses while a model grows, and in both
   orthographic and perspective cameras. Interior creases are untouched:
   the hull only shows where back faces peek past front ones.

   Usage:
     const materials = createInkMaterials();
     const { object, box } = makeInk(gltf.scene, { materials });
     materials.setColors(ink, paper);            // CSS colour strings
     materials.setLineWidth(1.2);                // creases, CSS px
     materials.setOutlineWidth(1.2);             // silhouettes, CSS px
     materials.setResolution(cssW, cssH);        // the canvas, CSS px
   =================================================================== */
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export const EDGE_ANGLE = 25;              /* deg: creases sharper than this are drawn */
export const EDGE_ANGLE_DENSE = 45;        /* fallback for very dense meshes */
export const DENSE_SEGMENTS = 150000;      /* above this many crease segments, use the fallback */
export const MAX_INSTANCES = 2000;         /* per InstancedMesh: creases are drawn per instance */

/* Silhouette width as a share of the dot step, clamped like the crease width. */
export function lineWidthForStep(stepPx) { return Math.min(1.6, Math.max(1, stepPx * 0.06)); }

const HULL_VERT = /* glsl */ `
attribute vec3 inkNormal;
uniform float uWidth;
uniform vec2 uResolution;
void main() {
  vec4 local = vec4(position, 1.0);
  vec3 n = inkNormal;
#ifdef USE_INSTANCING
  local = instanceMatrix * local;
  n = mat3(instanceMatrix) * n;            /* exact for rotation + uniform scale */
#endif
  vec4 clip = projectionMatrix * (modelViewMatrix * local);
  /* view-space normal, then its screen direction in CSS px */
  vec3 nv = normalMatrix * n;
  vec2 dir = vec2(projectionMatrix[0][0] * nv.x, projectionMatrix[1][1] * nv.y) * uResolution;
  float len = length(dir);
  /* a zero normal (open boundary) or one pointing straight at the camera: no push */
  if (len > 1e-6) clip.xy += dir / len * (2.0 * uWidth / uResolution) * clip.w;
  gl_Position = clip;
}`;

const HULL_FRAG = /* glsl */ `
uniform vec3 uColor;
void main() { gl_FragColor = vec4(uColor, 1.0); }`;

/* One set of materials can serve any number of inked objects. */
export function createInkMaterials({ lineWidth = 1.2, outlineWidth = lineWidth } = {}) {
  const face = new THREE.MeshBasicMaterial({
    color: 0xffffff, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const line = new LineMaterial({ color: 0x000000, linewidth: lineWidth, worldUnits: false });
  const thin = new THREE.LineBasicMaterial({ color: 0x000000 });
  const points = new THREE.PointsMaterial({ color: 0x000000, size: 2, sizeAttenuation: false });
  /* Behind the faces (more offset than they have), so where an open sheet
     shows its back, the page-coloured face wins and only the pushed rim shows. */
  const hull = new THREE.ShaderMaterial({
    vertexShader: HULL_VERT,
    fragmentShader: HULL_FRAG,
    uniforms: {
      uColor: { value: new THREE.Color(0x000000) },
      uWidth: { value: outlineWidth },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    side: THREE.BackSide,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 8,
  });

  return {
    face, line, thin, points, hull,
    setColors(ink, paper) {
      face.color.set(paper);
      line.color.set(ink);
      thin.color.set(ink);
      points.color.set(ink);
      hull.uniforms.uColor.value.set(ink);
    },
    setLineWidth(px) {
      if (!(px > 0)) throw new Error(`ink: line width must be positive, got ${px}`);
      line.linewidth = px;
    },
    setOutlineWidth(px) {
      if (!(px >= 0)) throw new Error(`ink: outline width must be >= 0, got ${px}`);
      hull.uniforms.uWidth.value = px;
      hull.visible = px > 0;
    },
    setResolution(w, h) {
      if (!(w > 0 && h > 0)) throw new Error(`ink: resolution must be positive, got ${w} x ${h}`);
      line.resolution.set(w, h);
      hull.uniforms.uResolution.value.set(w, h);
    },
    dispose() { for (const m of [face, line, thin, points, hull]) m.dispose(); },
  };
}

/* Smoothed outward normals for the hull, as attribute `inkNormal`.
   Vertices are merged by position (meshes split them at UV and normal seams,
   which would tear the hull open at every hard corner); each merged vertex
   takes the area-weighted sum of its faces' normals. Vertices on an open
   boundary get a zero normal so open sheets do not slide sideways. Faces
   wound inconsistently push inward there, which only hides the rim. */
export function computeInkNormals(geometry) {
  if (geometry.getAttribute('inkNormal')) return;
  const pos = geometry.getAttribute('position');
  if (!pos || pos.count === 0) throw new Error('ink: geometry has no positions');
  const index = geometry.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;

  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const diag = geometry.boundingBox.getSize(new THREE.Vector3()).length();
  const q = diag > 0 ? 1e5 / diag : 1;      /* merge tolerance: 1e-5 of the diagonal */
  const ids = new Map();
  const vid = new Int32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * q)},${Math.round(pos.getY(i) * q)},${Math.round(pos.getZ(i) * q)}`;
    let id = ids.get(k);
    if (id === undefined) { id = ids.size; ids.set(k, id); }
    vid[i] = id;
  }

  const acc = new Float64Array(ids.size * 3);
  const edgeUse = new Map();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3();
  const corner = (t, j) => (index ? index.getX(3 * t + j) : 3 * t + j);
  for (let t = 0; t < triCount; t++) {
    const i0 = corner(t, 0), i1 = corner(t, 1), i2 = corner(t, 2);
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    ab.subVectors(b, a); ac.subVectors(c, a); ab.cross(ac);   /* length = 2 x area */
    const m = [vid[i0], vid[i1], vid[i2]];
    for (let j = 0; j < 3; j++) {
      acc[3 * m[j]] += ab.x; acc[3 * m[j] + 1] += ab.y; acc[3 * m[j] + 2] += ab.z;
      const u = m[j], v = m[(j + 1) % 3];
      if (u === v) continue;                                   /* degenerate edge */
      const k = u < v ? u * ids.size + v : v * ids.size + u;
      edgeUse.set(k, (edgeUse.get(k) || 0) + 1);
    }
  }
  const boundary = new Uint8Array(ids.size);
  for (const [k, n] of edgeUse) {
    if (n !== 1) continue;
    boundary[Math.floor(k / ids.size)] = 1;
    boundary[k % ids.size] = 1;
  }

  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const m = vid[i];
    if (boundary[m]) continue;                                 /* stays zero */
    const x = acc[3 * m], y = acc[3 * m + 1], z = acc[3 * m + 2];
    const len = Math.hypot(x, y, z);
    if (len > 0) { out[3 * i] = x / len; out[3 * i + 1] = y / len; out[3 * i + 2] = z / len; }
  }
  geometry.setAttribute('inkNormal', new THREE.BufferAttribute(out, 3));
}

function disposeMaterial(m) {
  for (const mat of Array.isArray(m) ? m : [m]) {
    if (!mat) continue;
    for (const k of Object.keys(mat)) { const v = mat[k]; if (v && v.isTexture) v.dispose(); }
    mat.dispose();
  }
}

/* Turn any Object3D into hidden-line ink, in place. Returns the object, its
   bounding box in its own units and the crease angle used. Throws if there
   is nothing drawable. Skinned and morphing meshes are drawn in their rest
   pose: the hull and crease geometry are computed once. */
export function makeInk(object3d, {
  materials,
  edgeAngle = EDGE_ANGLE,
  denseEdgeAngle = EDGE_ANGLE_DENSE,
  denseSegments = DENSE_SEGMENTS,
  maxInstances = MAX_INSTANCES,
  outline = true,
} = {}) {
  if (!object3d || !object3d.isObject3D) throw new Error('ink: makeInk needs an Object3D');
  if (!materials) throw new Error('ink: makeInk needs materials from createInkMaterials()');

  object3d.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object3d);
  const size = box.getSize(new THREE.Vector3());
  if (box.isEmpty() || ![size.x, size.y, size.z].every(Number.isFinite)) {
    throw new Error('ink: object has no measurable geometry');
  }

  const meshes = [];
  const lines = [];
  object3d.traverse((o) => {
    if (o.isMesh) meshes.push(o);
    else if (o.isLine || o.isLineSegments || o.isPoints) lines.push(o);
  });
  if (!meshes.length && !lines.length) throw new Error('ink: object has no meshes or lines');

  /* crease density first, so a scanned mesh does not turn into a blot */
  const creases = (angle) => meshes.map((m) => new THREE.EdgesGeometry(m.geometry, angle));
  let angle = edgeAngle;
  let built = creases(angle);
  const total = meshes.reduce((s, m, i) =>
    s + (built[i].attributes.position.count / 2) * (m.isInstancedMesh ? Math.min(m.count, maxInstances) : 1), 0);
  if (total > denseSegments) {
    built.forEach((g) => g.dispose());
    angle = denseEdgeAngle;
    built = creases(angle);
  }

  meshes.forEach((mesh, i) => {
    disposeMaterial(mesh.material);
    mesh.material = materials.face;
    mesh.castShadow = mesh.receiveShadow = false;

    const lg = new LineSegmentsGeometry().fromEdgesGeometry(built[i]);
    built[i].dispose();
    if (mesh.isInstancedMesh) {
      /* LineSegments2 cannot instance: one line object per instance, capped. */
      const count = Math.min(mesh.count, maxInstances);
      const m4 = new THREE.Matrix4();
      for (let k = 0; k < count; k++) {
        mesh.getMatrixAt(k, m4);
        const line = new LineSegments2(lg, materials.line);
        line.matrixAutoUpdate = false;
        line.matrix.copy(m4);
        mesh.add(line);
      }
    } else {
      mesh.add(new LineSegments2(lg, materials.line));
    }

    if (outline) {
      computeInkNormals(mesh.geometry);
      let hull;
      if (mesh.isInstancedMesh) {
        hull = new THREE.InstancedMesh(mesh.geometry, materials.hull, mesh.count);
        hull.instanceMatrix = mesh.instanceMatrix;   /* shared: moves with the source */
      } else {
        hull = new THREE.Mesh(mesh.geometry, materials.hull);
      }
      hull.name = 'ink-hull';
      hull.raycast = () => {};                       /* never a pick target */
      hull.frustumCulled = mesh.frustumCulled;
      mesh.add(hull);
    }
  });
  lines.forEach((o) => { disposeMaterial(o.material); o.material = o.isPoints ? materials.points : materials.thin; });

  return { object: object3d, box, edgeAngle: angle, materials };
}
