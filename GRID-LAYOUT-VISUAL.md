# Grid Layout Visual Reference

## Final 12×8 Grid Layout

```
     Col: 1   2   3   4   5   6   7   8   9   10  11  12
Row 1:  .   .   .   .   .   p   .   c   .   .   .   []  ← Theme toggle
Row 2:  .   .   .   .   .   r   .   o   .   .   .   .
Row 3:  .   .   .   .   .   o   .   n   .   .   .   .
Row 4:  .   .   .   .   .   j   .   t   .   .   .   .
Row 5:  r   e   s   u   m   E   S   A   b   o   u   t   ← Main horizontal
Row 6:  .   .   .   .   .   c   .   c   .   .   .   .
Row 7:  .   .   .   .   .   t   .   t   .   .   .   .
Row 8:  .   .   .   .   .   s   .   .   .   .   .   .
        └───────resume──────┘
                            └esa┘
                                └───about────┘
                        └projects┘
                                └contact┘
```

## Word Breakdown

### RESUME (horizontal, row 5)
- **r** at (5, 1)
- **e** at (5, 2)
- **s** at (5, 3)
- **u** at (5, 4)
- **m** at (5, 5)
- **e** at (5, 6) ← **SHARES with ESA**

### ESA (horizontal, row 5) - Bold, 2x size
- **E** at (5, 6) ← **SHARED with resume & projects**
- **S** at (5, 7)
- **A** at (5, 8) ← **SHARED with about & contact**

### ABOUT (horizontal, row 5)
- **a** at (5, 8) ← **SHARES with ESA**
- **b** at (5, 9)
- **o** at (5, 10)
- **u** at (5, 11)
- **t** at (5, 12)

### PROJECTS (vertical, column 6)
- **p** at (1, 6)
- **r** at (2, 6)
- **o** at (3, 6)
- **j** at (4, 6)
- **e** at (5, 6) ← **SHARES with ESA**
- **c** at (6, 6)
- **t** at (7, 6)
- **s** at (8, 6)

### CONTACT (vertical, column 8)
- **c** at (1, 8)
- **o** at (2, 8)
- **n** at (3, 8)
- **t** at (4, 8)
- **a** at (5, 8) ← **SHARES with ESA**
- **c** at (6, 8)
- **t** at (7, 8)

### THEME TOGGLE
- **[/]** at (1, 12) - Top right corner

## Intersection Points

### Position (5, 6) - Triple intersection
- **ESA 'E'** (always visible, bold, 2x)
- resume 'e' (flips with resume word)
- projects 'e' (flips with projects word)

**Behavior**: Shows ESA 'E' always. Flips when hovering resume OR projects.

### Position (5, 8) - Triple intersection
- **ESA 'A'** (always visible, bold, 2x)
- about 'a' (flips with about word)
- contact 'a' (flips with contact word)

**Behavior**: Shows ESA 'A' always. Flips when hovering about OR contact.

## Visual State Examples

### Initial State (No hover)
```
Only ESA letters visible (bold, large):

     Col: 1   2   3   4   5   6   7   8   9   10  11  12
Row 5:  .   .   .   .   .   E   S   A   .   .   .   .
```

### Hovering "resume"
```
All resume letters flip and reveal:

     Col: 1   2   3   4   5   6   7   8   9   10  11  12
Row 5:  r   e   s   u   m   E   S   A   .   .   .   .
        └─────FLIPPED─────┘
```

### Hovering "projects"
```
All projects letters flip and reveal (vertical):

     Col: 6
Row 1:  p
Row 2:  r
Row 3:  o
Row 4:  j
Row 5:  E  ← ESA letter flips
Row 6:  c
Row 7:  t
Row 8:  s

All FLIPPED
```

### Hovering "about"
```
All about letters flip and reveal:

     Col: 8   9   10  11  12
Row 5:  A   b   o   u   t
        └───FLIPPED─────┘
```

### Hovering "contact"
```
All contact letters flip and reveal (vertical):

     Col: 8
Row 1:  c
Row 2:  o
Row 3:  n
Row 4:  t
Row 5:  A  ← ESA letter flips
Row 6:  c
Row 7:  t

All FLIPPED
```

## Typography Reference

### ESA Letters
- Font: Sato Bold (weight 700)
- Size: `clamp(3rem, 6vw, 5rem)` (2x navigation)
- Color: var(--color-primary)
- Always visible on front face

### Navigation Letters
- Font: Sato Regular (weight 400)
- Size: `clamp(1.5rem, 3vw, 2.5rem)`
- Color: var(--color-primary)
- Hidden initially (opacity: 0)
- Visible on back face after flip

### Theme Icons
- Sun.jpg (light mode) / Moon.jpg (dark mode)
- Size: 60% of cell
- CSS filtered to match theme

## Responsive Behavior

### Desktop (>1024px): 12×8 grid
Full layout as shown above

### Tablet (≤1024px): 10×8 grid
Letters compress horizontally, maintain functionality

### Mobile (≤768px): 6×8 grid
Significant compression, letters stack more

### Small (≤480px): 6×8 grid
Maximum compression, smallest font sizes

## Color Coding (for reference)

- **Bold UPPERCASE** = ESA letters (always visible)
- lowercase = navigation letters (hidden until hover)
- `.` = empty cell
- `[]` = theme toggle

## File References

- Grid config: `/js/landing-simple.js` (line 8-70)
- CSS styles: `/css/landing-simple.css`
- HTML structure: `/index-landing.html`

---

**Last Updated**: 2025-11-22
**Grid Dimensions**: 12 columns × 8 rows
**Total Cells**: 96
**Interactive Cells**: 27 (3 ESA + 24 navigation)
