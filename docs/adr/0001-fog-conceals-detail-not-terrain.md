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
