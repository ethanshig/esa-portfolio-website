# ESA Animation - Quick Reference

## Understanding the Circular Nature

Your initials "esa" have beautiful circular forms:
- **e** - Full circle/loop
- **s** - Two connected curves (like a gentle wave)
- **a** - Circle with tail

The animation traces a glowing light through these circular paths continuously.

## How the Path is Constructed

The SVG path in your code traces the inner contours of each letter:

```
e: M 60,75 Q 40,40 70,30 Q 100,20 110,50 Q 115,70 90,80 Q 70,85 60,75
   └─ Starts at center, curves around the circular counter of 'e'

s: M 140,30 L 140,90 M 140,60 L 180,60
   └─ Creates the S-curve spine

a: M 210,75 Q 200,40 230,30 Q 255,22 260,50 Q 262,65 245,75 Q 230,82 220,70
   └─ Traces the circular bowl and follows down
```

## Customizing Your Path

### Option 1: Use Your Actual Sato Font
To trace the EXACT curves of your Sato font:

1. **In Figma/Illustrator:**
   - Type "esa" in Sato font at large size (200pt+)
   - Convert text to outlines (Type → Create Outlines)
   - Select the path
   - Export as SVG

2. **Extract the Path:**
   - Open the SVG in a text editor
   - Find the `<path d="...">` element
   - Copy the `d` attribute value

3. **Replace in HTML:**
   ```html
   <path id="esa-path" d="PASTE_YOUR_PATH_HERE" />
   ```

### Option 2: Adjust the Current Path

The path uses **Quadratic Bezier curves** (`Q`):

```
M x,y       - Move to point (start)
Q cx,cy x,y - Curve to point with control point
L x,y       - Line to point
```

**To adjust curves:**
- Increase numbers = moves right/down
- Decrease numbers = moves left/up
- Control points (first x,y after Q) = bend direction

### Option 3: Simplified Circular Path

For a simpler animation around ALL three letters:

```html
<path id="esa-path" d="
    M 50,80
    Q 50,30 90,30
    Q 130,30 130,70
    Q 130,100 160,100
    Q 180,100 190,85
    Q 200,75 220,75
    Q 250,75 250,50
    Q 250,25 220,25
    Q 190,25 190,50
    Z" />
```

## Visual Debugging

To SEE your path and adjust it:

1. **Make path visible temporarily:**
   ```css
   .esa-path {
       stroke: red;
       stroke-width: 2;
   }
   ```

2. **View in browser**
3. **Adjust coordinates**
4. **Hide path again when satisfied**

## Pre-made Path Variations

### Tight Circular (follows letter curves closely)
```html
<path id="esa-path" d="M 60,75 Q 40,40 70,30 Q 100,20 110,50 Q 115,70 90,80 Q 70,85 60,75 M 140,30 L 140,90 M 140,60 L 180,60 M 210,75 Q 200,40 230,30 Q 255,22 260,50 Q 262,65 245,75 Q 230,82 220,70" />
```

### Loose Flowing (smoother, more organic)
```html
<path id="esa-path" d="M 50,70 Q 40,35 75,25 Q 105,18 115,50 Q 118,75 85,85 Q 60,90 50,70 M 135,25 Q 145,60 155,95 M 145,55 L 185,55 M 205,70 Q 195,35 235,25 Q 265,20 270,55 Q 272,80 240,85 Q 215,88 205,70" />
```

### Figure-8 Pattern (crosses between letters)
```html
<path id="esa-path" d="M 80,50 Q 60,30 90,20 Q 115,20 120,45 Q 125,65 100,75 L 140,75 Q 150,85 160,65 Q 170,50 180,60 L 200,60 Q 210,40 235,35 Q 260,32 265,60 Q 268,80 240,82 Q 215,84 210,65 Z" />
```

## Animation Timing Controls

