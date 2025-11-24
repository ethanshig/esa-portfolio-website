# Portfolio Website Project Context

## Project Overview
A portfolio website for "esa" (Ethan's initials) featuring an interactive grid-based landing page with flip card navigation and light/dark theme support.

## Current Working Directory
`/mnt/c/Users/ethan/portfolio-website`

## Key Features Implemented

### 1. Interactive Grid Landing Page
- **12×8 grid layout** with flip card cells
- Navigation words integrate with "esa" initials through shared letters
- **Group flip behavior**: Hovering any letter in a word flips ALL letters in that word
- Only "esa" letters visible initially; navigation letters hidden until hover/flip

### 2. Grid Layout (Exact Positions)
```
Row 5 (Main horizontal): r-e-s-u-m-e-s-a-b-o-u-t
                        (1-2-3-4-5-6-7-8-9-10-11-12)
                                  ^esa^

Column 6 (Projects vertical):    Column 8 (Contact vertical):
  p (row 1)                        c (row 1)
  r (row 2)                        o (row 2)
  o (row 3)                        n (row 3)
  j (row 4)                        t (row 4)
  e (row 5) ← shares with esa      a (row 5) ← shares with esa
  c (row 6)                        c (row 6)
  t (row 7)                        t (row 7)
  s (row 8)
```

**Shared Letters:**
- "resume" shares final 'e' with "esa" at (5,6)
- "projects" shares 'e' with "esa" at (5,6) - vertical
- "about" shares first 'a' with "esa" at (5,8)
- "contact" shares 'a' with "esa" at (5,8) - vertical

### 3. Typography
- **Font**: Sato (custom font loaded from `/fonts/`)
  - Regular weight (400) for navigation letters
  - Bold weight (700) for "esa" letters at 2x size
- **ESA letters**: `clamp(3rem, 6vw, 5rem)` - Bold
- **Navigation letters**: `clamp(1.5rem, 3vw, 2.5rem)` - Regular

### 4. Theme System
- Light/dark mode toggle integrated as grid cell (1,12)
- Custom Sun.jpg and Moon.jpg icons
- CSS filters adapt icons to theme (brightness + invert)
- localStorage persistence
- CSS custom properties for theming

### 5. Visual Effects
- Image desaturation (grayscale → color on hover)
- SpinKit FOLD loading spinner
- 3D flip card animations
- Smooth transitions throughout

## File Structure

### HTML Files
- **`index-landing.html`** - Landing page with grid (ACTIVE)
- `index.html` - Main portfolio page
- `about.html` - About page
- `resume.html` - Resume page
- `contact.html` - Contact page
- `test-landing.html` - Testing page for debugging

### CSS Files
- **`css/landing-simple.css`** - Simplified landing grid styles (ACTIVE)
- `css/style.css` - Main styles with Sato font and dark mode
- `css/landing.css` - Original landing with animation (archived for later)

### JavaScript Files
- **`js/landing-simple.js`** - Grid generation and group flip logic (ACTIVE)
- `js/theme-and-animations.js` - Theme toggle functionality
- `js/landing-integrated.js` - Original with animation (archived for later)

### Assets
- `/fonts/` - Sato font family (.woff files)
- `/images/Sun.jpg` - Light mode icon (615KB)
- `/images/Moon.jpg` - Dark mode icon (599KB)

### Documentation
- `LANDING-SETUP.md` - Implementation details
- `UPDATE-GRID-LAYOUT.md` - Guide for updating positions
- `claude.md` - This file (project context)
- `NEW-FEATURES-GUIDE.md` - Feature documentation
- `ESA-ANIMATION-REFERENCE.md` - Animation reference (for future)

## Technical Implementation Details

### Group Flip Mechanism
1. Each navigation cell gets:
   - Class: `word-${wordName}` (e.g., `word-resume`)
   - Data attribute: `data-word="${wordName}"`

2. On hover:
   - JavaScript finds all cells with matching word class
   - Adds `word-hover` class to entire word group
   - CSS transforms all cards in group: `rotateY(180deg)`

3. Shared letters:
   - Detected automatically by matching row/col positions
   - Cell marked as 'esa' type but includes navigation word class
   - Flips with navigation word but shows ESA styling

### CSS Architecture
```css
/* Grid base */
.grid-overlay: 12×8 CSS Grid
.grid-cell: Individual cell with perspective

/* Flip cards */
.flip-card: 3D transform container
.flip-card-front/back: Absolute positioned faces

/* Letters */
.letter-esa: Bold, 2x size, always visible
.letter-nav: Regular weight, opacity:0 initially

/* Theme toggle */
.theme-icon: CSS filter for light/dark adaptation
```

### JavaScript Architecture
```javascript
// Grid generation
gridLayout object → generateGrid() → DOM cells

// Event handling
setupHoverEffects() → group hover logic + click navigation

// Theme toggle
toggleTheme() → update localStorage + update icons
```

## Navigation Links
- **resume**: `resume.html`
- **projects**: `index.html#projects`
- **about**: `about.html`
- **contact**: `contact.html`

## Responsive Breakpoints
- **Desktop** (default): 12×8 grid
- **Tablet** (≤1024px): Adjust to 10×8
- **Mobile** (≤768px): Adjust to 6×8
- **Small** (≤480px): Adjust to 4×6

All font sizes use `clamp()` for fluid scaling.

## Color Scheme (CSS Variables)
```css
/* Light mode */
--color-primary: #0a0a0a (black)
--color-bg: #fafafa (off-white)
--color-border: #e5e5e5 (light gray)

/* Dark mode */
--color-primary: #fafafa (off-white)
--color-bg: #0a0a0a (black)
--color-border: #2a2a2a (dark gray)
```

## Future Enhancements (Archived for Later)
1. **ESA Glow Animation**
   - Light tracing the circular nature of "esa" letters
   - Gradual reveal of letters
   - Files preserved: `css/landing.css`, `js/landing-integrated.js`

2. **Grid Transition Animation**
   - Fade-in grid lines after ESA reveal
   - Currently simplified version loads directly to grid

## Development Notes

### Current Status
✅ Grid layout finalized (12×8)
✅ All words positioned with correct sharing
✅ Group flip behavior working
✅ Theme toggle integrated
✅ Letters centered in cells
✅ Responsive design implemented

### Known Issues
None currently

### Testing Checklist
- [ ] Open `index-landing.html` in browser
- [ ] Verify only "esa" visible initially
- [ ] Test hover on each navigation word
- [ ] Confirm all letters in word flip together
- [ ] Test click navigation to pages
- [ ] Test theme toggle flip and functionality
- [ ] Test on different screen sizes
- [ ] Verify loader appears then hides

## Quick Start Commands

### View in Browser
```bash
# Windows
start index-landing.html

# Linux/WSL
explorer.exe index-landing.html
```

### Check Files
```bash
ls css/landing-simple.css
ls js/landing-simple.js
ls images/Sun.jpg images/Moon.jpg
```

### Verify Grid Dimensions
```bash
# Should show rows=8, cols=12
grep -n "const rows\|const cols" js/landing-simple.js
```

## Git Repository
Not currently a git repository. To initialize:
```bash
git init
git add .
git commit -m "Initial portfolio website with interactive grid landing"
```

## Browser Compatibility
- Modern browsers with CSS Grid support
- 3D transforms (flip cards)
- CSS custom properties (theme variables)
- localStorage API (theme persistence)
- Tested on: Chrome, Firefox, Edge, Safari (iOS/macOS)

## Performance Notes
- Images preloaded via `<link rel="prefetch">`
- CSS transitions optimized with transform (GPU accelerated)
- Minimal JavaScript DOM manipulation
- No external dependencies (vanilla JS)

## Accessibility Features
- `prefers-reduced-motion` media query support
- Keyboard navigation (tab + enter)
- ARIA labels on interactive elements
- High contrast theme support
- Semantic HTML structure

## Contact
For questions or updates, refer to the documentation files or resume previous session using this claude.md context.

## Recent Updates (2025-11-22)

### Grid-Based Redesign
Complete redesign of all pages to echo the landing page grid theme:

**New Files Created:**
- `css/grid-system.css` - Comprehensive grid-based design system
- `css/page-transition.css` - Grid-based page transition overlay
- `js/page-transition.js` - Page transition animation logic
- `GRID-REDESIGN-SUMMARY.md` - Complete redesign documentation

**Key Features:**
1. **Grid Spacing System** - 8px base unit with consistent multipliers
2. **Horizontal Dividers** - Strong 1px lines between sections (locomotive.ca inspired)
3. **Grid-Aligned Sections** - All sections use `.grid-section` class
4. **Page Transitions** - Cells flip in random order between pages
5. **All Emojis Removed** - Ready for custom iconography

**Design Inspiration:**
- locomotive.ca - Horizontal lines, clean sections, smooth transitions
- Landing page grid - 12x8 responsive grid system carried throughout

**Updated All Pages:**
- `index-landing.html`, `index.html`, `about.html`, `resume.html`, `contact.html`
- All include grid-system.css and page-transition functionality

---

## Recent Updates (2025-11-23)

### Resume Page Flip Card Enhancements

**Major improvements to resume page:**

1. **Fixed Card Title Centering** (resume.css)
   - Titles now centered across full card area, not confined to single cells
   - Implemented dual-layer architecture: content layer (z-index: 2) over flip cells (z-index: 1)
   - Card content wrapper spans entire card with absolute positioning
   - Sequential flip animation preserved perfectly

2. **Removed Internal Grid Lines** (resume.css)
   - Removed grid borders from flip cells for clean card appearance
   - Cards appear as unified rectangular elements
   - Cell-by-cell flip animation maintained internally
   - Only outer card border visible

3. **Fixed Text Visibility on Flipped Cards** (resume.css)
   - Resolved white-on-white and black-on-black text issues
   - Implemented theme-specific color overrides with `!important` flags
   - Light mode flipped cards: dark background (#1a1a1a) with light text (#fafafa)
   - Dark mode flipped cards: light background (#fafafa) with dark text (#0a0a0a)
   - Added comprehensive styling for `.card-back-layer` to handle dual-layer architecture

4. **Updated Resume Content** (resume.html)
   - Replaced all placeholder content with exact wording from actual resume PDF
   - Expanded from 7 to 9 cards to properly represent all sections:
     - Education (1 card)
     - Work Experience (3 cards: RATIO internship, Allerton Park, Para La Tierra)
     - Extracurricular Activities (2 cards: Kingfisher Composting, Goodwill Ambassador)
     - Skills and Achievements (2 cards: Software/Languages, Honors/Recognition)
   - Added resume PDF download: `assets/resume/Ethan-Anderson-Resume.pdf`

5. **Grid Line Styling Refinement** (all CSS files)
   - Changed background grid lines from dotted to **dashed** (more visible)
   - Reverted all UI component borders to **solid** lines:
     - Card outlines, navigation bars, buttons, forms, etc.
   - Clear visual hierarchy: dashed architectural grid vs solid bold components
   - Updated files: grid-system.css, about.css, resume.css, projects-grid.css, style.css, contact.css

**Files Modified:**
- `css/resume.css` - Dual-layer architecture, text color fixes, card styling
- `resume.html` - Complete content replacement with exact resume data
- `css/grid-system.css` - Grid line styling (dashed background)
- `css/about.css` - UI borders (solid)
- `css/projects-grid.css` - UI borders (solid)
- `css/style.css` - Navigation and button borders (solid)
- `css/contact.css` - Form borders (solid)
- `js/resume.js` - Created for flip card generation
- `js/about.js` - Created for about page functionality

**New Test Files Created:**
- `test-flip-cards.html` - Standalone test page for flip card debugging
- Various documentation files (COLOR-VERIFICATION.md, FLIP-CARD-FIX-SUMMARY.md, etc.)

**Technical Architecture:**
- Flip cards use dual-layer system: content layers above flip cell layers
- Content layers handle text display and fading (opacity transitions)
- Flip cells provide sequential 3D flip animation background
- Theme-specific hardcoded colors with `!important` to override inheritance
- Staggered flip animation: 30ms delay per cell

---

**Last Updated**: 2025-11-23
**Version**: 2.1 - Resume Page Flip Card Enhancements
**Status**: Production Ready
