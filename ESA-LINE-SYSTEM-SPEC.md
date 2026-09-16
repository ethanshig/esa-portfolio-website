# esa line system — site-wide spec

The landing mockup is settled: **Unbuild, continuous strokes, outline breath 45%**. This spec turns it
into rules for every page. Geometry for the light-loop mark lives in `ESA-MARK-PATHS.md`. The
mockup's working code is in `ESA-LINE-SYSTEM-REFERENCE.js`. Port its constants and ideas; don't
paste it in, because it was written for a 16:9 demo screen, not a scrolling site.

The system has one idea: **every line on the site is built from the esa circles.** The letters come
from circles with octants cut away. The page grid comes from those circles' spacing. Every outline is
drawn the way the letters are drawn: it draws itself in, and then it keeps breathing.

---

## 1. Units

| Name | Value | Meaning |
|------|-------|---------|
| `R` | 300 units | Radius of one letter circle |
| `L` | 1 lattice step = `R` | Every edge, rule and corner snaps to multiples of `L` |
| `L/4` | 75 units | Fine lattice for anything smaller than `L` (buttons, tags, icons) |
| Word width | `6L` (e, s, a touch: centres `2L` apart) | |
| Landing word size | 34% of viewport width | So `L = 100vw × 300 / 5294 ≈ 5.667vw` |

CSS:

```css
:root{
  --L: 5.667vw;              /* one lattice step */
  --L4: calc(var(--L) / 4);  /* fine lattice */
}
```

> **Check at real size:** `L` is about 82px at 1440px wide and about 22px at 390px wide. The mockup
> was only reviewed at about 1000px wide. If phones feel cramped, clamp it, e.g. `--L: clamp(28px, 5.667vw, 88px)`.
> Always change `--L` itself, never individual elements.

## 2. Palette and weight

Use the site's existing tokens from `css/foundation.css`. Don't bring in the mockup's paper colour.

| Line | Colour | Weight (in units of `R` = 300) | Share of `L` |
|------|--------|--------------------------------|--------------|
| Logo strokes | `var(--color-primary)` | 58 | 0.193 × logo circle radius |
| Outlines (images, cards, buttons) | `var(--color-primary)` at **62% group opacity** | 21.6 | 0.072 L |
| Text rules | same as outlines | 15.1 (0.7×) | 0.050 L |
| Landing word (display) | `var(--color-primary)` | 30 | 0.10 L |
| Guide circles (landing only) | `var(--color-primary)` at 30% | 3 | — |

- Caps are **round** everywhere.
- Opacity goes on the **group** that holds all outlines, not on each line. Otherwise overlapping caps and joints darken.
- Dark mode needs no extra work because the tokens flip.

## 3. The line renderer (shared by everything)

An SVG stroke has one width along its whole length, so it can't breathe. Every line is a **filled ribbon** instead:

1. Sample the centreline: every **14 units** for the logo, every **18 units** for outlines. Use
   `getPointAtLength` on a temporary path, then remove the path.
2. At each sample, offset both sides along the normal by `width(x, y, t) / 2`.
3. Fill the resulting polygon. Put a filled circle at each end for the round cap.

**Draw-in** is part of the ribbon, not a dash animation. At reveal `p`, keep the first `p` of the
samples. Multiply the width by the taper `clamp(revealedLength / (2.2 × baseWidth), 0, 1)`. A line
that has barely started is also barely wide, so it tapers in like a brush and never shows a dot.

> **Never use `stroke-dasharray` / `stroke-dashoffset` draw-ins with round caps.** A fully withdrawn
> dash still paints its cap as a dot at the start of the path. That caused the leftover dots in the
> mockup. If a dash animation is unavoidable (the landing word, §6), set `visibility:hidden` whenever
> progress is 0.

### Breathing

```js
const DEPTH = 0.45;                       // outline breath, settled
function breathAt(x, y, t){               // x, y in page units; t in seconds
  const field = 0.55*Math.sin(x*0.0021 + t*0.83)
              + 0.30*Math.sin(y*0.0033 - t*0.61 + 1.7)
              + 0.15*Math.sin((x-y)*0.0015 + t*1.13 + 0.4);
  const breath = Math.sin(t * 2*Math.PI / 7.5);          // one breath every 7.5 s
  return Math.max(0.35, 1 + DEPTH*(0.70*field + 0.30*breath));
}
// width at a sample = baseWidth * breathAt(x, y, t) * taper
```

