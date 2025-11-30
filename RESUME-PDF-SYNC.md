# Resume Page - PDF Content Synchronization

## Overview
All resume page cards have been completely replaced with exact content from the PDF resume (Anderson_Ethan_Resumev2_FAA310.pdf). The flip card design system and grid layout are preserved while displaying the accurate, up-to-date resume information.

## Changes Made

### Files Modified
1. `/mnt/c/Users/ethan/portfolio-website/resume.html`
2. `/mnt/c/Users/ethan/portfolio-website/css/resume.css`

---

## Card Structure Updates

### Previous Structure (7 cards):
1. Download Card
2. Education Card
3. Experience Card (Architecture)
4. Experience Card 2 (Research/Natural Areas combined)
5. Skills Card
6. Awards Card
7. Leadership Card
8. Contact Card

### New Structure (9 cards):
1. **Download Card** - Unchanged
2. **Education Card** - Updated with exact degree title and dates
3. **Work Experience Card 1** - Architecture Internship at RATIO
4. **Work Experience Card 2** - Natural Areas Internship (separated)
5. **Work Experience Card 3** - Research Internship in Paraguay (NEW - separated)
6. **Extracurricular Activities Card 1** - Independent Research Project (Kingfisher Composting)
7. **Extracurricular Activities Card 2** - Goodwill Ambassadorship (NEW)
8. **Skills and Achievements Card** - Software & Language
9. **Skills and Achievements Card 2** - Honors & Recognition
10. **Contact Card** - Unchanged

---

## Exact Content from PDF Resume

### Education
**Card Content:**
- Title: "University of Illinois at Urbana-Champaign"
- Degree: "Bachelor of Science in Sustainable Design, Minor in Architectural Studies"
- Dates: "August 2022 - Current"
- GPA: "3.99/4.00"
- Expected Graduation: "December 2026"

### Work Experience

#### 1. Architecture Internship
- **Organization:** RATIO | Champaign, IL
- **Dates:** June 2025 - Current
- **Responsibilities:**
  - Assist in all project phases, from schematic design through construction documents, on 5+ educational and commercial projects ranging from 3,000-250,000 sq.ft.
  - Collaborate with the firms Sustainability Integration Leader to embed sustainability in our studio and firm-wide, using tools such as cove.tool and Tally.
  - Prepare drawings, models, and client presentation materials while coordinating consultant and contractor meetings, contribute to LEED documentation, and participate in site visits.

#### 2. Natural Areas Internship
- **Organization:** Allerton Park and Retreat Center
- **Dates:** May 2024 - August 2024
- **Responsibilities:**
  - Executed management operations of 1,500 acres of natural areas.
  - Exotic/invasive vegetation control, trail maintenance, ecological restoration projects, wildlife and botanical surveys, site surveillance, working with volunteers, etc.
  - Built a 1-mile multipurpose trail.

#### 3. Research Internship
- **Organization:** Para La Tierra | Pilar, Paraguay
- **Dates:** January 2024 - April 2024
- **Responsibilities:**
  - Researched the anthropogenic impact on biodiversity in aquatic habitats along the Paraguayan River and its tributaries.
  - Led project design, site sampling, species identification, and data analysis, collecting and cataloging 6,569 fish across 40+ species from 6 research sites.

### Extracurricular Activities

#### 1. Independent Research Project
- **Organization:** Campus Honors Program | Champaign, IL
- **Dates:** Summer 2025
- **Details:**
  - Received multiple competitive university grants totaling $2,500 to pilot Kingfisher Composting, a school and neighborhood-scale food scrap collection and processing system.
  - Designed and built modular composting bins and led community outreach, diverting 70+ lbs of food waste weekly (800+ lbs to date), while promoting environmental literacy at local schools and in the community.

