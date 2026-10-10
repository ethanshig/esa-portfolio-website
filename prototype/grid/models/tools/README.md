# Model export (prototype)

Rhino 8 (via Rhino MCP) → raw mesh → glb. Rhino's own glTF export wrote empty files here, so geometry is dumped raw.

1. Open the .3dm, then in Rhino Python: `export_lib.build(doc, "<record-id>", target_faces, only_layers=..., skip_layers=..., region=...)` → `%TEMP%\esa-glb\<id>.mesh` (Z-up converted to Y-up, centred x/z, base y=0, feet).
2. `bun mesh2glb.ts <id>.mesh ../<id>.glb` packs position + index only.
3. Dense meshes: `bun cluster.ts in.mesh out.mesh <cell-ft>` (vertex clustering; Rhino's Mesh.Reduce did nothing on these).
4. `preview.mjs` renders `../_preview.html?m=<id>` in 2:1 dimetric hidden-line.

| record | source |
|---|---|
| three-little-pigs | FAA 330/Module 1/Wall Assembly.3dm, minus site layers (dirt, gravel, slab, sand...) |
| mylo-to-go | ArtD 326/Mycellium/Take-Out Box Model.3dm, Layer 03, one tray (region -2.4,-2.5 → -1.5,-1.7) |
| uss-lead-revival | Arch 273/M4/Combined.3dm, layer Sleepers Layer::Guardians |
| beavers-burden | Box/Arch 172 Assignment 5/Ethans Final Models.3dm, layer Flake |
| genealogy-of-a-beaver-dam | none — Beaver Dam.3dm is 960 stick block instances; reads as an ink blot. Sheet instead. |
| para-la-tierra | none (fieldwork) — sheet |

## Drawings registered to a model (three-little-pigs)

`Wall Assembly.3dm` holds five Make2D drawings of the same model (`Make2D - 2D` = end section; `Make2D`, `- Parallel`, `- Parallel 2`, `- Parallel 4` = cutaway axons). Each was exported as polylines per material layer (Rhino Python, `Curve.ToPolyline(0.005, 0.1, 0, 0)`), then fitted back onto the model: drawing2D ≈ A·rhino3D + t, least squares over matching layer bbox centres with iterative outlier trimming (numpy). Result in `../../project/data/three-little-pigs.drawings.json`.

| drawing | median residual | view |
|---|---|---|
| section | 0.006 ft | along +X (exact) |
| axon-1 | 0.13 ft | (0.89, −0.37, 0.26) |
| axon-2 | 0.16 ft | (0.73, −0.64, 0.24) |
| axon-3 | 0.08 ft | (0.76, −0.61, 0.22) |
| axon-4 | failed (non-orthographic fit) | unregistered — no mark |

Marks are only drawn where a fit exists (ADR-0007).