- **The field is evaluated in page coordinates, not per element.** Wherever two outlines meet they
  get the same weight, so joints never step. Convert px to units with `units = px × 300 / Lpx`, using
  document position (`getBoundingClientRect() + scrollY`).
- **Only outlines breathe.** The logo has an even weight and moves by rotating (§5).
- **Performance:** only animate outlines inside the viewport (`IntersectionObserver`). Breathing
  is slow, so updating at 30fps is fine. Re-sample on `ResizeObserver`.

## 4. The grid (what outlines conform to)

The grid is **never drawn**. It only shows through the outlines of things.

- Page content is inset `L` from the left and right edges.
- Everything snaps to the lattice: x, y, width and height are whole multiples of `L`. Things smaller than `L` use `L/4`.

| Element | Outline shape | Rule |
|---------|---------------|------|
| Image / project thumbnail | Rounded rectangle, corner radius `L` | Size in whole `L`. The image inside is clipped to the same radius, inset by half the outline weight. |
| Card / text box | Rounded rectangle, radius `L` | Same |
| Text block | Horizontal rules at lattice rows | Rule weight 0.7×. The last rule of a block is shorter: it stops `3L` early. |
| Button | Stadium (two half circles joined by straight sides) | Height in whole `L/4` steps, ends are semicircles, width in whole `L/4` steps |
| Section | No box | Sections start on a lattice row |

In the mockup, 21 outlines drew in on a 14 × 7 lattice. On the site the row count is set by content, but every row edge still lands on a multiple of `L`.

## 5. The logo and nav

### Logo geometry

- Circle radius `R`, centres at `x = 0, 2R, 4R`, one horizontal bar through the centres at `y = 0`.
- Arcs are **continuous runs** of octants, where `k` is the octant index, 45° each, anticlockwise from +x:

| Letter | Octants on | Runs (start, length) |
|--------|-----------|----------------------|
| e | 1–6 | (1, 6) |
| s | 1, 2, 3, 5, 6, 7 | (1, 3), (5, 3) |
| a | 0–4, 7 | (7, 6) |

- Stroke weight is 58, with round caps, drawn as ribbons with no breathing.
- Nav logo height is `clamp(15px, 3.1vw, 30px)` and its viewBox is 760 units tall (`R + 80` above and below).

### The bar is the nav rule

- **The logo's bar keeps going to the right edge of the nav.** It is the same ribbon, so there's no join.
- It **replaces** `.navbar`'s `border-bottom`.
- The nav SVG spans the whole nav row. Recompute its viewBox width from the row's pixel width on
  resize, so the bar's cap lands flush with the right edge.
- **Links stand on the bar:** right-aligned, with their bottom edge `clamp(3px, .5vw, 6px)` above it. Projects,
  About, Resume and Contact follow this rule, and so does the theme toggle, which sits at the far right on the same line.
- The mobile bottom tab bar is unchanged. The top bar still spans the width.

### Rotation: Relay

- **Only the circles turn, about their own centres. The bar never moves.**
- The circles touch, so they turn like meshed gears: **e and a anticlockwise, s clockwise.**
- Relay, 12s cycle, starting from the moment the logo is built:

| Letter | Turn starts | Duration | Amount |
|--------|------------|----------|--------|
| e | 0.6 s | 3.2 s | 360° |
| s | 2.8 s | 3.2 s | 360° |
| a | 5.0 s | 3.2 s | 360° |
| (rest on "esa") | 8.2 s → 12.6 s | 4.4 s | — |

- Easing is sine in-out (`0.5 − 0.5·cos(πp)`). Every turn ends exactly on the word.

