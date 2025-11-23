# New Features Guide

## Overview
Your portfolio now includes four powerful new features:
1. **Light/Dark Mode Toggle** - User preference theme switching
2. **Image Desaturation Effect** - Grayscale images that saturate on hover
3. **SpinKit FOLD Loader** - Elegant loading animation
4. **Animated ESA Initials** - Light tracing your circular initials

---

## 1. Light/Dark Mode Toggle

### How It Works
- **Button Location**: Top right of navigation bar
- **Persistence**: Saves user preference to localStorage
- **Auto-detection**: Respects system color scheme preference on first visit
- **Icons**: ☀️ (Light mode) / 🌙 (Dark mode)

### Dark Mode Colors
```css
Background: #0a0a0a (deep black)
Text: #fafafa (light)
Borders: #2a2a2a (dark gray)
```

### Implementation Details
- Theme stored in `data-theme` attribute on `<html>` element
- CSS custom properties automatically update
- Smooth transitions between themes (0.3s)
- Works across all pages when implemented

### Adding to Other Pages
Add this to your navigation on every page:
```html
<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
    <span class="theme-icon" id="theme-icon">☀️</span>
    <span id="theme-label">Light</span>
</button>
```

And include the script:
```html
<script src="js/theme-and-animations.js"></script>
```

---

## 2. Image Desaturation with Hover Effect

### How It Works
- **Default State**: All project images are 100% grayscale
- **Hover State**: Images smoothly transition to full color
- **Timing**: 0.6s cubic-bezier transition
- **Inspiration**: lucas.studio aesthetic

### CSS Implementation
```css
.project-image img {
    filter: grayscale(100%);
    transition: filter var(--transition-slow);
}

.project-card:hover .project-image img {
    filter: grayscale(0%);
}
```

### Customization Options
- **Partial desaturation**: Change `grayscale(100%)` to `grayscale(50%)`
- **Sepia tone**: Add `sepia(20%)` along with grayscale
- **Brightness**: Add `brightness(1.1)` on hover for extra pop

---

## 3. SpinKit FOLD Loader

### How It Works
- **Appears**: On page load
- **Duration**: Shows for 0.8 seconds
- **Animation**: Four cubes folding in sequence
- **Timing**: 2.4s infinite loop (while visible)
- **Colors**: Adapts to theme (uses `--color-primary`)

### HTML Structure
```html
<div class="loader-overlay" id="loader">
    <div class="sk-fold">
        <div class="sk-fold-cube"></div>
        <div class="sk-fold-cube"></div>
        <div class="sk-fold-cube"></div>
        <div class="sk-fold-cube"></div>
    </div>
</div>
```

### Customization
Change size and color:
```css
.sk-fold {
    --sk-size: 60px;  /* Default: 40px */
    --sk-color: #ff6b6b;  /* Custom color */
}
```

### Show Loader for Longer
Edit `theme-and-animations.js`:
```javascript
setTimeout(() => {
    loader.classList.add('hidden');
}, 2000);  // Change from 800 to 2000 (2 seconds)
```

---

## 4. Animated ESA Initials

### How It Works
- **Location**: Hero section, above main heading
- **Animation**: Glowing light traces the circular path of letters
- **Duration**: 10 seconds per loop
- **Technology**: CSS offset-path animation with SVG path
- **Scroll Effect**: Fades out as you scroll down (parallax)

### The Magic
1. **SVG Path**: Defines the shape of "esa" letters
2. **Offset-Path**: CSS property that moves element along SVG path
3. **Radial Gradient**: Creates soft glowing ball of light
4. **Blur Filter**: Adds soft edges to the glow
5. **Mix-Blend-Mode**: Makes it interact beautifully with background

### Customization

#### Change Animation Speed
```css
.esa-glow {
    animation: tracePath 6s infinite;  /* Faster: 6s instead of 10s */
}
```

#### Change Glow Color
```css
.esa-glow {
    background: radial-gradient(circle,
        rgba(100, 200, 255, 1) 0%,      /* Change to blue */
        rgba(120, 210, 255, 0.7) 30%,
        transparent 70%
    );
}
```

#### Change Glow Size
```css
.esa-glow {
    width: 24px;   /* Larger: 24px instead of 16px */
    height: 24px;
    filter: blur(10px);  /* More blur */
}
```

