# Sustainable Architecture Portfolio Website

A modern, responsive portfolio website built with HTML, CSS, and JavaScript. Designed specifically for architecture and design students to showcase sustainable design projects.

## ✨ Features

- **Responsive Design** - Works beautifully on desktop, tablet, and mobile
- **Project Grid** - Showcase 9+ projects with category filtering
- **Project Detail Pages** - Template for creating detailed case studies
- **Contact Form** - Working contact form using Web3Forms (free)
- **Resume Page** - Display your experience and skills with PDF download
- **About Page** - Share your story and design philosophy
- **Modern UI** - Clean, minimal aesthetic with bold typography
- **Fast Loading** - Optimized static site with no dependencies
- **Free Hosting** - Deploy to Netlify or GitHub Pages at no cost

## 📁 Project Structure

```
portfolio-website/
├── index.html              # Homepage with project grid
├── about.html              # About page
├── contact.html            # Contact page with form
├── resume.html             # Resume/CV page
├── css/
│   ├── style.css          # Main styles (navbar, footer, etc.)
│   ├── project.css        # Project detail page styles
│   ├── about.css          # About page styles
│   ├── contact.css        # Contact page styles
│   └── resume.css         # Resume page styles
├── js/
│   ├── main.js            # Main JavaScript (navigation, filtering)
│   └── contact.js         # Contact form handling
├── images/                # Your project images
├── projects/              # Individual project pages
│   └── project1.html      # Template project page
└── assets/
    └── resume/            # Your resume PDF
```

## 🚀 Getting Started

### Step 1: Customize Your Information

#### Update Personal Details
Replace all instances of placeholder text:
- `Your Name` - Your actual name
- `your.email@example.com` - Your email address
- Social media links (LinkedIn, Instagram)
- Location information

**Files to update:**
- `index.html`
- `about.html`
- `contact.html`
- `resume.html`
- All project pages

### Step 2: Add Your Images

#### Required Images:
1. **Profile Photo** - Add to `images/profile-photo.jpg` (300x300px recommended)
2. **Project Thumbnails** - Add to `images/` folder:
   - `project1-thumb.jpg` through `project9-thumb.jpg`
   - Recommended size: 800x600px
3. **Project Hero Images** - Large header images:
   - `project1-hero.jpg` through `project9-hero.jpg`
   - Recommended size: 1920x1080px
4. **Project Gallery Images** - Additional project photos:
   - `project1-img1.jpg`, `project1-img2.jpg`, etc.
   - Recommended size: 1200x900px