```js
function turns(t){                         // t = seconds on the logo's clock
  const c = t % 12, dir = [1, -1, 1];
  return [0,1,2].map(i => (2*Math.PI * calm((c - 0.6 - i*2.2) / 3.2)) % (2*Math.PI) * dir[i]);
}
// rotate a point about its circle centre (screen y is flipped, so + is anticlockwise):
// x' = ox + dx·cosθ + dy·sinθ ;  y' = dy·cosθ − dx·sinθ
```

## 6. Motion timeline

Easing: `ease` = cubic out `1 − (1 − p)³`, and `calm` = sine in-out. All times are in seconds.

### Landing (index) only: the word

The build draws on its own when the page loads:

| Beat | Start | Duration | Ease |
|------|-------|----------|------|
| Guide circles draw (staggered 0.12 per letter), 30% opacity | 0 | 0.70 | ease |
| All arcs draw at once (continuous runs) | 1.15 | 0.70 | ease |
| One bar through all three | 1.95 | 1.30 | ease |
| Guide circles fade to **0** | 2.10 | 0.75 | linear |

On click anywhere, the word unbuilds:

| Beat | Start | Duration |
|------|-------|----------|
| Bar retracts | 0 | 0.80 |
| Guide circles return | 0.30 | 0.55 |
| Arcs retract | 0.80 | 0.60 |
| Circles close; nothing left | 1.35 | 0.70 |
| **Page begins** (`tp = 0`) | **2.10** | — |

### Every page: the page builds

`tp` = seconds since the page began. On the landing page that's 2.10s after the click. On every other page it's page load.

| Beat | Start (tp) | Duration | Ease |
|------|-----------|----------|------|
| **Nav logo arcs draw in** (ribbon reveal) | 0 | 1.00 | calm |
| Logo bar draws, left to right | 0.55 | 0.70 | calm |
| Bar runs out to the right edge | 1.10 | 1.60 | calm |
| Nav links fade in | 2.10 | 0.60 | calm |
| Outline *i* draws in | 0.16 × i | 0.9 + length/9000 | ease |
| Logo rests, then the first Relay turn | logo clock starts at 2.7 | first turn at ≈5.6 | — |
| Outlines breathe | from their first frame | forever | — |

- **Nothing in the nav may show before `tp = 0`.** Not the logo, not the links, not the nav
  chrome fading in as a block. The logo is the page's first outline and builds with everything else.
- **Order outlines in reading order:** nav, then top to bottom, then left to right. Content below the
  fold starts its own draw-in when it scrolls into view, using the same stagger.

### Reduced motion

`prefers-reduced-motion: reduce` means no draw-ins, no breathing (constant base weight), no rotation.
Show the final state: word built, then page with nav and outlines present. On the landing page, a click still switches from the word to the page, with no animation.

## 7. Decisions I made that you may want to change

1. **The nav build plays once per session.** It plays on the landing page, or on the first page
   visited. After that the nav is already built (logo resting, bar full, links visible) and only the
   page outlines draw in. Replaying the nav on every click would get tiresome. Store the flag in
   `sessionStorage`.
2. **The landing sequence replaces the current flip-card grid** on `index.html`.
   `landing-simple.js` / `landing-simple.css` would be retired.
3. **Buttons use the `L/4` fine lattice.** The mockup's button was a full `2L` stadium, about 160px
   tall on desktop, which is too big for real controls.
4. **Breathing pauses when the tab is hidden** (`document.hidden`) and when an outline is off-screen.

## 8. Build checklist

- [ ] `--L` / `--L4` tokens; lattice-snapped layout utilities
- [ ] `js/line-system.js`: ribbon sampler, `breathAt`, draw-in scheduler, IntersectionObserver / ResizeObserver
- [ ] Outline mounting: `data-outline="rect|stadium|rules"` on elements; one overlay SVG per page in document coordinates
- [ ] Nav: logo SVG across the row, bar replaces `border-bottom`, links stand on it, Relay rotation, build timeline
- [ ] Landing: guide circles → arcs → bar; click → unbuild → page at 2.10s
- [ ] Zero dash draw-ins with round caps (or `visibility:hidden` at 0)
- [ ] Reduced-motion path
- [ ] Verify in a real browser at 390, 1000 and 1440px: no dots after any animation, outline joints agree, links sit on the bar, nothing in the nav appears before the page
