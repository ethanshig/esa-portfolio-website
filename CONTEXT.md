# esa Portfolio Tour

The portfolio at ethanshig.design is entered through a narrated tour rather than a project
grid. A reader travels between real places Ethan has worked, and the work is disclosed to
them as things encountered along the way. This glossary fixes the language that describes
that world.

## The world

**Place**:
One of the four real locations the tour visits, each with a region, a lure and its own
palette. Places are authored in `world.json`.
_Avoid_: setting (the data key, not the word we use), portal, location, destination

**Region**:
A Place considered as an area of the Map, holding the Scenes that belong to it.
_Avoid_: zone, cluster, area

**Scene**:
One narrated stop within a Place — the unit a reader arrives at, reads, and chooses from.
Scenes within a Place form a chain; the last scene of each chain offers travel to other Places.
_Avoid_: page, node (except when speaking of the Map), step, screen

**Record**:
An approved, compiled fact about Ethan's work. Records are the only things the narrator may
assert about a project; they are generated, never authored in the tour.
_Avoid_: fact (the data key), claim, detail, content

**Drawing**:
An image the reader was actually shown, carrying its label, project, date and alt text.
_Avoid_: image, media, asset, picture

**Interest**:
A theme the reader has signalled attention to by the choices they made.
_Avoid_: tag, topic, preference

## The map

**Map**:
The graphic view of the world: every Place projected from Champaign by true bearing and
distance, with its Scenes arranged around it. It is a navigation surface a reader travels
from, not a progress readout.
_Avoid_: overview, index, menu, minimap, dashboard, atlas

**Projection**:
The azimuthal equidistant transform that places the world on the Map. Distance from Home is
radius; direction from Home is angle. Both are true; shape is not.
_Avoid_: layout, geometry, coordinates, warp, distortion

**Home**:
Champaign, IL at 40.1164° N, 88.2434° W, considered as the Projection's centre — the point
every bearing and distance is measured from.
_Avoid_: origin, centre, base, Champaign (which also names a Place — see below)

**Ring**:
A contour of equal distance from Home, drawn on the Map at fixed intervals.
_Avoid_: orbit, circle, band, radius

**Fog**:
The concealment of *detail* on terrain that is already visible. The Map's Rings and Places are
legible from the first moment; what Fog hides is what happened at them.
_Avoid_: fog of war (ambiguous — names both this and the unexplored-black-map sense we rejected),
unexplored, locked, hidden

**Lifting**:
What a reader's travel does to Fog: arriving at a Scene discloses the Drawings sited there.
Lifting is per-Session and never persists to a return visit.
_Avoid_: unlocking, revealing, completing, discovering, progress

**Session**:
One reader's unbroken visit in one tab, holding the Scenes they visited, the Records and
Drawings they were shown, and the Interests they signalled. A new visit starts cold.
_Avoid_: save, profile, progress, history, run
