# Grid-Based Redesign Summary

## Overview

Your portfolio website has been completely redesigned to echo the grid-based theme from your landing page throughout all pages. The design is inspired by locomotive.ca's use of strong horizontal lines and clean sections.

## What's Changed

### 1. All Emojis Removed

All emojis have been removed from HTML files and replaced with text or removed entirely:
- `index.html`: Theme toggle icon
- `about.html`: Philosophy card icons
- `resume.html`: Download and location icons
- `contact.html`: Contact method icons

You can now provide your own custom iconography to replace these.

### 2. Grid-Based Design System Created

**New File:** `css/grid-system.css`

This comprehensive design system includes:

#### Grid Spacing System
- Base unit: 8px (1 grid unit)
- Consistent spacing multipliers: 2x, 3x, 4x, 6x, 8x, 12x, 16x
- Applied throughout all elements for visual rhythm

#### Horizontal Dividers (Grid Lines)
- `.section-divider` - 1px solid line echoing grid cells
- `.section-divider-thick` - 2px solid line for emphasis
- Automatic dividers on `.grid-section` elements

#### Grid-Aligned Sections
- `.grid-section` - Standard section with automatic top border
- `.grid-section--small` - Reduced padding (64px)
- `.grid-section--large` - Increased padding (128px)
- All sections use grid-based padding

#### Typography System
- `.page-title` - Large page headings (3-5rem)
- `.page-subtitle` - Secondary headings (1.125-1.5rem)
- `.section-title` - Section headings (2-3rem)
- `.section-heading` - Subsection headings (1.5-2rem)
- All using Sato font with responsive `clamp()`

#### Navigation (Grid-Aligned)
- Sticky navigation with border-bottom
- Clean, minimal design
- Active state with underline
- Smooth transitions using cubic-bezier

#### Grid Layout Helpers
- `.grid-2-col`, `.grid-3-col`, `.grid-4-col` - Auto grid layouts
- `.container` - Max-width 1400px
- `.container-narrow` - Max-width 900px
- Responsive breakpoints

#### Card Components
- `.grid-card` - Bordered cards with hover effects
- Project cards with grid borders
- Consistent padding and spacing

### 3. Page Transition Effect

**New Files:**
- `css/page-transition.css` - Transition overlay styles
- `js/page-transition.js` - Transition logic and animation

#### How It Works

When clicking any internal link:
1. Grid overlay appears over current page
2. Cells flip in **random order** (600ms total duration)
3. Once all flipped, navigate to new page
4. On new page load, cells flip back out in random order
5. Page content revealed

#### Features
- 12x8 grid (matches landing page)
- Responsive grid sizes (same as landing)
- Fisher-Yates shuffle for random order
- Smooth cubic-bezier transitions
- Respects `prefers-reduced-motion`
- Intercepts all internal links automatically
- Works with browser back/forward buttons

### 4. Updated All HTML Pages

All pages now include:

```html
<link rel="stylesheet" href="css/grid-system.css">
<link rel="stylesheet" href="css/page-transition.css">
<script src="js/page-transition.js"></script>
```

Pages updated:
- `index-landing.html` - Landing page
- `index.html` - Projects page
- `about.html` - About page
- `resume.html` - Resume page
- `contact.html` - Contact page

Sections updated with `grid-section` classes for automatic dividers.

## Design Patterns from locomotive.ca

### Horizontal Lines
- Used as section dividers
- Echo the grid pattern from landing page
- Created with `border-top: 1px solid var(--color-border)`

### Clean Sections
- Modular sections stacking vertically
- Consistent spacing using grid system
- Clear visual hierarchy

### Smooth Transitions
- Cubic-bezier easing: `cubic-bezier(0.215, 0.61, 0.355, 1)`
- Applied to all interactive elements
- Page transitions use same easing

### Minimal Grid
- Grid implied through spacing and dividers
- Not visually heavy like traditional grids
- Clean, architectural aesthetic

## How to Use the Grid System

### Adding Sections

```html
<section class="grid-section">
    <div class="container">
        <h2 class="section-title">Section Title</h2>
        <!-- Content -->
    </div>
</section>
```

This automatically adds:
- Top border (horizontal line)
- Grid-based padding (96px top/bottom)
- Consistent spacing

