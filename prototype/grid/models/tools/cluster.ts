// cluster <in.mesh> <out.mesh> <cell> — vertex-clustering decimation: snap to grid cell, merge, drop degenerate/duplicate tris
const [inp, out, c] = process.argv.slice(2); const cell = Number(c);
const buf = Buffer.from(await Bun.file(inp).arrayBuffer());
const nv = buf.readUInt32LE(0), nf = buf.readUInt32LE(4);
const pos = new Float32Array(buf.buffer.slice(buf.byteOffset + 8, buf.byteOffset + 8 + nv * 12));
const idx = new Uint32Array(buf.buffer.slice(buf.byteOffset + 8 + nv * 12, buf.byteOffset + 8 + nv * 12 + nf * 12));
const key = new Map<string, number>(), sum: number[] = [], cnt: number[] = [], remap = new Uint32Array(nv);
for (let i = 0; i < nv; i++) {
  const k = `${Math.floor(pos[i*3]/cell)},${Math.floor(pos[i*3+1]/cell)},${Math.floor(pos[i*3+2]/cell)}`;
  let id = key.get(k); if (id === undefined) { id = cnt.length; key.set(k, id); cnt.push(0); sum.push(0,0,0); }
  remap[i] = id; cnt[id]++; sum[id*3]+=pos[i*3]; sum[id*3+1]+=pos[i*3+1]; sum[id*3+2]+=pos[i*3+2];
}
const np = new Float32Array(cnt.length * 3); for (let i = 0; i < cnt.length; i++) for (let k = 0; k < 3; k++) np[i*3+k] = sum[i*3+k] / cnt[i];
const seen = new Set<string>(), tris: number[] = [];
for (let f = 0; f < nf; f++) { const a = remap[idx[f*3]], b = remap[idx[f*3+1]], d = remap[idx[f*3+2]];
  if (a === b || b === d || a === d) continue; const s = [a,b,d].sort((x,y)=>x-y).join(); if (seen.has(s)) continue; seen.add(s); tris.push(a,b,d); }
const ti = new Uint32Array(tris); const h = Buffer.alloc(8); h.writeUInt32LE(cnt.length, 0); h.writeUInt32LE(ti.length/3, 4);
await Bun.write(out, Buffer.concat([h, Buffer.from(np.buffer), Buffer.from(ti.buffer)]));
console.log(nf, "→", ti.length/3, "tris,", cnt.length, "verts");
