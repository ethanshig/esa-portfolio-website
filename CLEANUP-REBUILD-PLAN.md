# CLEANUP & REBUILD PLAN

**Status**: Awaiting Your Approval
**Date**: 2025-11-29

---

## Current Status Assessment

### ✅ Working Pages (Keep & Update)
1. **old-index-landing.html** - Working grid landing page
2. **projects-new.html** - almost working, just missing NavBar
3. **contact.html** - Working contact form with grid layout
4. **easter-egg.html** - Working easter egg page
5. **projects.html** - works. Would like for **projects-new.html**s sliding carosel to be the first piece of content on the page, followed by **projects.html**s grid/tile view of projects to be below it, visible after scrolling past the carosel. 

### ❌ Non-Working Pages (Delete)
- index.html (new landing - didn't work)
- about.html (old version)
- resume.html (old flip cards version)
- projects-grid.html (duplicate)
- test-landing.html (test file)
- test-flip-cards.html (test file)

### Current Color Palette (Needs Update)
**Light Mode:**
- Primary: #1a1a1a (already correct - dampened black) ✓
- Background: #fafafa (soft white) ✓
- Text light: #737373 (medium gray) ✓

**Dark Mode:**
- Background: #0a0a0a (needs update to #1a1a1a per MASTER-PLAN)
- Primary: #fafafa (soft white) ✓
- Text light: #737373 (medium gray) (needs update)
---

## THE PLAN

### Phase 1: File Cleanup

**DELETE these files:**
```
/index.html
/about.html
/resume.html
/projects-grid.html
/test-landing.html
/test-flip-cards.html
/project-template.html (if it exists from new build)
```

**KEEP & WORK WITH:**
```
/old-index-landing.html → Will rename to index.html
/projects.html ✓
/contact.html ✓
/easter-egg.html ✓
```

**DECISION NEEDED**: Any files listed for deletion that you want to keep?
- [ ] Yes, keep: _________________ (specify which files)
- [x] No, delete all listed files

---

### Phase 2: Landing Page Updates

**File: old-index-landing.html → index.html**

**Changes needed:**
1. ✅ **Rename** old-index-landing.html to index.html (make it the main landing)

2. ✅ **Add Easter Egg to cell (3,12)** in js/landing-simple.js:
   - Cell at row 12, column 3
   - Bouncing egg animation on flip
   - Links to easter-egg.html

3. ✅ **Update color palette** in css/landing-simple.css and css/style.css:
   - Ensure dark mode background uses #1a1a1a (not #0a0a0a)
   - Verify all colors match MASTER-PLAN

**No other changes** - keep existing grid, animations, flip behavior

**DECISION NEEDED**: Easter egg cell location confirmed?
- cell (row 12, column 3) 


---

### Phase 3: Color Palette Global Update

**Update in css/style.css:**

**Dark mode colors** (change only what's incorrect):
```css
[data-theme="dark"] {
    --color-bg: #1a1a1a;        /* Change from #0a0a0a */
    --color-bg-alt: #2a2a2a;     /* Adjust slightly lighter */
    --color-border: #333333;     /* Adjust border for visibility */
    /* Keep rest as is */
}
```

**Add utility gray** per MASTER-PLAN:
```css
:root {
    --color-utility-gray: #666666;  /* For captions, metadata */
}
```

**Verify light mode** (should already be correct):
```css
--color-primary: #1a1a1a;  ✓
--color-bg: #fafafa;       ✓
--color-text-light: #737373; ✓
```

**DECISION NEEDED**: Approve color updates?
- [x] Yes, proceed with these exact color values
- [ ] No, modify: _________________ (specify changes)

---

### Phase 4: Build New About Page

**File: /about.html (create new)**

**Structure** (based on projects.html + contact.html pattern):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Same head as projects.html/contact.html -->
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/grid-system.css">
    <link rel="stylesheet" href="css/grid-content.css">
    <link rel="stylesheet" href="css/page-transition.css">
    <!-- NO separate about.css needed, use grid-content.css -->
</head>
<body>
    <!-- Same navbar as projects.html/contact.html -->

    <main class="page-grid-wrapper">
        <div class="page-grid">
            <!-- Hero Section (grid-span-full) -->
            <section class="grid-item grid-span-full grid-margin-vertical">
                <h1 class="page-title">About Me</h1>
                <p class="page-subtitle">Ethan Shig Anderson</p>
            </section>

            <!-- Profile Photo (grid-left-half) -->
            <section class="grid-item grid-left-half">
                <img src="images/profile-photo.jpg" alt="Ethan Anderson" class="profile-photo">
                <!-- Photo from Beavers Burden project -->
            </section>

            <!-- Bio Text (grid-right-half) -->
            <section class="grid-item grid-right-half">
                <h2 class="section-heading">Introduction</h2>
                <p><!-- Personal introduction text --></p>
                <p><!-- Design philosophy --></p>
            </section>

            <!-- Education (grid-left-half) -->
            <section class="grid-item grid-left-half grid-margin-vertical">
                <h2 class="section-heading">Education</h2>
                <!-- Education details -->
            </section>

            <!-- Skills (grid-right-half) -->
            <section class="grid-item grid-right-half grid-margin-vertical">
                <h2 class="section-heading">Skills & Expertise</h2>
                <!-- Skills list -->
            </section>

            <!-- Interests (grid-span-full) -->
            <section class="grid-item grid-span-full grid-margin-vertical">
                <h2 class="section-heading">Interests Outside Design</h2>
                <!-- Interests text -->
            </section>
        </div>
    </main>

    <!-- Same footer/scripts as projects.html/contact.html -->
</body>
</html>
```

**Uses existing CSS classes:**
- `.page-grid-wrapper`, `.page-grid` (from grid-content.css)
- `.grid-item`, `.grid-left-half`, `.grid-right-half`, `.grid-span-full`
- `.page-title`, `.page-subtitle`, `.section-heading`
- Same navbar styling from style.css

**Content needed from you:**
- Profile photo (Beavers Burden image)
- Bio text (400-600 words per MASTER-PLAN)
- Education details
- Skills list
- Interests text

**DECISION NEEDED**: About page content approach?
- [ ] Use placeholder Lorem Ipsum text (you'll replace later)
- [ ] Leave empty with HTML comments indicating what goes where
- [ ] Wait for you to provide actual content before building page

**DECISION NEEDED**: About page sections - keep all listed above?
- [ ] Yes, include all sections (Hero, Photo, Bio, Education, Skills, Interests)
- [x] Remove sections: interests (specify which)
- [ ] Add sections: _________________ (specify what to add)

---

### Phase 5: Build New Resume Page

**File: /resume.html (create new)**

**Structure** (traditional layout, NOT flip cards):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Same head as other pages -->
</head>
<body>
    <!-- Same navbar -->

    <main class="page-grid-wrapper">
        <div class="page-grid">
            <!-- Hero with PDF download -->
            <section class="grid-item grid-span-full grid-margin-vertical">
                <h1 class="page-title">Resume</h1>
                <p class="page-subtitle">
                    <a href="assets/resume/Ethan-Anderson-Resume.pdf"
                       download
                       class="download-btn">
                        Download PDF Resume
                    </a>
                </p>
            </section>

            <!-- Education Section (left half) -->
            <section class="grid-item grid-left-half">
                <h2 class="section-heading">Education</h2>
                <div class="resume-item">
                    <h3>University of Illinois Urbana-Champaign</h3>
                    <p class="resume-meta">Bachelor of Science in Architecture • Expected 2026</p>
                    <!-- Details -->
                </div>
            </section>

            <!-- Work Experience (right half) -->
            <section class="grid-item grid-right-half">
                <h2 class="section-heading">Work Experience</h2>

                <div class="resume-item">
                    <h3>RATIO Architects</h3>
                    <p class="resume-meta">Design Intern • Summer 2024</p>
                    <!-- Details -->
                </div>

                <div class="resume-item">
                    <h3>Allerton Park & Retreat Center</h3>
                    <p class="resume-meta">Position • Dates</p>
                    <!-- Details -->
                </div>

                <div class="resume-item">
                    <h3>Para La Tierra</h3>
                    <p class="resume-meta">Position • Dates</p>
                    <!-- Details -->
                </div>
            </section>

            <!-- Extracurricular (left half) -->
            <section class="grid-item grid-left-half grid-margin-vertical">
                <h2 class="section-heading">Extracurricular Activities</h2>

                <div class="resume-item">
                    <h3>Kingfisher Composting</h3>
                    <!-- Details -->
                </div>

                <div class="resume-item">
                    <h3>Goodwill Ambassador</h3>
                    <!-- Details -->
                </div>
            </section>

            <!-- Skills (right half) -->
            <section class="grid-item grid-right-half grid-margin-vertical">
                <h2 class="section-heading">Skills & Achievements</h2>

                <div class="resume-item">
                    <h3>Software & Tools</h3>
                    <ul>
                        <li><!-- Software list --></li>
                    </ul>
                </div>

                <div class="resume-item">
                    <h3>Honors & Recognition</h3>
                    <ul>
                        <li><!-- Awards list --></li>
                    </ul>
                </div>
            </section>
        </div>
    </main>

    <!-- Same footer/scripts -->
</body>
</html>
```

**New CSS needed** (minimal, add to style.css or create resume.css):
```css
.resume-item {
    margin-bottom: var(--spacing-xl); /* 24px */
}

.resume-item h3 {
    font-size: clamp(1.25rem, 2vw, 1.5rem);
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.resume-meta {
    font-size: 0.875rem;
    color: var(--color-utility-gray);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin-bottom: 1rem;
}

.download-btn {
    display: inline-block;
    padding: 1rem 2rem;
    background: var(--color-primary);
    color: var(--color-bg);
    text-decoration: none;
    border: 1px solid var(--color-primary);
    transition: all 0.3s ease;
}

.download-btn:hover {
    background: var(--color-bg);
    color: var(--color-primary);
}
```

**Content needed from you:**
- Copy all text from existing resume PDF
- Ensure all sections match current resume

**DECISION NEEDED**: Resume page content approach?
- [ ] Use placeholder text from MASTER-PLAN resume structure (you'll replace later)
- [ ] Leave empty with HTML comments
- [ ] Wait for you to provide actual resume content before building page
- [x] Use content available in Ethan-Anderson-Resume.pdf available in the assets folder 

**DECISION NEEDED**: Resume CSS location?
- [ ] Add resume styles to existing style.css
- [ ] Create separate css/resume.css file
- [ ] No preference, you decide

---

### Phase 6: Update All Navigation Links

**Update navbar in all files to link to correct pages:**
```html
<li><a href="index.html">Home</a></li>
<li><a href="projects.html">Projects</a></li>
<li><a href="about.html">About</a></li>
<li><a href="resume.html">Resume</a></li>
<li><a href="contact.html">Contact</a></li>
```

**Files to update:**
- index.html (renamed from old-index-landing)
- projects.html
- about.html (new)
- resume.html (new)
- contact.html
- easter-egg.html (add back button if not present)

**DECISION NEEDED**: Navigation label for landing page?
- [ ] "Home" (as shown above)
- [ ] "esa" (your brand initials)
- [ ] Leave it blank (just logo)
- [ ] Other: _________________

---

## Implementation Checklist

### Phase 1: Cleanup
- [ ] Delete non-working files
- [ ] Keep working files
- [ ] Verify no files accidentally deleted

### Phase 2: Landing Page
- [ ] Rename old-index-landing.html → index.html
- [ ] Add easter egg to cell (12,3) in js/landing-simple.js
- [ ] Implement daily rotation logic
- [ ] Add bouncing egg animation
- [ ] Update dark mode background color

### Phase 3: Colors
- [ ] Update dark mode bg to #1a1a1a in css/style.css
- [ ] Add --color-utility-gray: #666666
- [ ] Verify all color variables match MASTER-PLAN
- [ ] Test light/dark theme toggle

### Phase 4: About Page
- [ ] Create new about.html using grid-content.css pattern
- [ ] Use same structure as contact.html
- [ ] Add content (placeholder or actual)
- [ ] Add profile photo
- [ ] Test responsive layout

### Phase 5: Resume Page
- [ ] Create new resume.html using grid-content.css pattern
- [ ] Traditional layout (no flip cards)
- [ ] PDF download button
- [ ] Add resume-specific CSS
- [ ] Add content (placeholder or actual)
- [ ] Test responsive layout

### Phase 6: Navigation
- [ ] Update navbar links in all 6 pages
- [ ] Ensure logo links to index.html
- [ ] Update active states for each page
- [ ] Test all navigation paths

### Phase 7: Testing
- [ ] Test landing page animation
- [ ] Test easter egg discovery and link
- [ ] Test theme toggle on all pages
- [ ] Test navigation on all pages
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Verify all colors match specification

---

## What You'll Need to Provide After Build

1. **Profile photo** for about page (from Beavers Burden project)
2. **About page text** (bio, education, skills, interests) - 400-600 words
3. **Resume content** (copy from your current PDF)
4. **Project images** when ready to add real projects to projects.html

---

## Files Summary After Completion

**Final file structure:**
```
/index.html (landing page with easter egg - renamed from old-index-landing)
/projects.html (existing, working, updated navbar)
/about.html (NEW - grid layout)
/resume.html (NEW - traditional layout)
/contact.html (existing, working, updated navbar)
/easter-egg.html (existing, working, updated navbar)
/css/style.css (updated colors)
/css/grid-content.css (existing, used by new pages)
/js/landing-simple.js (updated with easter egg)
```

**Deleted files:**
- index.html (new landing that didn't work)
- projects-new.html (new slideshow that didn't work)
- about.html (old version)
- resume.html (old flip cards version)
- projects-grid.html (duplicate)
- test-landing.html (test file)
- test-flip-cards.html (test file)

---

## Questions & Decisions Summary

Before I can proceed, please answer these decisions:

1. **File Cleanup**: Delete all listed files, or keep any? Delete listed files

2. **Easter Egg Location**: Confirm cell (row 3, column 12)? No, row 12, column 3

3. **Colors**: Approve the exact color values listed in Phase 3? Yes

4. **About Page Content**: Use placeholder, leave empty, or wait for content? Use placeholder

5. **About Page Sections**: Keep all sections or modify? keep

6. **Resume Page Content**: Use placeholder, leave empty, or wait for content? use the resume I've already uploaded

7. **Resume CSS**: Add to style.css or create separate resume.css? idc

8. **Navigation Label**: "Home", "esa", blank, or other? esa

9. **Overall Plan**: Approve this plan as-is, or request changes? yes

---

## Notes

- All new pages will use the **exact same visual style** as projects.html and contact.html
- Grid layout, navbar, footer, theme toggle all consistent
- Simple, maintainable code using existing CSS classes
- Easy for you to update content later

---

**Mark your decisions above, then let me know when you're ready for me to execute this plan.**

**Last Updated**: 2025-11-29
**Status**: Awaiting Your Approval