#### Image Optimization Tips:
- Use `.jpg` for photos, `.png` for graphics with transparency
- Compress images before uploading (use tools like [TinyPNG](https://tinypng.com))
- Keep file sizes under 500KB for thumbnails, under 1MB for hero images
- Use descriptive file names (e.g., `sustainable-housing-exterior.jpg`)

### Step 3: Customize Your Projects

#### Update the Homepage Grid
In `index.html`, edit each project card (lines 68-175):

```html
<article class="project-card" data-category="residential">
    <a href="projects/project1.html" class="project-link">
        <div class="project-image">
            <img src="images/your-project-image.jpg" alt="Your Project">
            ...
        </div>
        <div class="project-info">
            <h3 class="project-title">Your Project Title</h3>
            <p class="project-category">Category • Year</p>
            <p class="project-description">Brief description...</p>
        </div>
    </a>
</article>
```

**Categories available:** `residential`, `commercial`, `urban`, `conceptual`

#### Create Individual Project Pages
1. **Duplicate** `projects/project1.html` for each project
2. **Rename** to `project2.html`, `project3.html`, etc.
3. **Update content** in each file:
   - Project title and description
   - Meta information (year, type, location, role)
   - Project overview and challenge/solution
   - Sustainability features
   - Image gallery
   - Update navigation links to next/previous projects

### Step 4: Set Up Contact Form

#### Get a Free Web3Forms API Key:
1. Go to [web3forms.com](https://web3forms.com)
2. Click "Get Started Free"
3. Enter your email address
4. Check your email and copy your Access Key

#### Add Key to Contact Form:
Open `contact.html` and replace `YOUR_ACCESS_KEY_HERE` on line 46:

```html
<input type="hidden" name="access_key" value="YOUR_ACTUAL_KEY_HERE">
```

Now your contact form will send submissions directly to your email!

### Step 5: Add Your Resume PDF

1. Create or export your resume as a PDF
2. Name it `Your-Name-Resume.pdf`
3. Place it in the `assets/resume/` folder
4. Update the filename in `resume.html` (lines 22 and 275):

```html
<a href="assets/resume/Your-Name-Resume.pdf" download>
```

### Step 6: Customize Colors (Optional)

Want to change the color scheme? Edit the CSS variables in `css/style.css` (lines 5-15):

```css
:root {
    --color-primary: #1a1a1a;        /* Dark text/headers */
    --color-accent: #2d5016;         /* Green accent (change this!) */
    --color-bg: #ffffff;             /* Background color */
    /* ... */
}
```

**Suggested color schemes:**
- **Forest Green:** `#2d5016` (current)
- **Ocean Blue:** `#0066cc`
- **Earth Brown:** `#8b4513`
- **Modern Teal:** `#008080`

## 🌐 Deploying Your Website

### Option 1: Netlify (Recommended - Easiest!)

1. **Create a Netlify account** at [netlify.com](https://netlify.com)
2. **Drag and drop** your entire `portfolio-website` folder onto Netlify
3. **Wait 30 seconds** - your site is live!
4. **Custom domain** (optional):
   - Click "Domain settings"
   - Buy a domain through Netlify (~$15/year) or connect an existing one

**Benefits:**
- Free hosting forever
- Automatic HTTPS
- Easy updates (just drag new folder)
- Free `.netlify.app` subdomain

### Option 2: GitHub Pages (Free with GitHub)

1. **Create GitHub account** at [github.com](https://github.com)
2. **Create new repository** named `portfolio` (or any name)
3. **Upload files**:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/yourusername/portfolio.git
   git push -u origin main
   ```
4. **Enable GitHub Pages**:
   - Go to repository Settings
   - Click "Pages" in sidebar
   - Select "main" branch
   - Click "Save"
5. **Your site will be live** at `yourusername.github.io/portfolio`

**Benefits:**
- Free hosting
- Version control included
- Good for developers
- Free custom domain support

### Option 3: Local Testing

Before deploying, test locally:

1. **Install VS Code** (if you don't have it)
2. **Install "Live Server" extension**
3. **Right-click** on `index.html`
4. **Select** "Open with Live Server"
5. **Your site opens** in your browser at `localhost:5500`

## 📝 Customization Guide

### Adding More Projects

Already have 9 projects and want more?

1. Create new `projectX.html` file in `projects/` folder
2. Add new project card to `index.html` homepage grid
3. Update navigation links in neighboring project pages

### Changing Fonts

Want different typography?

1. **Google Fonts:**
   - Visit [fonts.google.com](https://fonts.google.com)
   - Choose a font (e.g., "Montserrat")
   - Copy the embed code
   - Add to `<head>` in all HTML files:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
   ```
   - Update CSS variable in `style.css`:
   ```css
   --font-primary: 'Montserrat', sans-serif;
   ```

### Adding a Blog (Future Enhancement)

This portfolio doesn't include a blog, but you can add one:
- Create `blog.html` and `blog/` folder
- Add to navigation menu
- Use same styling structure as other pages
- Consider using a static site generator like [Jekyll](https://jekyllrb.com) for easier blog management

## 🛠 Code Explanation (Learning Guide)

### HTML Basics
- `<header>`, `<nav>`, `<main>`, `<footer>` - Semantic structure elements
- `<section>` - Groups related content
- `<article>` - Self-contained content (like project cards)
- `class="..."` - Hooks for CSS styling
- `id="..."` - Unique identifiers for JavaScript

### CSS Concepts
- **CSS Variables** (`--color-primary`) - Reusable values
- **Flexbox** (`display: flex`) - Flexible layouts
- **Grid** (`display: grid`) - Two-dimensional layouts
- **Media Queries** (`@media`) - Responsive design for different screen sizes
- **Transitions** - Smooth animations on hover

### JavaScript Features
- **Event Listeners** - Respond to clicks and scrolls
- **DOM Manipulation** - Change HTML/CSS with JavaScript
- **Filtering** - Show/hide projects based on category
- **Form Handling** - Send contact form data to Web3Forms API

### File Organization
- **Separation of Concerns** - HTML (structure), CSS (style), JS (behavior)
- **Modular CSS** - Different files for different pages
- **Reusable Components** - Navigation and footer used across all pages

## 🐛 Troubleshooting

### Images Not Showing?
- Check file paths (case-sensitive!)
- Ensure images are in `images/` folder
- Verify image file names match HTML exactly
- Check image file extensions (.jpg vs .jpeg)

### Contact Form Not Working?
- Verify you added your Web3Forms Access Key
- Check for typos in the access key
- Make sure you're testing on a live site (not file://)
- Check spam folder for test submissions

### Site Looks Broken on Mobile?
- Clear your browser cache
- Check for typos in CSS file names
- Ensure all CSS files are linked in HTML `<head>`

### Filtering Not Working?
- Check browser console for JavaScript errors (F12)
- Ensure `data-filter` attributes match category names exactly
- Verify `main.js` is loaded in HTML

## 📚 Learning Resources

Want to learn more about the code?

- **HTML:** [MDN Web Docs - HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- **CSS:** [CSS-Tricks](https://css-tricks.com)
- **JavaScript:** [JavaScript.info](https://javascript.info)
- **Responsive Design:** [A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- **Web Development:** [freeCodeCamp](https://www.freecodecamp.org)

## 💡 Next Steps

Once your portfolio is live:

1. **Test thoroughly** on different devices and browsers
2. **Share with friends** for feedback
3. **Add to your resume** and LinkedIn
4. **Submit to job applications** and design competitions
5. **Update regularly** with new projects
6. **Track visitors** (optional) with [Google Analytics](https://analytics.google.com)

## 🤝 Need Help?

- **HTML/CSS Issues:** Search on [Stack Overflow](https://stackoverflow.com)
- **Deployment Problems:** Check hosting platform documentation
- **Design Questions:** Explore [Dribbble](https://dribbble.com) and [Behance](https://behance.net) for inspiration

---

## ⚡ Quick Start Checklist

- [ ] Replace all instances of "Your Name"
- [ ] Update email and social media links
- [ ] Add profile photo to `images/`
- [ ] Add all project images to `images/`
- [ ] Customize project cards on homepage
- [ ] Create/customize individual project pages
- [ ] Get Web3Forms API key and add to contact form
- [ ] Add resume PDF to `assets/resume/`
- [ ] Update About page with your bio
- [ ] Update Resume page with your experience
- [ ] Test contact form
- [ ] Test on mobile device
- [ ] Deploy to Netlify or GitHub Pages
- [ ] Buy custom domain (optional)
- [ ] Share your portfolio!

Good luck with your portfolio! 🎉