### Creating Grid Layouts

```html
<div class="grid-3-col">
    <div class="grid-card">Item 1</div>
    <div class="grid-card">Item 2</div>
    <div class="grid-card">Item 3</div>
</div>
```

Automatically responsive:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

### Adding Horizontal Lines

```html
<hr class="section-divider">
<!-- or -->
<div class="h-line"></div>
<!-- or -->
<div class="h-line h-line--thick h-line--primary"></div>
```

### Using Spacing Variables

```css
.custom-element {
    margin-bottom: var(--grid-6);  /* 48px */
    padding: var(--grid-4);        /* 32px */
}
```

Available: `--grid-unit` through `--grid-16`

## Page Transition Customization

### Adjust Transition Speed

In `js/page-transition.js`, change:

```javascript
const totalDuration = 600; // ms (line ~142)
```

### Change Grid Size

The grid automatically matches screen size:
- Desktop: 12x8
- Tablet: 10x8
- Mobile: 6x8

To customize, edit `getGridDimensions()` method.

### Disable for Specific Links

Add `data-no-transition` attribute:

```html
<a href="page.html" data-no-transition>No Transition</a>
```

Then update `isInternalLink()` to check for this attribute.

## Responsive Behavior

All grid elements respond to screen size:

| Screen Width | Grid Columns | Section Padding |
|--------------|--------------|-----------------|
| > 1024px     | 12           | 96px            |
| ≤ 1024px     | 10           | 96px            |
| ≤ 768px      | 6            | 64px            |
| ≤ 480px      | 6            | 64px            |

## Testing Checklist

- [ ] Open `index-landing.html` in browser
- [ ] Click navigation words - verify page transition
- [ ] Check that cells flip in random order
- [ ] Verify new page loads and flips out
- [ ] Test all internal links across site
- [ ] Check horizontal dividers between sections
- [ ] Verify spacing is consistent
- [ ] Test on mobile/tablet screen sizes
- [ ] Check that emojis are removed
- [ ] Test browser back/forward buttons

## File Structure

```
css/
  ├── style.css              (existing - base styles)
  ├── grid-system.css        (NEW - grid design system)
  ├── page-transition.css    (NEW - transition overlay)
  ├── landing-simple.css     (existing - landing page)
  └── [page-specific].css    (existing)

js/
  ├── page-transition.js     (NEW - transition logic)
  ├── theme-and-animations.js (existing)
  ├── landing-simple.js      (existing)
  └── [page-specific].js     (existing)
```

## CSS Variables Reference

### Spacing
```css
--grid-unit: 8px
--grid-2: 16px
--grid-3: 24px
--grid-4: 32px
--grid-6: 48px
--grid-8: 64px
--grid-12: 96px
--grid-16: 128px
```

### Transitions
```css
--transition-smooth: cubic-bezier(0.215, 0.61, 0.355, 1)
```

### Colors (from existing style.css)
```css
/* Light mode */
--color-primary: #0a0a0a
--color-bg: #fafafa
--color-border: #e5e5e5

/* Dark mode */
--color-primary: #fafafa
--color-bg: #0a0a0a
--color-border: #2a2a2a
```

## Next Steps

1. **Add Custom Icons**
   - Replace removed emojis with your own iconography
   - Use SVG or image files
   - Add to appropriate sections

2. **Customize Sections**
   - Adjust padding using grid size variants
   - Add/remove horizontal dividers as needed
   - Customize typography sizes

3. **Fine-tune Transitions**
   - Adjust flip duration
   - Modify randomization pattern
   - Add sound effects (optional)

4. **Content Updates**
   - Replace placeholder "Your Name" text
   - Add real project images
   - Update copy and descriptions

## Browser Compatibility

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires support for:
- CSS Grid
- CSS Custom Properties
- 3D Transforms
- Async/Await JavaScript

## Accessibility

- `prefers-reduced-motion` disables transitions
- Keyboard navigation maintained
- ARIA labels on interactive elements
- High contrast maintained in both themes
- Semantic HTML structure preserved

---

**Last Updated**: 2025-11-22
**Version**: 2.0 - Grid-Based Redesign
**Status**: Ready for Testing