#### Modify the Path
The SVG path in `index.html` can be edited to change the letter shapes:
```html
<path id="esa-path" d="YOUR_CUSTOM_PATH_HERE" />
```

To create a custom path:
1. Use a tool like Figma or Illustrator
2. Type your initials in Sato font
3. Convert to outlines/paths
4. Export as SVG
5. Copy the path `d` attribute

### Parallax Scroll Effect
The ESA animation fades and moves as you scroll:
- **Opacity**: Fades from 1 to 0 over 400px scroll
- **Transform**: Moves down at 0.3x scroll speed

Disable parallax effect by removing this from `theme-and-animations.js`:
```javascript
// Comment out or remove this section
window.addEventListener('scroll', () => {
    // ...parallax code...
});
```

---

## File Structure

### New Files
- `/js/theme-and-animations.js` - All new JavaScript functionality
- `/fonts/` - Sato font files (Regular, Medium, Bold, Slanted)

### Modified Files
- `/css/style.css` - Added theme variables, loader, ESA animation, image effects
- `/index.html` - Added loader, theme toggle, ESA animation
- All other HTML pages need theme toggle added manually

---

## Browser Compatibility

### Fully Supported
- Chrome/Edge 88+
- Firefox 72+
- Safari 15.4+

### Features Used
- CSS Custom Properties (variables)
- CSS offset-path (for ESA animation)
- CSS filter (for image desaturation)
- localStorage API (for theme persistence)
- prefers-color-scheme media query

### Fallbacks
If offset-path isn't supported, the ESA animation will still display the text, just without the tracing light.

---

## Performance Tips

1. **Loader Duration**: Keep under 1 second to avoid user frustration
2. **Image Optimization**: Use compressed images (WebP format recommended)
3. **Reduce Motion**: Add this for accessibility:
   ```css
   @media (prefers-reduced-motion: reduce) {
       .esa-glow {
           animation: none;
       }
   }
   ```

---

## Accessibility

### Theme Toggle
- ✅ Uses semantic `<button>` element
- ✅ Has `aria-label` for screen readers
- ✅ Shows both icon and text label
- ✅ Keyboard accessible (Tab + Enter)

### Loading Spinner
- ⚠️ Consider adding `aria-live="polite"` for screen readers
- ⚠️ Add text alternative: `<span class="sr-only">Loading...</span>`

### ESA Animation
- ✅ Purely decorative, doesn't interfere with content
- ✅ Fades on scroll, so it doesn't distract
- ⚠️ Consider `prefers-reduced-motion` for users with vestibular disorders

---

## Troubleshooting

### Theme Toggle Not Working
1. Check that `theme-and-animations.js` is loaded
2. Verify button has correct `id="theme-toggle"`
3. Check browser console for JavaScript errors
4. Clear localStorage: `localStorage.clear()`

### ESA Animation Not Showing Light
1. Browser must support CSS offset-path
2. Check that SVG path exists and has correct `id="esa-path"`
3. Verify JavaScript sets offset-path dynamically
4. Try different browsers (Chrome/Edge work best)

### Images Not Desaturating
1. Ensure images are actually loading (check src paths)
2. Verify CSS is loaded correctly
3. Check for conflicting CSS rules
4. Try adding `!important` to filter property (temporary fix)

### Loader Stays Forever
1. Check that JavaScript is loaded
2. Verify `id="loader"` on the overlay
3. Check browser console for errors
4. Make sure page finishes loading (no broken resources)

---

## Next Steps

1. **Add Theme Toggle to All Pages**: Copy the button to about.html, contact.html, resume.html, project pages
2. **Customize Colors**: Adjust dark mode colors to your preference
3. **Test Across Devices**: Mobile, tablet, desktop
4. **Optimize Images**: Compress for faster loading
5. **Add More Animations**: Consider animating project cards on scroll

---

## Credits

- **SpinKit**: https://github.com/tobiasahlin/SpinKit
- **Inspiration**: lucas.studio, lovefrom.com, snohetta.com
- **Font**: Sato (your custom font)
- **Design**: Minimalist dark-on-light aesthetic

Enjoy your upgraded portfolio! 🎉