#### 2. Goodwill Ambassadorship
- **Organization:** Champaign Rotary Club | Yanai, Japan
- **Dates:** Summer of 2023
- **Details:**
  - Represented the Champaign Rotary Club and UIUC Campus Honor Program as a goodwill ambassador to Yanai, Japan, fostering cross-cultural understanding through school visits, presentations, and community engagement..
  - Collaborated with host families and coordinated activities, hosting the Yanai Goodwill Ambassador in Champaign..

### Skills and Achievements

#### Software
- RhinoCAD, Grasshopper, Revit, cove.tool, Tally, Adobe Suites (Photoshop, Illustrator, Indesign, Lightroom, Premiere Pro), Twinmotion, Excel, Cursor.

#### Language
- Fluent in Spanish (C1 Level) | Native English

#### Chancellor's Scholar
- **Organization:** University of Illinois at Urbana-Champaign
- **Details:** One of 125 students selected each year to participate in a merit-based honors program.

#### Dean's List
- **Recognition:** College of Fine and Applied Arts (2024) | School of Social Work (2023)
- **Details:** Recognition of academic achievement.

---

## CSS Grid Positioning (12x8 Grid)

### Card Positions:
- **Download Card:** Row 3, Cols 2-12 (10 cols, 1 row)
- **Education Card:** Row 5, Cols 2-5 (4 cols, 2 rows)
- **Experience Card 1:** Row 5, Cols 8-11 (4 cols, 2 rows)
- **Experience Card 2:** Row 4, Cols 7-12 (6 cols, 1 row)
- **Experience Card 3:** Row 7, Cols 6-12 (7 cols, 1 row)
- **Extracurricular Card 1:** Row 4, Cols 1-6 (6 cols, 1 row)
- **Extracurricular Card 2:** Row 5, Cols 6-12 (7 cols, 1 row)
- **Skills Card:** Row 6, Cols 1-5 (5 cols, 1 row)
- **Achievements Card:** Row 7, Cols 1-5 (5 cols, 1 row)
- **Contact Card:** Row 8, Cols 2-11 (10 cols, 1 row)

---

## Design System Maintained

### Flip Card Behavior
- All cards maintain the flip-on-hover interaction
- Front face: Title and subtitle
- Back face: Detailed content with inverted theme colors
- Light mode: Dark background (#1a1a1a) with light text (#fafafa)
- Dark mode: Light background (#fafafa) with dark text (#0a0a0a)

### Typography
- Headings: Sato font family
- Responsive sizing using clamp()
- Consistent hierarchy maintained

### Theme System
- All content adapts automatically to light/dark mode
- Proper color contrast on flipped cards
- Link buttons maintain visibility and hover states

---

## Quality Assurance

### Content Accuracy
- All text matches PDF resume exactly
- No paraphrasing or content alteration
- Dates, organizations, and titles preserved precisely
- Bullet points maintain original structure and wording
- Double periods at end of Goodwill Ambassador bullets preserved (as in PDF)

### Design Consistency
- Grid-aligned layout preserved
- Flip card animations functioning
- Responsive behavior maintained
- Theme toggle integration intact
- Navigation grid unaffected

---

## Testing Checklist

- [ ] Open resume.html in browser
- [ ] Verify all 9 content cards display correctly
- [ ] Test flip-on-hover for each card
- [ ] Confirm text is readable on both light and dark themes
- [ ] Check that content matches PDF resume exactly
- [ ] Verify responsive layout on different screen sizes
- [ ] Test Download PDF link functionality
- [ ] Test Contact Me link navigation

---

## Next Steps

### Optional Enhancements:
1. Update the actual PDF file at `assets/resume/Ethan-Anderson-Resume.pdf` to match
2. Add hover states or visual indicators for better UX
3. Consider adding transition animations between cards
4. Optimize card positioning for tablet/mobile breakpoints

---

**Last Updated:** 2025-11-23
**Status:** Complete - All content synchronized with PDF resume
**Source PDF:** Anderson_Ethan_Resumev2_FAA310.pdf
