---
status: superseded by ADR-0005
---

# Fog conceals detail, not terrain

The Map needed a rule for what a reader has not yet seen. We chose the real-time-strategy
sense of fog — the terrain is always visible, and what is hidden is what happened on it —
over the roguelike sense, where the map starts black and places do not exist until visited.

## Considered Options

The black-map alternative was rejected because a first-time visitor would meet an empty
rectangle, which is a worse front door than the portal grid it replaces. It would also waste
the authored `lure` copy, which exists precisely to make an unvisited Place legible.

## Consequences

An untravelled Region is drawn at **full strength** — same stroke weight, same opacity, same
label — and differs from a travelled one only by carrying no Drawings. Dimming is forbidden:
it ranks the reader's thoroughness on the surface they navigate from, and the site has no tone
to spare, because mid-grey is the one value `mix-blend-mode: difference` cannot separate from.
Where a distinction genuinely must be drawn, spend motion or stroke weight, never lightness.

## Superseded

Reversed deliberately when the Map became a walkable World. A world whose edges expand as the
reader pushes them *is* the black-map sense this ADR rejected.

The argument here was that a first-time visitor should not meet an empty black rectangle. That
objection is now answered by the Sprite rather than by visible terrain: a reader arrives already
standing somewhere, exactly as the tour already opens cold, in a place, with no chooser.

**The other half of this ADR survives untouched and is restated in ADR-0005: no dimming, ever.**
Ground is either walked or not. Nothing is greyed to show a reader what they have missed.
