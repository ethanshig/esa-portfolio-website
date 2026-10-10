---
status: proposed (prototype on branch prototype/grid)
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

**Rhino's controls.** Right-drag orbits freely in full 3D, shift+right-drag pans, wheel or
ctrl+right-drag zooms; left is for picking. While a reader orbits away from the superimposed
view, the flat drawings ghost; clicking a ghosted drawing snaps the camera back to the
superimposed axon/cartesian view. Touch gets one-finger pan, two-finger orbit, pinch zoom.

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
can be measured; only three-little-pigs has that today.