### Speed
```css
.esa-glow {
    animation: tracePath 10s infinite;
    /* Change 10s to: */
    /* 5s = faster (more energetic) */
    /* 15s = slower (more contemplative) */
    /* 20s = very slow (meditative) */
}
```

### Easing
```css
.esa-glow {
    animation: tracePath 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    /* Change to: */
    /* linear = constant speed */
    /* ease-in-out = start slow, fast middle, end slow */
    /* cubic-bezier(0.65, 0, 0.35, 1) = smoother */
}
```

### Delay Between Loops
```css
@keyframes tracePath {
    0% { offset-distance: 0%; opacity: 0; }
    3% { opacity: 1; }
    40% { opacity: 1; }  /* Reaches 40% of path */
    45% { opacity: 0; }  /* Fades out early */
    100% { offset-distance: 100%; opacity: 0; }
    /* Creates gap/pause between loops */
}
```

## Glow Customization

### Size
```css
.esa-glow {
    width: 20px;   /* Larger glow */
    height: 20px;
    filter: blur(10px);  /* More diffuse */
}
```

### Color Themes

**Warm Gold (current):**
```css
background: radial-gradient(circle,
    rgba(255, 200, 100, 1) 0%,
    rgba(255, 220, 120, 0.7) 30%,
    transparent 70%
);
```

**Cool Blue:**
```css
background: radial-gradient(circle,
    rgba(100, 200, 255, 1) 0%,
    rgba(150, 220, 255, 0.7) 30%,
    transparent 70%
);
```

**Vibrant Pink:**
```css
background: radial-gradient(circle,
    rgba(255, 100, 200, 1) 0%,
    rgba(255, 150, 220, 0.7) 30%,
    transparent 70%
);
```

**Pure White (minimal):**
```css
background: radial-gradient(circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.5) 40%,
    transparent 70%
);
filter: blur(5px);
```

**Multicolor Gradient:**
```css
background: linear-gradient(90deg,
    rgba(255, 100, 100, 1),
    rgba(100, 200, 255, 1),
    rgba(200, 100, 255, 1)
);
filter: blur(8px);
```

## Multiple Glows

For TWO lights tracing simultaneously:

```html
<div class="esa-glow" id="esa-glow"></div>
<div class="esa-glow esa-glow-2"></div>
```

```css
.esa-glow-2 {
    animation-delay: 5s;  /* Starts halfway through */
    background: radial-gradient(circle,
        rgba(100, 200, 255, 1) 0%,  /* Different color */
        rgba(150, 220, 255, 0.7) 30%,
        transparent 70%
    );
}
```

## Disable on Mobile

If the animation is too heavy for mobile:

```css
@media (max-width: 768px) {
    .esa-glow {
        display: none;
    }
}
```

## Direction Control

Reverse the animation direction:

```css
.esa-glow {
    animation-direction: reverse;  /* Traces backwards */
}
```

Or alternate:

```css
.esa-glow {
    animation-direction: alternate;  /* Back and forth */
}
```

## Testing Path Tool

Use this online tool to create and test SVG paths:
- **Method.ac SVG Editor**: https://editor.method.ac/
- **SVG Path Editor**: https://yqnn.github.io/svg-path-editor/

Paste your path data and visually edit the curves!

## Pro Tips

1. **Keep it smooth**: Use Q (quadratic) curves rather than L (lines) for fluid motion
2. **Match letter width**: Ensure path coordinates match your font size
3. **Test on dark mode**: Glow should be visible on both backgrounds
4. **Consider readability**: Don't let animation distract from content
5. **Accessibility**: Add `prefers-reduced-motion` support

```css
@media (prefers-reduced-motion: reduce) {
    .esa-glow {
        animation: none;
        opacity: 0;
    }
}
```

This ensures users with motion sensitivity don't see the animation.

---

**Remember**: The beauty is in simplicity. The circular nature of your initials creates a natural, flowing path. Don't overcomplicate it!
