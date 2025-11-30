# Resume Flip Card Text Visibility Fix

## Issue
Text on flipped resume cards was showing white-on-white (light mode) or black-on-black (dark mode), making content unreadable.

## Root Cause
The CSS was using CSS custom properties (`var(--color-bg)` and `var(--color-primary)`) for the flipped card colors, but there was likely interference from inherited text colors or specificity issues preventing proper contrast.

## Solution Implemented
Replaced variable-based colors with hardcoded, theme-specific values using explicit theme selectors.

### Changes to `/css/resume.css`

#### 1. Flipped Card Background & Base Text (Lines 358-402)
```css
/* Light mode: dark background with light text */
:root .flip-card-back-resume {
    background-color: #1a1a1a;  /* Dark background */
    color: #fafafa;              /* Light text */
}

/* Dark mode: light background with dark text */
[data-theme="dark"] .flip-card-back-resume {
    background-color: #fafafa;   /* Light background */
    color: #0a0a0a;              /* Dark text */
}

/* Force ALL child text elements with !important */
:root .flip-card-back-resume .card-content,
:root .flip-card-back-resume .card-content-detailed,
:root .flip-card-back-resume h3,
:root .flip-card-back-resume .institution,
:root .flip-card-back-resume .date,
:root .flip-card-back-resume .detail,
:root .flip-card-back-resume .detail-list li,
:root .flip-card-back-resume .skill-group h4,
:root .flip-card-back-resume .skill-group p,
:root .flip-card-back-resume a {
    color: #fafafa !important;  /* Light text in light mode */
}

[data-theme="dark"] .flip-card-back-resume .card-content,
[data-theme="dark"] .flip-card-back-resume .card-content-detailed,
[data-theme="dark"] .flip-card-back-resume h3,
[data-theme="dark"] .flip-card-back-resume .institution,
[data-theme="dark"] .flip-card-back-resume .date,
[data-theme="dark"] .flip-card-back-resume .detail,
[data-theme="dark"] .flip-card-back-resume .detail-list li,
[data-theme="dark"] .flip-card-back-resume .skill-group h4,
[data-theme="dark"] .flip-card-back-resume .skill-group p,
[data-theme="dark"] .flip-card-back-resume a {
    color: #0a0a0a !important;  /* Dark text in dark mode */
}
```

#### 2. Download & CTA Links (Lines 522-564)
Updated button/link styling to work with inverted backgrounds:

```css
/* Light mode: Links on dark flipped card background */
:root .download-link,
:root .cta-link {
    background-color: #fafafa;  /* Light button */
    color: #1a1a1a;             /* Dark text */
    border: 1px solid #fafafa;
}

:root .download-link:hover,
:root .cta-link:hover {
    background-color: transparent;
    color: #fafafa;             /* Light text on hover */
    border-color: #fafafa;
}

/* Dark mode: Links on light flipped card background */
[data-theme="dark"] .download-link,
[data-theme="dark"] .cta-link {
    background-color: #0a0a0a;  /* Dark button */
    color: #fafafa;             /* Light text */
    border: 1px solid #0a0a0a;
}

[data-theme="dark"] .download-link:hover,
[data-theme="dark"] .cta-link:hover {
    background-color: transparent;
    color: #0a0a0a;             /* Dark text on hover */
    border-color: #0a0a0a;
}
```

#### 3. List Item Bullets (Lines 497-504)
Ensured bullet points have proper contrast:

```css
/* Ensure bullets have proper color on flipped cards */
:root .flip-card-back-resume .detail-list li::before {
    color: #fafafa;
}

[data-theme="dark"] .flip-card-back-resume .detail-list li::before {
    color: #0a0a0a;
}
```

## Expected Behavior

### Light Mode
- **Card front**: White background (#fafafa) with dark text (#1a1a1a)
- **Card back (flipped)**: Dark background (#1a1a1a) with light text (#fafafa)
- **Links**: Light background with dark text, inverts on hover

### Dark Mode
- **Card front**: Dark background (#0a0a0a) with light text (#fafafa)
- **Card back (flipped)**: Light background (#fafafa) with dark text (#0a0a0a)
- **Links**: Dark background with light text, inverts on hover

## Testing Checklist
- [ ] Open `/resume.html` in browser
- [ ] Test in LIGHT mode:
  - [ ] Hover over each card
  - [ ] Verify text is readable (light text on dark background)
  - [ ] Test "Download PDF" and "Contact Me" buttons
- [ ] Toggle to DARK mode
- [ ] Test in DARK mode:
  - [ ] Hover over each card
  - [ ] Verify text is readable (dark text on light background)
  - [ ] Test "Download PDF" and "Contact Me" buttons
- [ ] Verify smooth transitions between themes

## Why This Fix Works

1. **Explicit Theme Selectors**: Using `:root` and `[data-theme="dark"]` ensures correct theme detection
2. **Hardcoded Colors**: Removes dependency on CSS variables that might be overridden
3. **!important Flag**: Forces color values on all text elements, overriding any inherited styles
4. **Comprehensive Selectors**: Targets all possible text elements (h3, p, li, a, etc.)
5. **Separate Light/Dark Rules**: Prevents any cross-contamination between themes

## Files Modified
- `/mnt/c/Users/ethan/portfolio-website/css/resume.css`

## Date
2025-11-23
