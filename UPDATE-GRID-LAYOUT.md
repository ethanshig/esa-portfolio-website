# How to Update Grid Layout from Excel

When you're ready to update the grid positions to match your Excel layout, follow these steps:

## Step 1: Open the Layout File

Open the grid layout configuration in your code editor:
```
/js/landing-simple.js
```

## Step 2: Locate the gridLayout Object

Look for this section near the top of the file (starting around line 8):
```javascript
const gridLayout = {
    esa: [...],
    theme: [...],
    resume: [...],
    projects: [...],
    about: [...],
    contact: [...]
};
```

## Step 3: Update Each Word's Positions

For each word, update the row and column numbers to match your Excel file.

### Format
Each letter needs:
```javascript
{ letter: 'x', row: R, col: C }
```

Where:
- `'x'` = the letter
- `R` = row number (1-10)
- `C` = column number (1-10)

### Example: Updating "resume"

If your Excel shows:
- r at row 3, col 2
- e at row 3, col 3
- s at row 3, col 4
- u at row 3, col 5
- m at row 3, col 6
- e at row 3, col 7 (shared with esa)

Update the code to:
```javascript
resume: [
    { letter: 'r', row: 3, col: 2 },
    { letter: 'e', row: 3, col: 3 },
    { letter: 's', row: 3, col: 4 },
    { letter: 'u', row: 3, col: 5 },
    { letter: 'm', row: 3, col: 6 },
    { letter: 'e', row: 3, col: 7 } // Shared with esa
],
```

## Step 4: Update "esa" Positions

The "esa" letters need their exact positions. For example:
```javascript
esa: [
    { letter: 'e', row: 5, col: 7, class: 'letter-esa' },
    { letter: 's', row: 5, col: 8, class: 'letter-esa' },
    { letter: 'a', row: 5, col: 9, class: 'letter-esa' }
],
```

**Important**: Keep `class: 'letter-esa'` on each esa letter!

## Step 5: Handle Shared Letters

When a navigation word shares a letter with "esa":

1. The letter appears in BOTH arrays (e.g., in both "resume" and "esa")
2. The code automatically detects this
3. The cell will show the esa letter (bold, large) but flip with the navigation word

Example:
```javascript
// If "resume" ends with the same 'e' that starts "esa"
resume: [
    // ... other letters
    { letter: 'e', row: 5, col: 7 } // Same position as esa's 'e'
],

esa: [
    { letter: 'e', row: 5, col: 7, class: 'letter-esa' }, // Same position
    // ... other letters
],
```

## Step 6: Update Theme Toggle Position

If you want the theme toggle in a different cell:
```javascript
theme: [
    { row: 1, col: 10 } // Change row and col as needed
],
```

## Step 7: Adjust Grid Size (if needed)

If your Excel uses a different grid size (not 10x10), update this section:
```javascript
function generateGrid(gridOverlay) {
    const rows = 10;  // Change this
    const cols = 10;  // Change this
    // ...
}
```

Also update the CSS responsive breakpoints in `/css/landing-simple.css`:
```css
.grid-overlay {
    grid-template-columns: repeat(10, 1fr); /* Change 10 */
    grid-template-rows: repeat(10, 1fr);    /* Change 10 */
}
```

## Step 8: Save and Test

1. Save `/js/landing-simple.js`
2. Open `index-landing.html` in your browser
3. Verify:
   - All words appear in correct positions
   - Hovering works correctly
   - Shared letters function properly

## Quick Checklist

- [ ] Updated "esa" positions with exact row/col
- [ ] Updated "resume" positions (should share final 'e' with esa)
- [ ] Updated "projects" positions (should share a letter with esa)
- [ ] Updated "about" positions (should share 'a' with esa)
- [ ] Updated "contact" positions
- [ ] Updated theme toggle position (if different from row 1, col 10)
- [ ] Verified shared letters have same row/col in multiple words
- [ ] Tested in browser
- [ ] All words flip correctly
- [ ] Navigation links work

## Troubleshooting

### Letters don't share correctly
Make sure the shared letter has **exactly** the same row and col in both word arrays.

### Words don't flip together
Check that you didn't accidentally change the word name (e.g., "resume" vs "résumé").

### Grid looks wrong
Verify the grid size (rows × cols) matches your Excel layout.

### Theme toggle doesn't appear
Check that the theme position doesn't conflict with a letter position.
