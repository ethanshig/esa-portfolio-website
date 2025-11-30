# Portfolio Website Build Guide
**Built to MASTER-PLAN Specifications**

Last Updated: 2025-11-29

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [File Structure](#file-structure)
3. [How to Edit Content](#how-to-edit-content)
4. [Adding New Projects](#adding-new-projects)
5. [Customizing Styles](#customizing-styles)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Open the Website
Simply open `/index.html` in your web browser to see the landing page with the animated grid.

### 2. Key Pages
- **Landing**: `/index.html` - Animated 12×8 grid with ESA initials
- **Projects**: `/projects-new.html` - Slideshow of your work
- **Project Detail**: `/projects/project-template.html` - Template for individual projects
- **About**: `/about.html` - Your bio and philosophy
- **Resume**: `/resume.html` - Your CV
- **Contact**: `/contact.html` - Contact form
- **Easter Egg**: `/easter-egg.html` - Hidden Atari homage

### 3. View Locally
No server needed! Just double-click any `.html` file to open it in your browser.

For the includes (navbar/footer) to work, you may need a local server:
```bash
# If you have Python installed:
python -m http.server 8000

# Then visit: http://localhost:8000
```

---

## File Structure

```
portfolio-website/
├── index.html                  # Landing page (NEW - animated grid)
├── projects-new.html           # Projects slideshow (NEW)
├── about.html                  # About page (to be rebuilt)
├── resume.html                 # Resume page (to be rebuilt)
├── contact.html                # Contact page (to be rebuilt)
├── easter-egg.html             # Easter egg page (NEW)
│
├── includes/
│   ├── navbar.html             # Shared navigation (NEW)
│   └── footer.html             # Shared footer (NEW)
│
├── css/
│   ├── foundation.css          # Core styles (NEW - colors, typography, spacing)
│   ├── navigation.css          # Navbar + mobile tab bar (NEW)
│   ├── landing-animated.css    # Landing page animation (NEW)
│   ├── projects-slideshow.css  # Projects slideshow styles (NEW)
│   ├── project-detail.css      # Project page template styles (NEW)
│   └── [old files...]          # Previous versions (can be archived)
│
├── js/
│   ├── includes.js             # HTML includes loader (NEW)
│   ├── theme-toggle.js         # Light/dark mode (NEW)
│   ├── landing-animation.js    # Landing grid animation (NEW)
│   ├── projects-slideshow.js   # Projects navigation (NEW)
│   ├── lightbox.js             # Image enlargement (NEW)
│   └── [old files...]          # Previous versions (can be archived)
│
├── images/
│   └── projects/               # Project images go here
│
├── projects/
│   └── project-template.html   # Template for new projects (NEW)
│
├── fonts/
│   └── Sato-*.woff            # Sato font family (KEPT from original)
│
└── BUILD-GUIDE.md             # This file
```

---

## How to Edit Content

### Editing the Landing Page

**Location**: `/index.html` + `/js/landing-animation.js`

**To modify the grid layout** (if needed):
1. Open `/js/landing-animation.js`
2. Find the `gridLayout` object (lines ~20-80)
3. Edit letter positions (row, col)

**Animation timing**:
1. Open `/js/landing-animation.js`
2. Find the `TIMING` object (lines ~90-110)
3. Adjust millisecond values

**Easter egg location** (changes daily automatically):
- Position rotates based on date
- Algorithm in `getEasterEggPosition()` function

### Editing Projects

**Location**: `/projects-new.html` + `/js/projects-slideshow.js`

**To add/edit/remove projects**:
1. Open `/js/projects-slideshow.js`
2. Find the `projects` array (lines ~15-50)
3. Add a new project object:

```javascript
{
    id: 'my-new-project',                    // Unique ID
    title: 'My Project Title',               // Display name
    year: '2024',                            // Year completed
    category: 'Architecture',                // Type/category
    description: 'One sentence summary.',    // Brief description
    image: 'images/projects/my-thumb.jpg',   // Thumbnail (900×600px)
    link: 'projects/my-project.html'         // Detail page
}
```

4. Save the file - slideshow updates automatically!

**Image requirements** (from MASTER-PLAN):
- **Thumbnail**: 900×600px (3:2 ratio), max 300KB, JPG
- **Treatment**: Starts grayscale, color on hover

### Editing Project Detail Pages

**Location**: `/projects/project-template.html`

**To create a new project page**:
1. Copy `/projects/project-template.html`
2. Rename to `/projects/your-project-name.html`
3. Edit the content:
   - Replace hero image
   - Update title and metadata
   - Write overview text
   - Add gallery images
   - Update prev/next navigation links

**Image requirements** (from MASTER-PLAN):
- **Hero**: 1920×1080px (16:9), full-width, max 800KB
- **Gallery**: 1200×800px recommended, flexible ratios, max 500KB each
- All images start grayscale, color on hover

**Text guidelines**:
- Paragraphs max 75 characters wide (automatic)
- Use headings: H2 for sections, H3 for subsections
- Add image captions with class `image-caption`

### Editing Navbar/Footer

**Location**: `/includes/navbar.html` and `/includes/footer.html`

These are **shared across all pages**. Edit once, changes appear everywhere.

**Navbar links**:
```html
<a href="/projects-new.html" class="nav-link">Projects</a>
```

**Footer info**:
```html
<a href="mailto:your.email@example.com">Email</a>
```

---

## Adding New Projects

### Step-by-Step Checklist

- [ ] **1. Prepare images**
  - Thumbnail: 900×600px, 3:2 ratio, optimized JPG, max 300KB
  - Hero: 1920×1080px, 16:9 ratio, max 800KB
  - Gallery: 1200×800px (or similar), max 500KB each
  - Save to `/images/projects/`

- [ ] **2. Add to slideshow**
  - Open `/js/projects-slideshow.js`
  - Add project object to `projects` array
  - Save file

- [ ] **3. Create detail page**
  - Copy `/projects/project-template.html`
  - Rename to `/projects/your-project.html`
  - Edit content (title, metadata, overview, gallery, etc.)
  - Update prev/next navigation
  - Save file

- [ ] **4. Test**
  - Open `/projects-new.html` in browser
  - Navigate to your project in slideshow
  - Click to open detail page
  - Test lightbox (click gallery images)
  - Test on mobile (swipe between projects)

---

## Customizing Styles

### Colors (MASTER-PLAN Section 10)

**Location**: `/css/foundation.css` (lines 39-88)

```css
:root {
    /* Light mode */
    --color-primary: #1a1a1a;   /* Black text */
    --color-bg: #fafafa;         /* Soft white background */
    --color-gray: #666666;       /* Mid-gray for captions */
}

[data-theme="dark"] {
    /* Dark mode */
    --color-primary: #fafafa;    /* White text */
    --color-bg: #1a1a1a;         /* Black background */
    --color-gray: #999999;       /* Lighter gray */
}
```

**To change colors**: Edit these hex values, save, refresh browser.

### Typography (MASTER-PLAN Section 9)

**Location**: `/css/foundation.css` (lines 51-62)

```css
:root {
    /* Font sizes (fluid with clamp) */
    --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
    --text-h1: clamp(2.5rem, 5vw, 4rem);
    --text-h2: clamp(1.75rem, 3vw, 2.5rem);
    --text-h3: clamp(1.25rem, 2vw, 1.5rem);
    --text-caption: 0.875rem;

    /* Line heights */
    --line-height-tight: 1.2;
    --line-height-normal: 1.8;
}
```

### Spacing (MASTER-PLAN Section 11)

**Location**: `/css/foundation.css` (lines 67-83)

8px base unit with multipliers:
```css
:root {
    --spacing-xs: 4px;      /* 0.5× */
    --spacing-sm: 8px;      /* 1× */
    --spacing-md: 12px;     /* 1.5× */
    --spacing-lg: 16px;     /* 2× */
    --spacing-xl: 24px;     /* 3× */
    --spacing-2xl: 40px;    /* 5× */
    --spacing-3xl: 64px;    /* 8× */
    --spacing-4xl: 96px;    /* 12× */

    /* Applied values (per MASTER-PLAN decisions) */
    --section-spacing: var(--spacing-4xl);      /* Between sections */
    --subsection-spacing: var(--spacing-xl);    /* Within sections */
    --image-gap: var(--spacing-2xl);            /* Gallery gaps */
    --container-padding: var(--spacing-2xl);    /* Card padding */
}
```

---

## Deployment

### Option 1: GitHub Pages (Recommended)

1. **Initialize Git** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio website"
   ```

2. **Create GitHub repo**:
   - Go to github.com
   - Create new repository
   - Name it `portfolio` or `username.github.io`

3. **Push code**:
   ```bash
   git remote add origin https://github.com/yourusername/portfolio.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Repo → Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`, folder: `/ (root)`
   - Save

5. **Access site**:
   - URL: `https://yourusername.github.io/portfolio/`
   - Or: `https://yourusername.github.io/` (if repo named `username.github.io`)

### Option 2: Netlify

1. Drag and drop your `/portfolio-website/` folder into netlify.com
2. Site publishes instantly
3. Free subdomain: `yoursite.netlify.app`

### Pre-Deployment Checklist

- [ ] Replace all placeholder text
- [ ] Add real project images (optimized)
- [ ] Update footer with your contact info
- [ ] Test all links (internal and external)
- [ ] Test on mobile (Chrome DevTools)
- [ ] Test light and dark mode
- [ ] Add favicon: `/assets/favicon.png`
- [ ] Update meta descriptions in HTML `<head>`

---

## Troubleshooting

### Navbar/Footer not showing

**Problem**: Includes not loading (shows empty space)

**Solution**: You need a local server for includes to work.

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js (if installed)
npx serve

# Option 3: VS Code extension
# Install "Live Server" extension, right-click HTML → "Open with Live Server"
```

### Landing animation not playing

**Problem**: Grid appears but doesn't animate

**Solution**:
1. Check browser console for errors (F12)
2. Verify `/js/landing-animation.js` is loaded
3. Clear browser cache (Ctrl+Shift+R)

### Images not appearing

**Problem**: Broken image icons

**Solution**:
1. Check file path is correct (case-sensitive!)
2. Verify image exists in `/images/projects/`
3. Check console for 404 errors

### Theme toggle not working

**Problem**: Clicking sun/moon icon doesn't switch themes

**Solution**:
1. Check `/js/theme-toggle.js` is loaded
2. Verify element has `id="theme-toggle"`
3. Check console for JavaScript errors

### Projects slideshow stuck

**Problem**: Can't navigate between projects

**Solution**:
1. Check `/js/projects-slideshow.js` is loaded
2. Verify `projects` array has data
3. Test arrow keys and buttons separately

---

## Next Steps

### Immediate Tasks
1. **Add your real content**:
   - Replace placeholder project data
   - Add actual images (optimized)
   - Write project descriptions

2. **Rebuild remaining pages**:
   - About page (use MASTER-PLAN specs)
   - Resume page (traditional layout)
   - Contact page (Web3Forms integration)

3. **Test everything**:
   - Desktop browsers (Chrome, Firefox, Safari)
   - Mobile devices (or DevTools)
   - Light and dark modes
   - All interactions (hover, click, swipe)

### Future Enhancements (MASTER-PLAN Phase 2)
- 3D model viewer for architectural projects
- Advanced scroll-based animations
- Project search functionality
- Multi-language support

---

## Support & Documentation

- **MASTER-PLAN.md**: Complete design specifications
- **CLAUDE.md**: Project history and context
- **BUILD-GUIDE.md**: This file

**Questions?** Review the MASTER-PLAN for design decisions, or check existing code comments.

---

**Last Updated**: 2025-11-29
**Version**: 1.0 - Fresh Build
**Status**: Core pages complete, About/Resume/Contact pending
