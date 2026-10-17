---
status: proposed (prototype on branch prototype/grid; grid, seat, datum, palette and controls settled 2026-10-17 — variants kept at tag prototype/grid-variants-r7)
---

# The project page is the drawing sheet

A project page stops being a scrolling Document. The viewport is the AxoNotebook paper — one dot
set read as a cartesian grid and, through every fourth dot, as a 2:1 dimetric lattice — and the
project's drawings and model are laid out on it as one sheet. The only thing that scrolls is the
story panel at the foot. This supersedes ADR-0006's page shape; its story layer, opt-out and scraper
contract survive.

## Why

Ethan's final product is a drawing made from a model, and the conventional page could only show
that drawing as a picture of itself. On the sheet the drawing lies flat where it belongs and the
model stands beside it, so a reader sees both what was made and what it was made from.

## Decisions

**If it is 3D it renders 3D; if it is 2D it renders 2D.** A Record with a model gets a sheet with
the model standing in dimetric beside flat drawings. A Record without one gets a flat sheet: pan
and zoom, no orbit, no tilt. Nothing is extruded, faked or sheet-lifted into a third dimension it
never had. The index follows the same rule: hovering a 3D project lifts its model; hovering a 2D
project turns to its next Drawing.

**The hero drawing leads.** Arrival frames the hero drawing lying flat, model in view beside it.
The model is the evidence, not the product.

**Drawings are tied to the model by convention, not invention.** A section gets a cut-plane mark
on the model with a lettered bubble; an elevation or axon gets a view arrow; the drawing carries
the matching title. Hovering either highlights the other. Marks are only placed where a drawing's
view can be *measured* against the model — Make2D output fitted back onto the geometry — never
where it would have to be guessed. A drawing that will not fit gets no mark.

**Rhino's controls, exactly.** Right-drag orbits freely in full 3D, shift+right-drag pans, wheel or
ctrl+right-drag zooms, middle-drag pans; left is for picking, and a left-drag never moves the view
(in Rhino it draws a selection window). No web or trackpad remaps. While a reader orbits away from
the superimposed view, the flat drawings ghost. Off home, a click on the model keeps the 3D view;
a click anywhere else — empty sheet or a ghosted drawing — snaps back to the superimposed
axon/cartesian view. There is no home icon; the button survives for the keyboard only (shown on
focus), with Escape. Touch gets one-finger pan, two-finger orbit, pinch zoom.

**The paper supports; it never competes.** The axon dots are told from the cartesian ones by a
small step in size and ink (1.3× the radius, about half the ink), not by the notebook's bold dot.
The dots are a quiet star field on the black ground: one dot in two carries a faint tint of the
nebula set (violet, blue, rose, pale gold, a rare ember, each mixed halfway to white), and about
one in five breathes on a slow 4–11 s cycle. Every star's colour and rhythm come from its paper
node, so panning never reshuffles the sky; reduced motion holds them still. The accent is nebula
lavender `#b7a2ff` site-wide (2026-10-17), replacing terracotta; on a light ground it deepens to
`#6b52d6` (5.3:1 on white).

**The model stands on the paper at its origin.** The paper passes through the model's Rhino world
origin — for three-little-pigs, grade at the wall's far end — snapped to an axon node. Off home,
what lifts out of the paper is the ground the model stands on: one level of the lattice, not a
cube of it. A faint ground line marks where grade meets the paper. The origin carries a datum: a
ring and the three axes, each spanning the model's extent along it plus one lattice unit (5 ft)
past both ends, drawn as faint construction lines.

**Marks are quiet until asked.** Section planes and view arrows rest at a thin, half-strength line
(a 5% plane fill) and come up to full on hover of the mark, its bubble or its drawing. Arrowheads
are open drafted chevrons, never cones.

**The story panel reveals the prose.** With the story on, the panel holds the CYOA; a choice
reveals the matching Document section and flies the camera to the drawing or model part that
section is about. With the story off (the toggle, or `?story=off`), the panel is the plain
Document — every section, in order, no gating.

**The scraper contract is unchanged.** Every word ships in the HTML. JavaScript moves a camera and
toggles classes; it adds no text.

## Consequences

The scrolling Document built on `story-layer` (ADR-0006) becomes the story-off panel and the
no-WebGL fallback rather than the page. Each section needs a *view* in the content data — which
drawing or model part it is about. Those views are authored by Ethan; the prototype's are marked
`#proposed`. Records need their drawings' provenance (Make2D layer, sheet file) recorded so marks
can be measured; only three-little-pigs has that today. A model's export needs its Rhino offset kept
(`glbOffsetRhino`), since the origin is where the model meets the paper. Still open: whether the
star field goes beyond the sheet, onto pages where the lattice is currently a measure, not a drawing.
