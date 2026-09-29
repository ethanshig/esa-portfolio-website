# esa Portfolio Tour

The portfolio at ethanshig.design is entered through a narrated tour rather than a project
grid. A reader travels between real places Ethan has worked, and the work is disclosed to
them as things encountered along the way. This glossary fixes the language that describes
that world.

## The world

**Place**:
One of the real locations the tour visits, each with a region and a lure. Places are authored
in `world.json`. A Place has no colour of its own — the site runs one ground everywhere — so
a Place is told apart by where it sits and what it holds, never by hue.
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
The graphic view of the work: a Territory generated from track membership, with each Record
sited in the Lands it belongs to. It is a navigation surface a reader travels from, not a
progress readout.
_Avoid_: overview, index, menu, minimap, dashboard, atlas

**Territory**:
The invented world the Map draws. Its geography is the track structure and nothing else — it
makes no geographic claim and is never hand-drawn, because it must redraw itself as Records
are added.
_Avoid_: world map, diagram, chart, graph, canvas

**Land**:
One track, drawn as an area of the Territory. A Land's extent is how many Records it holds,
so a track with one work looks like frontier, because it is.
_Avoid_: track (the data key, not the word we draw), category, zone, field, region

**Borderland**:
The part of the Territory where Lands overlap, where a Record belonging to more than one track
sits. Each of the six Records currently occupies a distinct Borderland.
_Avoid_: intersection, overlap, cluster, junction

**Route**:
The line a reader leaves behind them, joining the Records they reached in the order they
reached them. The Territory is given; the Route is theirs, and nothing on the Map is drawn
between Records until a reader walks it.
_Avoid_: path (fine in speech, but Route is the term), journey, trail, history, progress

**Fog**:
The concealment of *detail* on terrain that is already visible. The Lands and Borderlands are
legible from the first moment; what Fog hides is what happened at them.
_Avoid_: fog of war (ambiguous — names both this and the unexplored-black-map sense we rejected),
unexplored, locked, hidden

**Lifting**:
What a reader's travel does to Fog: reaching a Record discloses the Drawings sited there.
Lifting is per-Session and never persists to a return visit.
_Avoid_: unlocking, revealing, completing, discovering, progress

**Session**:
One reader's unbroken visit in one tab, holding the Records they reached, the Drawings they
were shown, and the Route they walked. A new visit starts cold.
_Avoid_: save, profile, progress, history, run

---

**A note on Place.** A Record is *not* called a Place on the Map. **Place** is reserved for the
four real locations the tour visits, which remain narrative content; the Territory has Lands,
Borderlands and Records, and a Record's Place is a fact it tells you when you reach it.
