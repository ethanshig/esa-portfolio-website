
import Rhino, System, os, json
_cache = {}
def _mesh_of(g, mp):
    if isinstance(g, Rhino.Geometry.Mesh): return [g.DuplicateMesh()]
    if isinstance(g, Rhino.Geometry.Extrusion): g = g.ToBrep()
    if isinstance(g, Rhino.Geometry.Brep):
        ms = Rhino.Geometry.Mesh.CreateFromBrep(g, mp); return list(ms) if ms else []
    if isinstance(g, Rhino.Geometry.SubD):
        m = Rhino.Geometry.Mesh.CreateFromSubD(g, 1); return [m] if m else []
    return []
def expand(doc, idef, xf, mp, depth=0):
    out = []
    if idef is None or depth > 4: return out
    key = idef.Index
    if key not in _cache:
        parts = []
        for ob in idef.GetObjects():
            gg = ob.Geometry
            if isinstance(gg, Rhino.Geometry.InstanceReferenceGeometry):
                parts.append(("ref", ob.InstanceDefinition, ob.InstanceXform))
            else:
                one = Rhino.Geometry.Mesh()
                for m in _mesh_of(gg, mp): one.Append(m)
                if one.Faces.Count: parts.append(("mesh", one, None))
        _cache[key] = parts
    for kind, a, b in _cache[key]:
        if kind == "mesh":
            m = a.DuplicateMesh(); m.Transform(xf); out.append(m)
        else:
            out.extend(expand(doc, a, xf * b, mp, depth + 1))
    return out

def build(doc, name, target_faces=40000, skip_layers=("Make2D",), only_layers=None, region=None, coarse=False):
    mp = Rhino.Geometry.MeshingParameters.Minimal if coarse else Rhino.Geometry.MeshingParameters.FastRenderMesh
    _cache.clear()
    meshes = []
    es = Rhino.DocObjects.ObjectEnumeratorSettings(); es.DeletedObjects = False; es.HiddenObjects = False
    for o in doc.Objects.GetObjectList(es):
        if o.IsDeleted or not o.Visible: continue
        lp = doc.Layers[o.Attributes.LayerIndex].FullPath
        if any(s in lp for s in skip_layers): continue
        if only_layers and not any(lp.startswith(s) for s in only_layers): continue
        g = o.Geometry
        if region:
            b = g.GetBoundingBox(True)
            if not (b.Min.X >= region[0] and b.Min.Y >= region[1] and b.Max.X <= region[2] and b.Max.Y <= region[3]): continue
        if isinstance(g, Rhino.Geometry.InstanceReferenceGeometry):
            meshes.extend(expand(doc, o.InstanceDefinition, o.InstanceXform, mp))
            continue
        if isinstance(g, Rhino.Geometry.Mesh):
            meshes.append(g.DuplicateMesh())
        elif isinstance(g, Rhino.Geometry.Extrusion):
            b = g.ToBrep()
            ms = Rhino.Geometry.Mesh.CreateFromBrep(b, mp)
            if ms: meshes.extend(ms)
        elif isinstance(g, Rhino.Geometry.Brep):
            ms = Rhino.Geometry.Mesh.CreateFromBrep(g, mp)
            if ms: meshes.extend(ms)
        elif isinstance(g, Rhino.Geometry.SubD):
            m = Rhino.Geometry.Mesh.CreateFromSubD(g, 1)
            if m: meshes.append(m)
    total = sum(mm.Faces.Count for mm in meshes)
    if total > target_faces * 1.5:
        ratio = float(target_faces) / total
        for mm in meshes:
            mm.Faces.ConvertQuadsToTriangles()
            t = max(4, int(mm.Faces.Count * ratio))
            if mm.Faces.Count > t: mm.Reduce(t, False, 10, False)
    big = Rhino.Geometry.Mesh()
    for m in meshes: big.Append(m)
    before = big.Faces.Count
    big.Faces.ConvertQuadsToTriangles()
    if big.Faces.Count > target_faces:
        big.Reduce(target_faces, False, 10, False)
    big.Normals.ComputeNormals(); big.Compact()
    bb = big.GetBoundingBox(True)
    # move to origin: centre x,y, base on z=0
    big.Translate(-(bb.Min.X+bb.Max.X)/2, -(bb.Min.Y+bb.Max.Y)/2, -bb.Min.Z)
    import struct
    big.Vertices.CombineIdentical(True, True); big.Faces.CullDegenerateFaces(); big.Compact()
    path = os.path.join(r"C:\Users\ethan\AppData\Local\Temp\esa-glb", name + ".mesh")
    with open(path, "wb") as f:
        f.write(struct.pack("<II", big.Vertices.Count, big.Faces.Count))
        for i in range(big.Vertices.Count):
            v = big.Vertices[i]; f.write(struct.pack("<fff", v.X, v.Z, -v.Y))
        for i in range(big.Faces.Count):
            fc = big.Faces[i]; f.write(struct.pack("<III", fc.A, fc.B, fc.C))
    ok = True
    sz = os.path.getsize(path) if os.path.exists(path) else -1
    return json.dumps({"name":name,"parts":len(meshes),"facesBefore":before,"facesAfter":big.Faces.Count,"size":[bb.Max.X-bb.Min.X,bb.Max.Y-bb.Min.Y,bb.Max.Z-bb.Min.Z],"units":str(doc.ModelUnitSystem),"ok":ok,"bytes":sz})
