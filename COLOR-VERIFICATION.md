# Resume Flip Card Color Verification Guide

## Color Values Reference

### Light Mode Colors
- **Background**: `#fafafa` (very light gray, almost white)
- **Text**: `#1a1a1a` (very dark gray, almost black)
- **Border**: `#e8e8e8` (light gray)

### Dark Mode Colors
- **Background**: `#0a0a0a` (very dark gray, almost black)
- **Text**: `#fafafa` (very light gray, almost white)
- **Border**: `#2a2a2a` (dark gray)

---

## Expected Visual Appearance

### LIGHT MODE

#### Card Front (Non-Flipped)
```
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║                   ║  │ ← White-ish background (#fafafa)
│  ║    EDUCATION      ║  │ ← Black-ish text (#1a1a1a)
│  ║  Academic Background  ║
│  ║                   ║  │
│  ╚═══════════════════╝  │
└─────────────────────────┘
```
**VERDICT**: Text should be DARK on LIGHT background ✓

#### Card Back (Flipped/Hovered)
```
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║ B.S. Sustainable  ║  │ ← Black-ish background (#1a1a1a)
│  ║ Design            ║  │ ← White-ish text (#fafafa)
│  ║ University of IL  ║  │
│  ║ GPA: 3.99/4.00   ║  │
│  ╚═══════════════════╝  │
└─────────────────────────┘
```
**VERDICT**: Text should be LIGHT on DARK background ✓

---

### DARK MODE

#### Card Front (Non-Flipped)
```
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║                   ║  │ ← Black-ish background (#0a0a0a)
│  ║    EDUCATION      ║  │ ← White-ish text (#fafafa)
│  ║  Academic Background  ║
│  ║                   ║  │
│  ╚═══════════════════╝  │
└─────────────────────────┘
```
**VERDICT**: Text should be LIGHT on DARK background ✓

#### Card Back (Flipped/Hovered)
```
┌─────────────────────────┐
│  ╔═══════════════════╗  │
│  ║ B.S. Sustainable  ║  │ ← White-ish background (#fafafa)
│  ║ Design            ║  │ ← Black-ish text (#0a0a0a)
│  ║ University of IL  ║  │
│  ║ GPA: 3.99/4.00   ║  │
│  ╚═══════════════════╝  │
└─────────────────────────┘
```
**VERDICT**: Text should be DARK on LIGHT background ✓

---

## Button/Link Appearance on Flipped Cards

### LIGHT MODE (Flipped Card)
Card has dark background (#1a1a1a), so buttons need:
- **Button background**: `#fafafa` (light)
- **Button text**: `#1a1a1a` (dark)
- **Hover**: Transparent background with light text

### DARK MODE (Flipped Card)
Card has light background (#fafafa), so buttons need:
- **Button background**: `#0a0a0a` (dark)
- **Button text**: `#fafafa` (light)
- **Hover**: Transparent background with dark text

---

## Testing Protocol

### Step 1: Light Mode Testing
1. Open `/resume.html` (should default to light mode)
2. Page background should be light gray (#fafafa)
3. Page text should be dark gray (#1a1a1a)

### Step 2: Hover Each Card in Light Mode
For EACH card (Education, Experience, Skills, etc.):
- [ ] Hover over card
- [ ] Card should flip to reveal dark background (#1a1a1a)
- [ ] All text should be light colored (#fafafa)
- [ ] All text should be EASILY READABLE
- [ ] Bullets/dashes should be visible
- [ ] If there's a button, it should have light background

### Step 3: Toggle to Dark Mode
- [ ] Click theme toggle (top-right grid cell)
- [ ] Page background should become very dark (#0a0a0a)
- [ ] Page text should become light (#fafafa)

### Step 4: Hover Each Card in Dark Mode
For EACH card:
- [ ] Hover over card
- [ ] Card should flip to reveal light background (#fafafa)
- [ ] All text should be dark colored (#0a0a0a)
- [ ] All text should be EASILY READABLE
- [ ] Bullets/dashes should be visible
- [ ] If there's a button, it should have dark background

---

## Common Issues to Look For

### Issue 1: Text Disappears on Flip
**Symptom**: Text becomes invisible when card flips
**Cause**: Text color matches background color
**Fix**: Verify the !important declarations are working

### Issue 2: Low Contrast Text
**Symptom**: Text is barely visible (very faint)
**Cause**: Opacity settings or wrong color values
**Fix**: Check that colors are hardcoded, not using variables

### Issue 3: Wrong Text Color
**Symptom**: Text uses page theme colors instead of inverted colors
**Cause**: CSS specificity issue or missing theme selector
**Fix**: Verify `:root` and `[data-theme="dark"]` selectors are present

### Issue 4: Buttons Have No Contrast
**Symptom**: Buttons blend into flipped card background
**Cause**: Button colors not inverted for flipped state
**Fix**: Check download-link and cta-link theme-specific styles

---

## Quick Visual Test

Open `/test-flip-cards.html` in browser for isolated testing:
- Three test cards with different content types
- Toggle button for quick theme switching
- Instructions built into the page

---

## File Locations
- **Main CSS**: `/mnt/c/Users/ethan/portfolio-website/css/resume.css`
- **Resume Page**: `/mnt/c/Users/ethan/portfolio-website/resume.html`
- **Test Page**: `/mnt/c/Users/ethan/portfolio-website/test-flip-cards.html`
- **Fix Documentation**: `/mnt/c/Users/ethan/portfolio-website/FLIP-CARD-TEXT-FIX.md`

---

## Success Criteria

✓ All text is readable in light mode (light text on dark cards)
✓ All text is readable in dark mode (dark text on light cards)
✓ Smooth transition between themes
✓ Buttons/links are visible and functional
✓ No white-on-white or black-on-black text
✓ Consistent appearance across all cards

