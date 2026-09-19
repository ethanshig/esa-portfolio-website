# Reuse the projection, not the map

An earlier, abandoned portfolio at `/mnt/c/Users/ethan/portfolio-website` (untracked, March
2026) contains a complete azimuthal-equidistant map centred on Champaign. We are lifting its
`PROJECTION` module — roughly 95 dependency-free lines of forward and inverse transform — into
this repo, and leaving the `ProjectionMap` class that surrounded it.

## Considered Options

Rebuilding the projection from scratch was rejected: the math is correct, reversible, and
already tuned, including a deliberate `-29°` rotation that throws Paraguay and Japan into
opposite corners. Adopting the old interface wholesale was also rejected, for three reasons
that are settled decisions here: it was the site's **landing page** (our Map is not the front
door — the tour opens cold), its clustered nodes cycle on **scroll wheel** (unreachable by
keyboard, and our Map must be the accessible surface, not a picture beside one), and it has
**no Fog** — it shows every project at once.

This also reverses an earlier decision in this same design session to draw an invented river
system instead of real geography. That decision rested on the claim that literal geography
strands Paraguay across an empty ocean; an azimuthal equidistant projection refutes it, by
making distance-from-home the radius so that emptiness becomes the Rings.

## Consequences

Geography is real **between** Regions and invented **within** one: Places project from
lat/long, while the Scenes belonging to a Place are arranged around its projected point at a
small fixed radius, because ten Scenes sit at only four coordinates and would otherwise stack.
`world.json` gains four coordinate pairs and nothing else — it stays story, not layout.

Two defects come across with the file and are fixed on the way in: the `-29` rotation constant
is duplicated as a literal in `drawGrid()`, and `resize()` fails to re-draw boundaries.
