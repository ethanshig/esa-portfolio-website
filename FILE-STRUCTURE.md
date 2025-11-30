# File Structure & Dependencies

Visual guide to how all the new files connect

---

## Page Structure

```
┌─────────────────────────────────────────────┐
│          INDEX.HTML (Landing Page)          │
│                                             │
│  Loads:                                     │
│  • css/foundation.css                       │
│  • css/navigation.css                       │
│  • css/landing-animated.css                 │
│  • js/includes.js                           │
│  • js/landing-animation.js                  │
│                                             │
│  Includes:                                  │
│  • includes/navbar.html (mobile only)       │
│                                             │
│  Features:                                  │
│  • 12×8 animated grid                       │
│  • ESA flip animation                       │
│  • Easter egg (daily position)              │
│  • Theme toggle in cell (1,12)              │
│  • Wave flip on hover                       │
│  • Navigation to other pages                │
└─────────────────────────────────────────────┘
                      ↓
        ┌─────────────┬─────────────┬─────────────┐
        ↓             ↓             ↓             ↓
     Projects       About        Resume        Contact
```

## Projects Flow

```
┌───────────────────────────────────────┐
│   PROJECTS-NEW.HTML (Slideshow)       │
│                                       │
│  Loads:                               │
│  • css/foundation.css                 │
│  • css/navigation.css                 │
│  • css/projects-slideshow.css         │
│  • js/includes.js                     │
│  • js/projects-slideshow.js           │
│  • js/theme-toggle.js                 │
│                                       │
│  Includes:                            │
│  • includes/navbar.html               │
│  • includes/footer.html               │
│                                       │
│  Data Source:                         │
│  • js/projects-slideshow.js           │
│    (projects array - edit here!)      │
└───────────────────────────────────────┘
                ↓ (click project)
┌───────────────────────────────────────┐
│  PROJECTS/PROJECT-TEMPLATE.HTML       │
│         (Detail Page)                 │
│                                       │
│  Loads:                               │
│  • css/foundation.css                 │
│  • css/navigation.css                 │
│  • css/project-detail.css             │
│  • js/includes.js                     │
│  • js/lightbox.js                     │
│  • js/theme-toggle.js                 │
│                                       │
│  Includes:                            │
│  • includes/navbar.html               │
│  • includes/footer.html               │
│                                       │
│  Features:                            │
│  • Full-width hero (16:9)             │
│  • Image gallery (2-3 cols)           │
│  • Lightbox on click                  │
│  • Prev/Next navigation               │
└───────────────────────────────────────┘
```

## Easter Egg Flow

```
┌─────────────────────┐
│  EASTER-EGG.HTML    │
│  (Atari Homage)     │
│                     │
│  Standalone page    │
│  No dependencies    │
│  All styles inline  │
│                     │
│  • Pixel grid BG    │
│  • Retro font       │
│  • Bouncing dots    │
│  • Story text       │
│  • Back button      │
└─────────────────────┘
```

## Shared Components

```
┌──────────────────────────────────────────┐
│         INCLUDES/NAVBAR.HTML             │
│  (Loaded into every page via JS)        │
│                                          │
│  • Logo (esa)                            │
│  • Nav links (Projects, About, etc.)     │
│  • Theme toggle button                   │
│  • Mobile hamburger (hidden on desktop)  │
│  • Mobile bottom tab bar                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         INCLUDES/FOOTER.HTML             │
│  (Loaded into every page via JS)        │
│                                          │
│  • Copyright                             │
│  • Social links                          │
└──────────────────────────────────────────┘
```

---

## CSS Hierarchy

```
foundation.css (CORE - loaded on every page)
├── Sato fonts (@font-face)
├── CSS variables (colors, spacing, typography)
├── Reset & base styles
├── Typography hierarchy (H1/H2/H3/P)
├── Layout utilities (.content-container)
├── Theme toggle styling
└── Responsive breakpoints

navigation.css (loaded on all pages)
├── Desktop navbar
├── Mobile tab bar
└── Responsive switching

landing-animated.css (landing page only)
├── 12×8 grid layout
├── Grid line animations
├── Flip card mechanics
├── ESA/nav letter styling
└── Easter egg styling

projects-slideshow.css (projects page)
├── Slideshow container
├── Slide transitions
├── Navigation arrows
├── Image hover effects
└── Swipe hints

project-detail.css (detail pages)
├── Hero image (full-width)
├── Content sections
├── Image gallery grid
├── Lightbox
└── Prev/Next navigation
```

---

## JavaScript Files

```
includes.js (loaded on every page)
├── Loads navbar.html
├── Loads footer.html
└── Highlights active nav link

theme-toggle.js (loaded on all pages)
├── Reads localStorage
├── Sets data-theme attribute
├── Updates icon (sun/moon)
└── Handles toggle button click

landing-animation.js (landing page only)
├── Generates 12×8 grid
├── Creates flip cards
├── Animates grid lines (Phase 1)
├── Flips ESA letters (Phase 2)
├── Animates 'a' struggle (Phase 3)
├── Handles word hover (wave flip)
├── Places easter egg (daily rotation)
└── Handles navigation clicks

projects-slideshow.js (projects page)
├── Reads projects array ← EDIT THIS TO ADD PROJECTS
├── Generates slides
├── Handles arrow buttons
├── Keyboard navigation (←/→)
├── Touch swipe detection
└── Updates counter

lightbox.js (project detail pages)
├── Creates lightbox element
├── Adds click listeners to gallery images
├── Shows full-size image
├── ESC key to close
└── Click outside to close
```

