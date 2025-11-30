# Portfolio Website Master Plan
## Complete Build Specification for esa Portfolio

**Document Version**: 1.0
**Last Updated**: 2025-11-29
**Status**: Living Document - In Planning Phase
**Execution Ready**: No - Requires Your Design Decisions

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Design Philosophy & Visual Identity](#design-philosophy--visual-identity)
3. [Site Architecture & Navigation](#site-architecture--navigation)
4. [Landing Page Specification](#landing-page-specification)
5. [Projects Section](#projects-section)
6. [About Page](#about-page)
7. [Resume Page](#resume-page)
8. [Contact Page](#contact-page)
9. [Typography System](#typography-system)
10. [Color Palette & Theming](#color-palette--theming)
11. [Grid System & Layout](#grid-system--layout)
12. [Animations & Interactions](#animations--interactions)
13. [Responsive Design Breakpoints](#responsive-design-breakpoints)
14. [Content Strategy](#content-strategy)
15. [Technical Implementation](#technical-implementation)
16. [Performance & Optimization](#performance--optimization)
17. [Accessibility Requirements](#accessibility-requirements)
18. [Browser Support](#browser-support)
19. [Deployment Strategy](#deployment-strategy)
20. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Purpose
A portfolio website showcasing sustainable architecture and design work for **esa** (Ethan Shig Anderson), demonstrating design thinking, technical skills, and commitment to environmental stewardship.

### Target Audience
- Potential employers (architecture firms, design studios)
- Collaborators and peers
- Academic reviewers
- Clients interested in sustainable design

### Key Goals
- Primary goal: job applications and academic portfolio
- Showcase design projects with depth and context
- Demonstrate technical and conceptual skills
- Communicate design philosophy and values
- Provide easy contact and resume access
- Create memorable, unique user experience

### Brand Identity: "esa"
- Minimalist, architect-focused branding
- Lowercase letters emphasizing approachability
- Grid-based design reflecting architectural precision
- Interactive elements showing technical capability

---

## Design Philosophy & Visual Identity

### Core Design Principles
Rank these principles in order of importance (1-5):
- 1. **Sustainability** - Eco-conscious, natural, organic
- 2. **Innovation** - Bold, experimental, cutting-edge
- 3. **Minimalism** - Clean, uncluttered, focus on content
- 4. **Technical Precision** - Grid-based, mathematical, structured
- 5. **Accessibility** - Inclusive, readable, universal

### Visual Inspiration References
**Current influences** (from existing codebase):
- LoveFrom (https://www.lovefrom.com/) - Minimalist simplicity and emotional warmth
- Tobias Ahlin / Applied Works (https://tobiasahlin.com/blog/previous-sibling-css-has/  /  https://applied.works/)- Clear, blocky organization. Animations on landing page of Applied Works bring the page to life
- Snøhetta (https://www.snohetta.com/) - light text on dark color theme
- Locomotive (https://locomotive.ca/en)- organization of text using strong horizontal elements and nesting
- Build List (https://buildlist.org/) - strong use of light on dark color pallet, grid element with overlaid animation, and chart-like organization of content. In particular, the grid element deploys two weights of line that add layers of emphasis to the grid, similar to a cutting mat. 
- Way of Code (https://www.thewayofcode.com/) - again, strong use of simple color pallet, integration of animation, and simple navigation bar.

Which influences should we emphasize most?
- Prioritize: LoveFrom, Way of Code, and Build List

### Mood & Tone
Select the tone that best represents your brand:
1. **Academic & Thoughtful** - Scholarly, research-focused
2. **Eco-Conscious & Organic** - Natural, sustainable, earthy
3. **Creative & Playful** - Experimental, personality-driven

---

## Site Architecture & Navigation

### Page Structure
```
Portfolio Website
├── Landing Page (index-landing.html)
│   └── Interactive 12×8 grid with "esa" + navigation
│
├── Projects Hub (projects.html)
│   ├── Project Grid View (multiple layouts possible)
│   └── Individual Project Pages (9+ projects)
│
├── About Page (about.html)
│   ├── Personal story
│   ├── Design philosophy
│   └── Professional background
│
├── Resume Page (resume.html)
│   ├── traditional layout
│   └── PDF download
│
└── Contact Page (contact.html)
    ├── Contact form

```

Should we keep current dual-homepage structure?
- Merge into single homepage with grid + projects


### Navigation System

**Current Implementation**:
- Landing page: Interactive grid with navigation words integrated
- Other pages: Traditional navbar with links

Navigation consistency across site:
- [x] **Unified grid navigation** - Grid navigation on every page


What should the main navigation items be?
Current: Projects, About, Resume, Contact
- Keep current structure


### Theme Toggle Placement
**Current**: Theme toggle integrated into grid cell (1,12) on landing page

Theme toggle strategy across all pages:
- Consistent corner button on all pages
- Navbar integration


---

## Landing Page Specification

### Current Grid Layout (12×8)
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

```

### Landing Page Animation Sequence

**Your Vision**: Blank screen → Grid lines drawn in sequentially → ESA cells flip → 'a' struggles, gets "smacked" by 's'

Define precise timing for implementation:

#### Phase 1: Grid Line Drawing
- **Duration**: 1500-2000ms
- **Drawing speed**: 50-100ms
- **Drawing pattern**:
  - [x] Sequential - All horizontal lines left-to-right, then all vertical top-to-bottom
  - [ ] Simultaneous - Horizontal and vertical lines draw at same time
  - [ ] Radial - Lines appear from center outward
  - [ ] Custom: _____
- **Line animation style**:
  - [ ] Width expands (line grows from 0 → 100% length)
  - [x] Opacity fades in (line visible, fades from transparent → opaque)
  - [ ] Both (fade + expand simultaneously)

#### Phase 2: ESA Cell Flips
- **Start delay** (after grid complete): +300-500ms
- **Flip duration** per cell: 400-600ms per flip
- **Flip order**:
  - [x] 'e' → 's' → 'a' (sequential left-to-right)
  - [ ] 'e' and 's' together → 'a' (first two simultaneous, then 'a')
- **Time between flips**: 200ms

#### Phase 3: 'a' Struggle Animation (The "Smack")
- **Number of failed flip attempts**: 2 attempts
- **Attempt 1**: Starts after 's' flips, flips to 45° then falls back 
- **Attempt 2**: Starts 500 ms after Attempt 1, flips to 70° then falls back 
- **'s' cell bounce**: Small bounce/nudge animation toward 'a' (yes/no): no
- **Final successful flip**: Completes after 's' "smacks" it
- **Total struggle duration**: 1000-1500ms for comedic timing

#### Phase 4: Navigation Reveal (Optional)
- **Navigation words** (resume, projects, about, contact):
  - [ ] Already visible on cell backs (revealed when cells flip)
  - [ ] Fade in after ESA animation: +_____ms delay
  - [x] Appear only on hover (not part of initial animation)

**Total Animation Duration**: 4000-5000ms (sum all phases)

**Skip Options**:
- [ ] Allow users to skip with click/keypress
- [x] No skip - Force full animation
- [ ] Auto-skip on repeat visits (use localStorage) 

### Group Flip Behavior

**Current**: Hovering any letter in a navigation word flips ALL letters in that word sequentially (wave effect)

- **Wave effect** - Letters flip in sequence when hovering word


### Letter Reveal Strategy

**Current**: Only "esa" visible initially; navigation letters hidden until hover

### Easter Egg

**Concept**: Random cell with bouncing egg icon on flip → Click opens easter egg page

Choose easter egg content:

**Option 1: Atari Homage - Hidden Signature**
- Page shows: Your name in retro pixel font (inspired by Warren Robinett's Adventure)
- Background: Atari 2600 aesthetic (black screen, colored pixel dots)
- Text: "Vibecoded by Ethan Shig Anderson • 2025"
- Include: Brief story about hidden details in architecture/why you hid this. Aknowledgment of the use of gen ai and its use of other peoples work in the process of creation. 

**Option 2: "Project Zero" - Secret Personal Project**
- Page shows: Experimental/personal project not in main portfolio
- Could be: Art project, sketch series, manifesto, creative experiment
- Format: Same template as regular project pages but marked "unlisted"
- Message: "You found a secret project"

**Option 3: Design Philosophy Manifesto**
- Page shows: Unfiltered thoughts on design, sustainability, architecture
- Format: Long-form essay or visual manifesto with strong opinions
- More personal/vulnerable than About page
- Could include: Inspirations, frustrations, hopes for the field

**Option 4: Interactive Mini-Experience**
- Simple architecture-related web toy/game:
  - [ ] Stack blocks physics sim (build a tower)
  - [ ] Sketch a floor plan → auto-generates 3D view
  - [ ] Sustainability quiz with commentary
  - [ ] Other: _____

**Option 5: Evolution Timeline**
- Visual timeline of your journey as designer
- Show: Early sketches → Current work progression
- Include: "Failed" projects, learning moments, growth narrative

**Select option 1-5 (or describe custom)**: 1

**Easter Egg Implementation Details**:
- **Egg cell location**:
  - [ ] Truly random each page visit
  - [ ] Fixed cell location: Row _____, Column _____
  - [x] Rotates daily/weekly based on date
- **Egg icon**:
  - [x] Animated bouncing egg (CSS keyframe animation)
  - [ ] Static egg icon with pulse effect
  - [ ] Custom icon: _____ (describe)
- **Access**: Hover over cell → Flips to reveal egg → Click egg → Opens easter egg page
- **Return to site**:
  - [x] Back button in corner
  - [ ] Close button (X)
  - [ ] Auto-return after _____seconds
  - [ ] ESA grid navigation still visible

---

## Projects Section

### Project Display Layout

**projects-grid.html** - Full-page grid with flip cards

Choose exact layout for projects grid:

**Option A: Slideshow (One project at a time)**
```
                    ┌─────────────────────┐
    [←]             │                     │             [→]
                    │   Project Image     │
                    │                     │
                    │   Project Title     │
                    │   Year • 1 sentence │
                    └─────────────────────┘
```
- Shows 1 project at a time, arrows navigate next/previous
- Clean, focused, magazine-style

**Option B: Three-Column Grid with Pagination**
```
    ┌──────┐  ┌──────┐  ┌──────┐
    │ Proj │  │ Proj │  │ Proj │
    │  1   │  │  2   │  │  3   │
    └──────┘  └──────┘  └──────┘
    ┌──────┐  ┌──────┐  ┌──────┐
    │ Proj │  │ Proj │  │ Proj │
    │  4   │  │  5   │  │  6   │
    └──────┘  └──────┘  └──────┘

    [← Previous]    [Next →]
```
- Shows 6 projects per screen, arrows paginate

**Option C: Horizontal Scroll Strip**
```
    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
[←] │ Proj │ │ Proj │ │ Proj │ │ Proj │ [→]
    │  1   │ │  2   │ │  3   │ │  4   │
    └──────┘ └──────┘ └──────┘ └──────┘
```
- Shows 3-4 projects at once, arrows scroll horizontally
- Can swipe on mobile

**Select A, B, or C**: A

**Project card interaction**:
- [ ] Click card → Goes to project detail page
- [ ] **Flip card** - Image front, text back (flip on hover/click), then click to detail page
- [x] Hover shows overlay, click goes to detail page

### Project Categories

- **No categories** - Chronological or curated order only

### Number of Projects


- Number of projects: 16, based off the contents of C:\Users\ethan\OneDrive\Job Applications\New Portfolio
- Do you have all project content ready?
  - Partial (4 projects ready), the remaining already have content, it just needs to be reformatted. For the time being, the site will only include ~4ish projects, but should be easy to edit and expand upon


### Project Card Information

- Project thumbnail image
- Project title
- Year
- Brief description (1 sentence)
- Hover overlay with "View Project →"

### Filtering System

- **No filtering** - Remove filters entirely

---

## Individual Project Pages

### Project Page Structure

Define exact visual layout structure:

**Option 1: Traditional Portfolio Layout (Single column, centered)**
```
┌─────────────────────────────────────┐
│  Full-width Hero Image              │ ← 100vw × ___vh tall
├─────────────────────────────────────┤
│      [Centered max-width content]   │
│                                     │
│  Project Title (H1)                 │
│  Year • Location • Role (metadata)  │
│                                     │
│  Overview Text (2-3 paragraphs)     │
│  Max width: ___ch for readability   │
│                                     │
│  Image Grid (2-3 columns)           │
│  ┌────┐ ┌────┐ ┌────┐               │
│  │img │ │img │ │img │               │
│  └────┘ └────┘ └────┘               │
│                                     │
│  Drawings/Diagrams Section          │
│  Next/Previous Navigation           │
└─────────────────────────────────────┘
```

**Option 2: Grid-Integrated Layout (12-column with visible grid)**
```
┌─────────────────────────────────────┐
│ ┌───┬───┬───┬───┬───┬───┬───┬───┐   │
│ │   │ Hero Image (12 cols)      │   │ ← Grid visible
│ ├───┼───┼───┼───┼───┼───┼───┼───┤   │
│ │   │Title  │   │   │   │   │   │   │
│ ├───┼───┼───┼───┼───┼───┼───┼───┤   │
│ │   │Overview (8 cols)      │   │   │
│ ├───┼───┼───┼───┼───┼───┼───┼───┤   │
│ │Img│Img│Img│Img│Img│Img│Img│Img│   │
│ └───┴───┴───┴───┴───┴───┴───┴───┘   │
└─────────────────────────────────────┘
```

**Option 3: Alternating Image/Text**
```
┌─────────────────────────────────────┐
│  Hero Image (full width)            │
├─────────────────────────────────────┤
│ ┌─────────┐                         │
│ │ Large   │  Overview Text          │
│ │ Image   │  (wraps beside image)   │
│ │         │                         │
│ └─────────┘                         │
│            ┌─────────┐              │
│ Text       │ Image   │              │
│ Section    │         │              │
│            └─────────┘              │
└─────────────────────────────────────┘
```

**Select 1, 2, or 3**: 1

**Content max-width** (for readability on large screens):
- [x] No limit - Full width
- [ ] 1200px centered
- [ ] 1400px centered
- [ ] Other: _____px

### Project Page Sections

- Hero image
- Project title and metadata
- Project overview/summary
- Materials and methods
- Team and collaborators (optional)
- Image gallery
- Video/3D renders (optional)
- Drawings and diagrams
- Project timeline (optional)

### Project Image Galleries

Image gallery style:
- **Lightbox** - Click to enlarge

Image aspect ratios:
- **Flexible** - Mixed aspect ratios (portrait, landscape, square)


### Project Content Requirements

**CRITICAL FOR VISUAL CONSISTENCY**: Define exact image specifications

#### Thumbnail Images (Projects Grid)
- **Aspect ratio**: 3:2
- **Dimensions**:900×600
- **File size**: Max 150-300KB
- **Treatment**:
  - [ ] Crop to fit (may cut off content to fill space)
  - [ ] Contain (show full image, may have letterboxing)
  - [x] Cover (fill space, centered crop)
- **Border/Frame**:
  - [x] None (full bleed)
  - [ ] 1px border, color: _____
  - [ ] ___px border, color: _____

#### Hero Images (Project Detail Pages)
- **Aspect ratio**: 16:9
- **Dimensions**: 1920×1080
- **File size**: Max 500-800KB
- **Display height**: 80vh
- **Width**:
  - [x] Full viewport (100vw, edge-to-edge)
  - [ ] Contained (max _____px, centered)

#### Gallery Images (Project Detail Pages)
- **Aspect ratio strategy**:
  - [ ] **Strict** - All gallery images same ratio: ___:___
  - [x] **Flexible** - Mixed ratios allowed (landscape, portrait, square)
  - [ ] **Two formats** - Landscape (___:___) and Portrait (___:___)
- **Recommended dimensions**: 1200×800
- **File size**: Max 500KB per image
- **Grid columns**:
  - Desktop: 2-3
  - Tablet: 2
  - Mobile: 1
- **Image treatment**:
  - [ ] Plain (no effects)
  - [ ] Subtle drop shadow: `box-shadow: _____`
  - [ ] Border: ___px, color: _____
  - [x] Hover effect: saturates image

#### Diagrams/Drawings
- **Format**:
  - PNG (for line drawings, transparent backgrounds)
  - JPG (for rendered diagrams)
  - SVG (for vector graphics - best quality)
- **Dimensions**: flexible
- **Display**:
  - [x] Mixed with photos in gallery
  - [ ] Separate section below photos

**For each project you'll provide**:
   - 1 Thumbnail image
   - 1 Hero image
   - Minimum 6 gallery images
   - Diagrams/drawings

2. **Text Content**:
   - [ ] Project title
   - [ ] Year completed
   - [ ] Project type/category
   - [ ] Location (if applicable)
   - [ ] Your role
   - [ ] Project overview (_____ words, specify length)
   - [ ] Sections text (based on sections selected above)

3. **Metadata**:
   - [ ] Tags/keywords
   - [ ] Sustainability certifications (LEED, etc.) (optional)
   - [ ] Square footage / project scale (optional)
   - [ ] Budget range (optional)
   - [ ] Client name (optional)
   - [ ] Collaborators (optional)
   - [ ] Other: _________________

---

## About Page

### About Page Sections

Structure
- Personal introduction/bio
- Professional background (future)
- Design philosophy (future)
- Educational background
- Skills and expertise
- Values and approach (future)
- Interests outside design
- Profile photo
- Timeline/journey
- Awards and recognition
- Press/publications (Future)

### About Page Layout

About page visual style:
- **Single column** - Long-form reading experience


### Personal Branding Elements

How should you be presented on About page?
- [x] **Full name** - Ethan Shig Anderson


Profile photo style:
- Myself integrated into one of my projects (from Beavers Burden: I created a wearable gizmo, that I photographed myself wearing)

### Tone and Voice

Writing style for About page:
- **Professional** - Formal, polished tone


---

## Resume Page

### Resume Display Format

- **Traditional layout** - Standard resume formatting


### Resume Sections (based entirely off of uploaded resume)

1. Education
2. Work Experience
3. Extracurricular Activities 
4. Skills and Achievements


### Resume PDF

Download link to `assets/resume/Ethan-Anderson-Resume.pdf`

---

## Contact Page

### Contact Form Fields

 Name, Email, Subject, Message


### Contact Form Service

Web3Forms (free email service)


### Contact Information Display

What contact info should be visible?
- [x] Email address (clickable link)
- [x] Phone number
- [x] Location/city
- [x] LinkedIn profile
- [x] GitHub

Display style:
- **Direct links** - Email/phone visible on page


### Response Expectations

- No expectation messaging

---

## Typography System

### Font Family

Sato (custom font) - Regular, Medium, Bold, Slanted

### Type Scale

Fluid clamp() based sizing
- Base text: `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)`
- ESA letters: `clamp(3rem, 6vw, 5rem)` Bold
- Nav letters: `clamp(1.5rem, 3vw, 2.5rem)` Regular

### Font Weights

- Regular (400) for navigation
- Medium (500) for body text
- Bold (700) for ESA letters and headings

### Heading Hierarchy

**DECISION NEEDED**: Define heading styles:

**H1** (Page titles - e.g., "Project Name"):
- [ ] Size: `clamp(2.5rem, 5vw, 4rem)`
- [ ] Weight: 700
- [ ] Letter spacing: 0 
- [ ] Line height: 1.2
- [ ] Text transform: UPPERCASE
- [ ] Max width: None (full width)
- Margin bottom: 2 rem

**H2** (Section headings - e.g., "Overview", "Process"):
- [ ] Size: `clamp(1.75rem, 3vw, 2.5rem)`
- [ ] Weight: 700 
- [ ] Letter spacing: 0 
- [ ] Line height: 1.2 
- Margin top: 3 rem
- Margin bottom: 1.5 rem

**H3** (Subsections - e.g., "Materials", "Team"):
- [ ] Size: `clamp(1.25rem, 2vw, 1.5rem)`
- [ ] Weight: 500 
- Margin Bottom: 1 rem

**Body Text**:
- Size: Already defined - `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` ✓
- [ ] Line height: 1.8 
- [ ] Max width: 65-75 ch
- [ ] Paragraph spacing: 1em

**Captions/Metadata** (e.g., "2024 • Champaign, IL • Designer"):
- [ ] Size: 0.875rem
- [ ] Weight: 400
- [ ] Color: Grey
- [ ] Text transform: UPPERCASE
- [ ] Letter spacing: +0.02em

### Special Typography Elements

Typography details:
- **Mixed case** - Standard capitalization
- **Italic usage** - When to use Sato-RegularSlanted: use in accordance to academic standards.
- **Quotes/pullquotes** - Special styling for quotes: no
- **Lists** - Custom bullet/number styling: no

---

## Color Palette & Theming

### Base Color Palette

```css
/* Light mode */
--color-primary: #1a1a1a (black)
--color-bg: #fafafa (soft white)
--color-border:  #fafafa (soft white)

/* Dark mode */
--color-primary: #fafafa (soft white)
--color-bg: #1a1a1a (black)
--color-border: #1a1a1a (black)
```


**Consider adding utility grays**:
- [ ] Keep pure black/white only (no grays)
- [x] Add ONE mid-gray for subtle elements:  #666666
  - Use for: Captions, metadata, disabled form fields, placeholders, borders
- [ ] Add TWO grays (light + dark): _____ and _____ (suggest #999999 + #333333)

### Theme Toggle

Light/dark mode with Sun/Moon icons

### Color Application Strategy

How should colors be applied?

**Backgrounds**:
- Solid colors only


**Text**:
- High contrast always (pure black/white)


**Interactive elements** (buttons, links, cards):
- Filled backgrounds
- Hover state changes: flip reveals card in opposite theme

**Images**:
- Desaturated → color on hover (current)

---

## Grid System & Layout

### Base Grid Structure

**CLARIFICATION NEEDED** - Your choices conflict:
- You said: "Standard 12-column web grid (like Bootstrap)"
- You also said: "Unified grid navigation on every page"
- You also said: "Dashed background grid with 2X/1X/dotted lines (Build List inspired)"

**These are different systems. Choose ONE approach:**

**Option A: Architectural Grid Overlay** (Recommended based on Build List influence)
- [ ] Use standard **12-column responsive grid** for content layout (invisible, structural like Bootstrap)
- [ ] Add **decorative architectural grid overlay** (visible dashed lines inspired by Build List)
- [ ] Grid lines appear as visual element OVER the layout (3 line weights as you specified)
- [ ] 12×8 flip card grid is **landing page only**
- [ ] Other pages use traditional navbar + decorative grid background

**Option B: Full Grid Navigation Everywhere**
- [ ] **12×8 flip card grid** appears on every page (not just landing)
- [ ] Content sits INSIDE grid cells
- [ ] Navigation words always visible in grid on all pages
- [ ] More experimental, more complex to implement

**Option C: Hybrid Approach**
- [ ] Landing page: Full 12×8 flip card grid
- [ ] Other pages: Traditional layout with subtle grid lines (graph paper background style)
- [ ] Navigation: Traditional navbar (not grid-based navigation)

**Select A, B, or C**: C


### Spacing System

Base: **8px** (0.5rem) ✓

Define exact spacing values using modular scale:

**Spacing Scale** (multiply base × factor):
- **xs**: 0.5× = **4px** (0.25rem)
- **sm**: 1× = **8px** (0.5rem)
- **md**: 1.5× = **12px** (0.75rem)
- **lg**: 2× = **16px** (1rem)
- **xl**: 3× = **24px** (1.5rem)
- **2xl**: 5× = **40px** (2.5rem)
- **3xl**: 8× = **64px** (4rem)
- **4xl**: 12× = **96px** (6rem)

**Apply spacing to elements - select which size to use:**

**Between major sections** (hero → overview → gallery → next section):
- Choose: xs / sm / md / lg / xl / 2xl / **3xl** / **4xl** (recommend 3xl or 4xl)
- Selection: 4xl

**Within sections** (between paragraphs, subsections):
- Choose: xs / sm / md / **lg** / **xl** / 2xl / 3xl (recommend lg or xl)
- Selection: xl

**Image grid gaps** (space between gallery images):
- Choose: xs / sm / md / lg / **xl** / **2xl** / 3xl (recommend xl or 2xl)
- Selection: 2xl

**Padding inside cards/containers** (content padding):
- Choose: xs / sm / md / lg / **xl** / **2xl** / 3xl (recommend xl or 2xl)
- Selection: 2xl


### Grid Lines Visibility

Dashed background grid lines visible throughout site

Grid visualization (https://buildlist.org/ inspired):
- Visible grid, but use of different line types for different empheses
1. 2X thick line. - used to seperate Nav bar
2. 1X thick line - applied as a border around cells containing unified content (ex 3x1 cell would have a this border surrounding the 3x1 cell, not subdividing it)
3. thin dotted line - used where content doesn't need to be differentiated, but still implys the grid

### Component Borders

Solid 1px borders for UI components (cards, buttons, forms)


### Section Dividers

Strong 1px horizontal lines between sections (locomotive.ca inspired)


---

## Animations & Interactions

### Flip Card Animations

- Wave: Sequential cell flip animation

### Hover Effects

- Image desaturation → color

### Page Transitions

Grid-based page transition overlay (cells flip in random order)
- **Keep grid transition** - Current cell flip effect


### Loading States

- **No loader** - Fast enough not to need it

### Scroll-Based Animations

- Elements slide from side/bottom


### Micro-Interactions

Small interactive details:
- Button press animations - none
- Form field focus effects - none
- Link underline animations - none
- Icon hover effects - none
- Cursor custom styling - none
- Sound effects (optional) - none
- Haptic feedback (mobile) - none

### Animation Performance

Animation approach:
- [ ] **Minimal animations** - Performance-first, limited effects only

---

## Responsive Design Breakpoints

### Target Devices

Which devices are priority?
1. _____ **Desktop** (1920px+)
2. _____ **Laptop** (1366px-1920px)
3. _____ **Mobile landscape** (480px-768px)
4. _____ **Mobile portrait** (320px-480px)


### Breakpoint System

- Desktop: default
- Tablet: ≤1024px
- Mobile: ≤768px
- Small: ≤480px


### Mobile Navigation

How should navigation work on mobile?

**Landing page grid**:

- **Bottom tab bar** - iOS-style navigation


**Other pages navbar**:

- **Bottom tab bar** - iOS-style navigation
- tab bar contents use same items (Projects, About, Resume, Contact)
- design: text only
- landing page: replace grid with tab bar

### Mobile-Specific Features

Mobile enhancements:
- Touch gestures (swipe between projects)
- [ ] Bottom sheet for project details
- [ ] Mobile-specific layouts
- [ ] App-like experience
- [ ] Mobile-optimized forms (larger inputs)


### Image Handling on Mobile

Mobile image strategy:
- **Compressed mobile** - Lower quality for mobile


---

## Content Strategy

### Project Content

**For each of your 4 projects** (that I'll start off with, many more to come), prepare:

**Images**:
- [ ] Thumbnail (___×___ px): Project _____
- [ ] Hero image (___×___ px): Project _____
- [ ] Gallery images: Project _____
- [ ] Diagrams/drawings: Project _____


**Text** (specify word counts):
- [ ] Project title: Project _____
- [ ] Tagline (_____ words): Project _____
- [ ] Overview (_____ words): Project _____


**Metadata**:
- [ ] Year: Project _____
- [ ] Type/Category: Project _____
- [ ] Location (optional): Project _____
- [ ] Role (optional): Project _____
- [ ] Duration: Project _____
- [ ] Team size (optional): Project _____
- [ ] Skills used: Project _____

### About Page Content

About page content length:
- **Medium** - 400-600 words


**Content to prepare**:
- [ ] Bio/introduction (_____ words)
- [ ] Design philosophy (_____ words)
- [ ] Background (_____ words)
- [ ] Current focus (_____ words)
- [ ] Profile photo (high-res)
- [ ] Additional images (if applicable)

### Resume Content

Resume update frequency:
- Resume is current (within last 1 months)


**Content to prepare**:
- [ ] Updated PDF resume
- [ ] All experience descriptions
- [ ] Skills list (categorized)
- [ ] Education details
- [ ] Certifications/awards

### Copy Tone & Voice

Writing style across site:
- **Professional** - Formal, industry-standard language
- **Concise** - Minimal text, visuals-first
- **Educational** - Explain process and thinking

### SEO & Metadata

SEO priority level:
- **Low** - Minimal SEO (personal portfolio, not public search)

---

## Technical Implementation

### Technology Stack

**Current**: Vanilla HTML, CSS, JavaScript

Should we maintain vanilla approach or introduce framework?
- **Other**: I don't know enough about coding websites to make a well-informed decision. I'd like to be able to easily add/edit/remove content from my website, so it should be possible for someone with minimal coding experience to do those things.

### File Organization

```
portfolio-website/
├── index-landing.html
├── index.html
├── about.html
├── resume.html
├── contact.html
├── css/
├── js/
├── images/
├── fonts/
├── projects/
└── assets/
```


### CSS Architecture

**Current approach**: Multiple CSS files per page/feature

CSS strategy:
- [x] **Other** - I'm not sure what other strategies entail. Again, I should be able to make modifications to the website, so while I dont need to necessarily understand every nut and bolt, I need to be able to make edits.


### JavaScript Architecture

**Current**: Vanilla JS files per feature

JavaScript approach:
- **Other** - I'm not sure what other strategies entail. Again, I should be able to make modifications to the website, so while I dont need to necessarily understand every nut and bolt, I need to be able to make edits.

### Forms & Backend

Web3Forms for contact form


---

## Performance & Optimization

### Performance Targets

Performance priority:

- [ ] **Moderate** - Acceptable load times, minimal optimization


### Image Optimization

Image optimization strategy:
- **Manual optimization** - Compress before upload (TinyPNG, etc.)
- **Build-time optimization** - Auto-optimize during build


### Code Optimization

**DECISION NEEDED**: Code optimization:
- [ ] Minify HTML/CSS/JS
- [ ] Remove unused CSS (PurgeCSS)
- [ ] Bundle JavaScript modules
- [ ] Critical CSS inlining
- [ ] Defer non-critical JS
- [ ] Font subsetting (load only needed characters)
- [x] Other: Not sure what most of these are, apply whatever seems fit for the scope of this project.

### Caching Strategy

Caching approach:
- **No special caching** - Rely on hosting defaults

---

## Accessibility Requirements

### Accessibility Priority

WCAG compliance level:
- **Best effort** - Accessibility improvements without formal compliance


### Accessibility Features

Select all accessibility features to implement:
- [ ] Keyboard navigation (tab, enter, arrow keys)
- [ ] Screen reader support (ARIA labels, semantic HTML)
- [ ] Heading hierarchy (proper H1-H6 usage)
- [ ] Link descriptions (avoid "click here")


### Testing Approach

Accessibility testing:
- **None** - Skip accessibility testing

---

## Browser Support

### Target Browsers

Which browsers must be supported?
**Desktop**:
- Chrome (last _____ versions)
- Firefox (last _____ versions)
- Safari (last _____ versions)
- Edge (last _____ versions)

**Mobile**:
- iOS Safari (last _____ versions)
- Android Chrome (last _____ versions)

### Fallback Strategy

How to handle unsupported browsers:
- **No fallbacks** - Modern browsers only, no support for old browsers


### CSS Feature Support

**Current features used**:
- CSS Grid
- CSS Custom Properties (variables)
- 3D Transforms
- Flexbox
- clamp()

Feature support approach:
- **Modern only** - Use latest features, no fallbacks (current)


---

## Deployment Strategy

### Hosting Platform

Where should the site be hosted?
- **GitHub Pages** - Free with GitHub repo


### Domain Strategy

Domain name:
-  **Use subdomain** - Free hosting subdomain (e.g., esa.netlify.app)


### Deployment Process

How should updates be deployed?
- **Git-based** - Push to GitHub, auto-deploy (recommended)


### Version Control

**Current**: Git repo exists (.git folder present)

Git/GitHub strategy:
- [ ] **Private repo** - Code kept private

### Launch Checklist

**Before going live, complete**:
- [ ] All content finalized (text, images)
- [ ] Contact form tested and working
- [ ] Resume PDF uploaded and downloadable
- [ ] All links tested (internal and external)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed
- [ ] Favicon created and added
- [ ] Performance testing passed
- [ ] Typos/grammar checked
- [ ] 404 page created
- [ ] Site submitted to search engines
- [ ] Domain/SSL configured
- [ ] Backup created

---

## Future Enhancements

### Phase 2 Features

Features to add after initial launch:

**Content additions**:

- [ ] 3D model viewer
- [ ] Publications/press


**Technical improvements**:
- [ ] Multi-language support
- [ ] Project search functionality

**Animations** (archived for later):
- [ ] ESA glow animation - Implement light tracing effect
- [ ] Grid transition animation on landing
- [ ] Advanced scroll-based animations
- [ ] Project transition effects

### Long-Term Vision

What's the 1-2 year vision for this site?
- [ ] **Portfolio only** - Keep as showcase of work
- [ ] **Academic** - Emphasize research, publications, teaching

---

## Decision Summary & Next Steps

### Critical Decisions Still Needed (Priority 1)
**These MUST be decided before development can begin**:

#### Grid System & Layout
1. [ ] **Base Grid Approach** (Section: Grid System) - Choose Option A, B, or C
   - Clarify: Bootstrap layout + decorative grid? OR Full 12×8 navigation grid everywhere?

#### Typography (Section: Typography System)
2. [ ] **H1 Styling** - Size (clamp values), weight, spacing, transform
3. [ ] **H2 Styling** - Size, weight, letter spacing, margins
4. [ ] **H3 Styling** - Size, weight, margins
5. [ ] **Body Text** - Line height, max width (ch), paragraph spacing
6. [ ] **Captions/Metadata** - Size, weight, color (pure B&W or add gray?)

#### Spacing System (Section: Grid System)
7. [ ] **Section spacing** - Choose xs/sm/md/lg/xl/2xl/3xl/4xl
8. [ ] **Paragraph spacing** - Choose size
9. [ ] **Image grid gaps** - Choose size
10. [ ] **Container padding** - Choose size

#### Projects Display (Section: Projects Section)
11. [ ] **Projects Grid Layout** - Choose Option A (slideshow), B (3-column), or C (horizontal scroll)
12. [ ] **Project Card Interaction** - Click direct? Flip card? Overlay?

#### Project Pages (Section: Individual Project Pages)
13. [ ] **Project Page Layout** - Choose Option 1 (traditional), 2 (grid-integrated), or 3 (alternating)
14. [ ] **Content Max Width** - None, 1200px, 1400px, other?

#### Image Specifications (Section: Project Content Requirements) - CRITICAL
15. [ ] **Thumbnail aspect ratio** - 3:2? 4:3? 16:9? 1:1?
16. [ ] **Thumbnail dimensions** - ___×___ px
17. [ ] **Thumbnail file size** - Max ___KB
18. [ ] **Thumbnail treatment** - Crop/contain/cover?
19. [ ] **Thumbnail borders** - None, 1px, other?
20. [ ] **Hero aspect ratio** - 16:9? 21:9? Other?
21. [ ] **Hero dimensions** - ___×___ px
22. [ ] **Hero display height** - ___vh
23. [ ] **Hero width** - Full viewport or contained?
24. [ ] **Gallery aspect ratio** - Strict same ratio? Flexible? Two formats?
25. [ ] **Gallery dimensions** - ___×___ px
26. [ ] **Gallery columns** - Desktop/tablet/mobile
27. [ ] **Gallery image treatment** - Plain, shadow, border, hover?
28. [ ] **Diagram format** - PNG, JPG, or SVG?
29. [ ] **Min gallery images per project** - How many?

#### Landing Page Animation (Section: Landing Page)
30. [ ] **Grid draw duration** - Total ___ms
31. [ ] **Grid draw pattern** - Sequential, simultaneous, radial, custom?
32. [ ] **Grid line animation** - Width expand, fade, or both?
33. [ ] **ESA flip timing** - Delays and durations
34. [ ] **Flip order** - Sequential or e+s together?
35. [ ] **Struggle attempts** - How many failed flips?
36. [ ] **Struggle timing** - Degrees and ms for each attempt
37. [ ] **Navigation reveal** - On backs, fade in, or hover only?
38. [ ] **Skip option** - Allow skip? Auto-skip repeats?

#### Easter Egg (Section: Landing Page)
39. [ ] **Easter egg concept** - Choose Option 1-5 or custom
40. [ ] **Egg cell location** - Random, fixed, or rotating?
41. [ ] **Egg icon style** - Bouncing, pulse, or custom?
42. [ ] **Return method** - Back button, close X, auto-return?

### Important Decisions (Priority 2)
**Should be decided before development is 50% complete**:

1. [ ] **Animation Strategy**: Define animation complexity and styles
2. [ ] **Responsive Approach**: Confirm mobile strategies
3. [ ] **Theme System**: Finalize light/dark/other themes
4. [ ] **About Page Content**: Prepare bio, philosophy, background
5. [ ] **Resume Format**: Decide on flip cards vs traditional
6. [ ] **Performance Targets**: Set optimization goals
7. [ ] **Accessibility Level**: Choose WCAG compliance level

### Nice-to-Have Decisions (Priority 3)
**Can be decided during or after initial development**:

1. [ ] **Future Features**: Plan Phase 2 enhancements
2. [ ] **SEO Strategy**: Define optimization approach
3. [ ] **Analytics**: Choose tracking tools
4. [ ] **Browser Support**: Define exact version support
5. [ ] **Advanced Interactions**: Micro-interactions, scroll effects

---

## Using This Document

### How to Work Together on This Plan

**Phase 1: Decision Making** (We are here)
1. Review each section of this document
2. Fill in all **DECISION NEEDED** items with your choices
3. Add any custom requirements or specifications
4. Add notes, questions, or ideas in comments

**Phase 2: Content Preparation**
1. Gather all project images, text, and metadata
2. Prepare About page content
3. Update resume and create PDF
4. Collect any additional assets (logos, icons, etc.)

**Phase 3: Refinement**
1. Review decisions together
2. Clarify any ambiguities
3. Prioritize features if needed
4. Create final specification document

**Phase 4: Handoff for Execution**
1. Mark document as "Execution Ready"
2. Transfer to development phase
3. Build site according to specifications

### How to Mark Your Decisions

Use the checkboxes to indicate your choices:
- [x] **Selected option** - Check the box for chosen options
- Add text where requested: _________________ → Your answer here
- Add notes below any section as needed

### Questions to Ask Yourself

As you work through this document, consider:
- What is the primary purpose of this portfolio?
- Who is my target audience?
- What makes my work unique?
- What story do I want to tell?
- How much time can I dedicate to content creation?
- What is my technical comfort level?
- What is my budget (if any)?
- When do I need this site live?

---

## Document Status

**Current Status**: 🟡 **In Planning - Awaiting Decisions**

**Progress Tracking**:
- [ ] Section 1-5: Core Structure (Critical)
- [ ] Section 6-9: Page Details (Important)
- [ ] Section 10-13: Visual Design (Important)
- [ ] Section 14-15: Content & Technical (Important)
- [ ] Section 16-20: Optimization & Future (Nice-to-Have)

**When all critical decisions are complete**:
- [ ] Mark status as: 🟢 **Ready for Execution**
- [ ] Create final build checklist
- [ ] Begin development

---

## Notes & Ideas

**Use this space for any additional thoughts, questions, or requirements**:

```
[Your notes here]




```

---

**Last Updated**: 2025-11-29
**Created By**: Claude Code + Ethan Anderson
**Document Purpose**: Master planning specification for portfolio website rebuild

---

*This is a living document. Update it as decisions are made, requirements change, or new ideas emerge. The more detailed and specific this plan becomes, the smoother the execution phase will be.*
