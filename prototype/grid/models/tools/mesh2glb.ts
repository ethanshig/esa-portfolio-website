// mesh2glb <in.mesh> <out.glb> — raw (u32 nv, u32 nf, f32 xyz*nv, u32 abc*nf) → minimal glTF binary
const [inp, out] = process.argv.slice(2);
const buf = Buffer.from(await Bun.file(inp).arrayBuffer());
const nv = buf.readUInt32LE(0), nf = buf.readUInt32LE(4);
const pos = new Float32Array(buf.buffer.slice(buf.byteOffset + 8, buf.byteOffset + 8 + nv * 12));
const idx = new Uint32Array(buf.buffer.slice(buf.byteOffset + 8 + nv * 12, buf.byteOffset + 8 + nv * 12 + nf * 12));
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const v = pos[i * 3 + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v; }
const bin = Buffer.concat([Buffer.from(pos.buffer), Buffer.from(idx.buffer)]);
const json = {
  asset: { version: "2.0", generator: "esa mesh2glb" },
  scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  buffers: [{ byteLength: bin.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: pos.byteLength, target: 34962 },
    { buffer: 0, byteOffset: pos.byteLength, byteLength: idx.byteLength, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5126, count: nv, type: "VEC3", min, max },
    { bufferView: 1, componentType: 5125, count: nf * 3, type: "SCALAR" },
  ],
};
let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
const binP = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)]);
const head = Buffer.alloc(12); head.write("glTF", 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + binP.length, 8);
const ch = (len: number, type: number) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
await Bun.write(out, Buffer.concat([head, ch(js.length, 0x4e4f534a), js, ch(binP.length, 0x004e4942), binP]));
console.log(out, nv, "verts", nf, "tris", (12 + 16 + js.length + binP.length) / 1e6, "MB", "size", max.map((m, k) => +(m - min[k]).toFixed(2)));
