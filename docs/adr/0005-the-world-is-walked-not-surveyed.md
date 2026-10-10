---
status: superseded by ADR-0006
---

# The World is walked, not surveyed

The Map became a World: a reader is given a Sprite and walks it through a tiled, black-and-white
territory whose Lands are the tracks. Nothing is shown all at once. This supersedes ADR-0001 and
amends ADR-0004.

## Why

Every earlier attempt — projected geography, Euler fields, coastlines, contours, stipple — put the
whole portfolio on one screen and asked a reader to read it. Ethan's objection was that this is a
diagram, not an exploration, and that the thing he liked about the spokes drawing was that work
*clustered* around shared concepts with multi-track work **bridging** between them. A survey cannot
deliver that; a walk can.

## What follows

**Fog is now the unexplored sense.** Ground does not exist until a reader walks to it. The no-dimming
rule from ADR-0001 survives: ground is walked or it is not, and nothing is greyed to show what was
missed.

**Unbounded terrain, finite content.** Pushing the frontier generates more of the Biome a reader is
in, biased to curve them back toward work they have not reached. It never generates *content*:
inventing the appearance of more projects than exist is the one lie this cannot afford. No walls,
no dead ends, no promise of a seventh project.

**A Record appears as what it is, at true scale** (Ethan's ruling). An item he designed is an item in
the world; a building is a building; a landscape is a landscape. The scale ladder works only because
the Sprite is the constant and two scales never share a frame: Mylo To-Go is a takeout container and
USS Lead is a Superfund site, three to four orders of magnitude apart. Floor is hand-size; ceiling is
three screens to cross. USS Lead is therefore not a building to enter — it is terrain a reader is
already standing in.

**Bridges are literal and exclusive.** A multi-track Record sits in the transitional ground between
two Biomes and is the only crossing between them. The data makes this sharp rather than decorative:
`computational` and `accessibility` hold one Record between them — the same one — so USS Lead is
literally the only way into either. A reader discovers the shape of the portfolio by walking it.

**Seeded and stable.** The same world for every visitor on every visit. A reshuffling world buys
surprise for a site most people see once, and spends the ability to say "the thing past the marsh",
to screenshot it for an application, and to debug it.

**The World absorbs the tour rather than replacing it.** Reaching a Record starts its scene in place:
narration as one line at the foot of the screen (the surface settled on `narration-surface`), Drawings
in the world around the reader, choices as directions to walk. Nothing overlays, nothing opens. The
cold open survives as the spawn point — a reader arrives already standing somewhere.

**Motion that the reader causes is not the motion accessibility guards against.** Grass waves and water
flows; under `prefers-reduced-motion` the ambient world freezes but the Sprite keeps walking, because
freezing it would break navigation rather than protect anyone.

**The walk is the accessible surface, not a picture beside one.** Arrow keys move the Sprite and a
polite live region announces position and what is near. Spatial description is nearer Ethan's own BLV
research than a list of buttons; the transcript remains the text record, not an apology for the World.

## Consequences

Canvas 2D, not SVG: a tiled world with a sprite and ambient motion cannot be thousands of DOM nodes.
`sessionStorage` and the cold start hold (ADR-0003, Q45) — with a seeded world, starting cold is not
waking somewhere unfamiliar, and what persistence would preserve is a completion record this
deliberately does not keep.

## Superseded

Shelved 2026-10-05, not refuted. Ethan chose a different shape: a site that reads as a
conventional portfolio at first glance, with the storytelling arriving only once a reader clicks
into a project. The World is complete and working on branch `prototype/fog-map`
(worktree `~/cs199/portfolio-fogmap`) if it is ever resumed.

What carried forward into ADR-0006: narration held on one line at the foot of the page, the
reader's own route as the only path structure, and the refusal to let a reader's progress be
shown back to them as a score.
