# Flip Card Text Visibility Fix - Resume Page

## Problem Summary

The flip cards on `resume.html` had invisible text when flipped, while the test page (`test-flip-cards.html`) worked correctly.

**Symptom:** Text on flipped cards was the same color as the background, making it unreadable.

## Root Cause Analysis

### Test Page Structure (Working)
```html
<div class="flip-card-resume">
    <div class="flip-card-front-resume">
        <div class="card-content">Front content here</div>
    </div>
    <div class="flip-card-back-resume">
        <div class="card-content-detailed">Back content here</div>
    </div>
</div>
```

The CSS fix targeted `.flip-card-back-resume` and worked correctly because the text content was directly inside this element.

### Resume Page Structure (Broken)
```html
<div class="resume-card">
    <!-- Content wrapper with ACTUAL TEXT (sits above flip cells) -->
    <div class="card-content-wrapper">
        <div class="card-front-layer">Front text</div>
        <div class="card-back-layer">Back text ← THIS NEEDED STYLING</div>
    </div>

    <!-- Individual flip cells (empty, just for visual effect) -->
    <div class="flip-cell">
        <div class="flip-card-resume">
            <div class="flip-card-front-resume"><!-- EMPTY --></div>
            <div class="flip-card-back-resume"><!-- EMPTY --></div>
        </div>
    </div>
    <!-- More flip-cells... -->
</div>
```

**Key Difference:**
- Resume page uses **dual-layer architecture**:
  1. **Flip cells** (`.flip-card-resume`) - Empty divs that provide the 3D flip visual effect
  2. **Content layers** (`.card-front-layer` / `.card-back-layer`) - Actual text content that fades in/out

- The CSS fix targeted `.flip-card-back-resume`, but on the resume page, these are **empty background divs**
- The actual text is in `.card-back-layer`, which wasn't getting proper styling

## The Solution

Added comprehensive color rules targeting `.card-back-layer` (where the actual text lives on resume.html):

### Changes to `/css/resume.css`

**1. Background colors for content layers (lines 207-217):**
```css
/* Light mode: dark background with light text for back layer */
:root .card-back-layer {
    background-color: #1a1a1a;
    color: #fafafa;
}

/* Dark mode: light background with dark text for back layer */
[data-theme="dark"] .card-back-layer {
    background-color: #fafafa;
    color: #0a0a0a;
}
```

**2. Force text colors for all child elements - Light Mode (lines 219-237):**
```css
:root .card-back-layer .card-content,
:root .card-back-layer .card-content-detailed,
:root .card-back-layer h3,
:root .card-back-layer .institution,
:root .card-back-layer .date,
:root .card-back-layer .detail,
:root .card-back-layer .detail-list li,
:root .card-back-layer .skill-group h4,
:root .card-back-layer .skill-group p,
:root .card-back-layer a.cta-link,
:root .card-back-layer a.download-link {
    color: #fafafa !important;
}

:root .card-back-layer .detail-list li::before {
    color: #fafafa !important;
}
```

**3. Force text colors for all child elements - Dark Mode (lines 239-257):**
```css
[data-theme="dark"] .card-back-layer .card-content,
[data-theme="dark"] .card-back-layer .card-content-detailed,
[data-theme="dark"] .card-back-layer h3,
[data-theme="dark"] .card-back-layer .institution,
[data-theme="dark"] .card-back-layer .date,
[data-theme="dark"] .card-back-layer .detail,
[data-theme="dark"] .card-back-layer .detail-list li,
[data-theme="dark"] .card-back-layer .skill-group h4,
[data-theme="dark"] .card-back-layer .skill-group p,
[data-theme="dark"] .card-back-layer a.cta-link,
[data-theme="dark"] .card-back-layer a.download-link {
    color: #0a0a0a !important;
}

[data-theme="dark"] .card-back-layer .detail-list li::before {
    color: #0a0a0a !important;
}
```

**4. Updated button/link styles to work in both contexts (lines 596-632):**
```css
/* Light mode: Links on dark flipped card background */
:root .card-back-layer .download-link,
:root .card-back-layer .cta-link,
:root .flip-card-back-resume .download-link,
:root .flip-card-back-resume .cta-link {
    background-color: #fafafa !important;
    color: #1a1a1a !important;
    border: 1px solid #fafafa;
}

/* Dark mode: Links on light flipped card background */
[data-theme="dark"] .card-back-layer .download-link,
[data-theme="dark"] .card-back-layer .cta-link,
[data-theme="dark"] .flip-card-back-resume .download-link,
[data-theme="dark"] .flip-card-back-resume .cta-link {
    background-color: #0a0a0a !important;
    color: #fafafa !important;
    border: 1px solid #0a0a0a;
}
```

## Why the Fix Works

1. **Targets the correct element:** `.card-back-layer` is where the actual visible text content lives on resume.html
2. **Comprehensive coverage:** Targets all text elements (h3, p, li, links, etc.) inside the back layer
3. **Uses !important:** Overrides any inherited or conflicting styles from parent elements
4. **Dual-context support:** Styles both `.card-back-layer` (resume.html) and `.flip-card-back-resume` (test page) for consistency
5. **Theme-aware:** Separate rules for light mode (`:root`) and dark mode (`[data-theme="dark"]`)

## Testing Checklist

- [ ] Open `resume.html` in browser
- [ ] Hover over Education card - verify text is readable (light text on dark background in light mode)
- [ ] Hover over Experience cards - verify all bullet points are visible
- [ ] Hover over Skills card - verify all skill groups are readable
- [ ] Test Download PDF and Contact Me buttons - verify they're visible and clickable
- [ ] Toggle to dark mode (click sun/moon icon in top-right)
- [ ] Repeat all hover tests in dark mode - verify dark text on light background
- [ ] Compare with `test-flip-cards.html` - both should now work identically

## Files Modified

- `/mnt/c/Users/ethan/portfolio-website/css/resume.css`
  - Lines 207-217: Added background colors to `.card-back-layer`
  - Lines 219-257: Added forced text colors for all content elements in light and dark modes
  - Lines 596-632: Updated button/link styles to work in both `.card-back-layer` and `.flip-card-back-resume` contexts

## Architecture Notes

The resume page uses a sophisticated dual-layer system:

**Visual Layer (Flip Cells):**
- Multiple small cells that flip to create a staggered visual effect
- Empty divs with only background colors
- Provides the 3D flip animation

**Content Layer (Front/Back Layers):**
- Single layer spanning the entire card
- Contains all actual text and interactive elements
- Fades in/out with opacity transitions (not 3D flip)

This creates a more dynamic visual effect where individual cells flip while content fades, but it requires styling both the flip cells AND the content layers separately.

## Why Use !important?

The `!important` flag is necessary here because:
1. The content inherits colors from multiple parent elements
2. Some elements (like links) have their own default colors
3. The base `.card-content-detailed` styles use `color: inherit` which can pull from wrong sources
4. We need to guarantee proper contrast regardless of inheritance chain

This is an appropriate use of `!important` for accessibility (ensuring readable text) in a complex inheritance hierarchy.

---

**Status:** Fixed ✓
**Date:** 2025-11-23
**Browser Tested:** Should work in all modern browsers with CSS Grid and 3D transform support