---

## Data Flow for Adding a Project

```
1. YOU EDIT:
   /js/projects-slideshow.js
   └── Add object to projects[] array

2. PREPARE IMAGES:
   /images/projects/
   ├── your-project-thumb.jpg (900×600px)
   └── your-project-hero.jpg (1920×1080px)

3. AUTOMATIC:
   projects-slideshow.js generates HTML on page load

4. YOU CREATE:
   /projects/your-project.html
   └── Copy project-template.html
   └── Edit content
   └── Add gallery images

5. RESULT:
   • Slideshow shows your project
   • Click → opens detail page
   • Lightbox works automatically
```

---

## How Includes Work

```
1. HTML page has:
   <div data-include="includes/navbar.html"></div>

2. includes.js runs:
   • Finds all [data-include] elements
   • Fetches the HTML file
   • Inserts content into element

3. Result:
   <div data-include="includes/navbar.html">
     <nav class="navbar">...</nav>
     <nav class="mobile-tab-bar">...</nav>
   </div>

4. Why this matters:
   • Edit navbar ONCE in includes/navbar.html
   • Changes appear on ALL pages
   • No copy-paste, no sync issues
```

---

## Theme Toggle Flow

```
1. Page Loads:
   theme-toggle.js reads localStorage
   ↓
2. Sets Attribute:
   <html data-theme="dark"> or "light"
   ↓
3. CSS Responds:
   [data-theme="dark"] { --color-bg: #1a1a1a; }
   ↓
4. User Clicks:
   Button → toggleTheme()
   ↓
5. Updates:
   • localStorage
   • data-theme attribute
   • Icon (☀/☽)
   ↓
6. CSS Auto-Updates:
   All --color-* variables change
```

---

## Responsive Breakpoints

```
Desktop (Default)
• Full navbar with links
• Grid animations play
• All features enabled

Tablet (≤1024px)
• Navbar stays visible
• Grid adjusts slightly
• 2-column galleries

Mobile (≤768px)
• Desktop navbar hides links
• Bottom tab bar appears
• Landing grid replaced with tab bar
• 1-column galleries
• Swipe gestures enabled
• Body gets padding-bottom: 60px

Small (≤480px)
• Extreme space conservation
• Smaller fonts (via clamp)
• Tighter spacing
```

---

## File Size Estimates

```
NEW FILES (Built)
includes/navbar.html         ~1 KB
includes/footer.html         ~0.5 KB
css/foundation.css           ~8 KB
css/navigation.css           ~4 KB
css/landing-animated.css     ~6 KB
css/projects-slideshow.css   ~5 KB
css/project-detail.css       ~7 KB
js/includes.js               ~1 KB
js/theme-toggle.js           ~1 KB
js/landing-animation.js      ~12 KB
js/projects-slideshow.js     ~5 KB
js/lightbox.js               ~2 KB
easter-egg.html              ~5 KB

TOTAL NEW CODE: ~57 KB (unminified)

IMAGES (per project)
Thumbnail (900×600)          300 KB max
Hero (1920×1080)             800 KB max
Gallery (1200×800 × 6)       3 MB max

FONTS (kept from original)
Sato family (4 files)        ~400 KB total
```

---

## Quick Reference: What Loads Where

| Page | foundation.css | navigation.css | landing-animated.css | projects-slideshow.css | project-detail.css |
|------|:---:|:---:|:---:|:---:|:---:|
| index.html | ✅ | ✅ | ✅ | ❌ | ❌ |
| projects-new.html | ✅ | ✅ | ❌ | ✅ | ❌ |
| project-template.html | ✅ | ✅ | ❌ | ❌ | ✅ |
| about.html | ✅ | ✅ | ❌ | ❌ | ❌ |
| resume.html | ✅ | ✅ | ❌ | ❌ | ❌ |
| contact.html | ✅ | ✅ | ❌ | ❌ | ❌ |
| easter-egg.html | ❌ | ❌ | ❌ | ❌ | ❌ |

| Page | includes.js | theme-toggle.js | landing-animation.js | projects-slideshow.js | lightbox.js |
|------|:---:|:---:|:---:|:---:|:---:|
| index.html | ✅ | ❌* | ✅ | ❌ | ❌ |
| projects-new.html | ✅ | ✅ | ❌ | ✅ | ❌ |
| project-template.html | ✅ | ✅ | ❌ | ❌ | ✅ |
| about.html | ✅ | ✅ | ❌ | ❌ | ❌ |
| resume.html | ✅ | ✅ | ❌ | ❌ | ❌ |
| contact.html | ✅ | ✅ | ❌ | ❌ | ❌ |

*Landing page has theme toggle built into landing-animation.js

---

## Development Workflow

### To Edit Site-Wide Elements
1. Edit `/includes/navbar.html` or `/includes/footer.html`
2. Save
3. Refresh any page → Changes appear everywhere

### To Change Colors/Fonts/Spacing
1. Edit `/css/foundation.css` variables
2. Save
3. Refresh → All pages update

### To Add a Project
1. Edit `/js/projects-slideshow.js` (add to array)
2. Add images to `/images/projects/`
3. Copy `/projects/project-template.html`
4. Rename and edit
5. Done!

### To Test Responsive
1. Open page in Chrome
2. F12 → Toggle device toolbar
3. Test at 1920px, 1024px, 768px, 480px
4. Or: Resize browser window

---

**This structure is designed for easy maintenance by non-developers**
**Most edits happen in data files (JS arrays) or include files**
**CSS changes ripple across all pages via variables**
