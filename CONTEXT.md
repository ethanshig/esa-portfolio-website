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

## The world

**World**:
The walkable territory the portfolio is explored through: a tiled, black-and-white place generated
from track membership, which a reader crosses on foot. Nothing in it is shown all at once.
_Avoid_: map (what this replaced), overview, index, menu, minimap, dashboard, game

**Sprite**:
The figure a reader moves through the World. It is the scale reference — it never changes size, so
the World changes size around it, which is how an item and a landscape share one place.
_Avoid_: avatar, character, player, cursor, you

**Biome**:
How one Land looks on the ground — its ground, growth and water. A Biome is *authored* once per
track, by hand; the terrain laid down from it is generated and never placed.
_Avoid_: theme, style, texture, tileset, palette

**Land**:
One track, as an area of the World. A Land's extent is how many Records it holds, so a track with
one work reads as frontier, because it is.
_Avoid_: track (the data key, not the word we walk), category, zone, field, region

**Borderland**:
The transitional ground where two Biomes blend.
_Avoid_: intersection, overlap, edge, seam

**Bridge**:
A Record belonging to more than one track, standing in the Borderland between them and serving as
the only crossing between those Lands. To reach one Land from another a reader walks through the
work that touches both.
_Avoid_: link, connection, path, gateway

**Frontier**:
The generated edge of the World. Pushing it makes more of the Biome a reader is in, curving back
toward work they have not reached. It never makes Records: the World is unbounded, the work is not.
_Avoid_: border, wall, boundary, infinity

**Route**:
The line a reader leaves behind them, joining the Records they reached in the order they reached
them. The World is given; the Route is theirs.
_Avoid_: path (Bridge and Frontier use that word), journey, trail, history, progress

**Fog**:
Ground a reader has not walked to, which is simply not there yet. Fog is never a dimming — ground
is walked or it is not, and nothing is greyed to show what was missed.
_Avoid_: fog of war (ambiguous), locked, greyed out, undiscovered

**Lifting**:
What walking does to Fog. Lifting is per-Session and never persists to a return visit.
_Avoid_: unlocking, revealing, completing, discovering, progress

**Session**:
One reader's unbroken visit in one tab, holding the ground they walked, the Records they reached and
the Drawings they were shown. A new visit starts cold — in the same World, which is seeded and
identical for every reader.
_Avoid_: save, profile, progress, history, run

---

**A note on Place.** A Record is not called a Place in the World. **Place** stays reserved for the
four real locations the tour visits; the World has Lands, Borderlands, Bridges and Records, and a
Record's Place is a fact it tells a reader when they reach it.
