/**
 * PROJECTS SLIDESHOW
 * Per MASTER-PLAN Option A - One project at a time
 *
 * Features:
 * - Arrow navigation
 * - Keyboard navigation (←/→)
 * - Touch swipe on mobile
 * - Click image to view project detail
 */

/* ===================================
   PROJECTS DATA
   Edit this array to add/remove projects
   =================================== */
const projects = [
    {
        id: 'project-1',
        title: '3 Little Pigs Wall Assembly',
        year: '2025',
        category: 'Sustainable Construction',
        description: 'R-52 straw bale insulation wall system designed for compatibility with traditional stick framing construction.',
        image: 'images/project1-thumb.jpg',
        link: 'projects/project1.html'
    },
    {
        id: 'project-2',
        title: 'Mylo To-Go',
        year: '2025',
        category: 'Sustainable Design',
        description: 'Biodegradable mycelium-based food containers grown from agricultural waste, replacing single-use Styrofoam.',
        image: 'images/project2-thumb.jpg',
        link: 'projects/project2.html'
    },
    {
        id: 'project-3',
        title: 'Beaver\'s Burden',
        year: '2025',
        category: 'Ecological Design',
        description: 'Beaver-inspired devices exploring the evolving relationship between humans and beavers in rewilding the Kankakee Marsh.',
        image: 'images/project3-thumb.jpg',
        link: 'projects/project3.html'
    },
    {
        id: 'project-4',
        title: 'Project Title 4',
        year: '2023',
        category: 'Research',
        description: 'Brief one-sentence description of the project that captures its essence and main goal.',
        image: 'images/projects/project4-thumb.jpg',
        link: 'projects/project4.html'
    }
    // Add more projects here following the same format
];

/* ===================================
   SLIDESHOW STATE
   =================================== */
let currentSlide = 0;
let touchStartX = 0;
let touchEndX = 0;

/* ===================================
   INITIALIZATION
   =================================== */
document.addEventListener('DOMContentLoaded', function() {
    generateSlides();
    showSlide(currentSlide);
    setupNavigation();
    setupKeyboardNav();
    setupTouchSwipe();
});

/* ===================================
   GENERATE SLIDES FROM DATA
   =================================== */
function generateSlides() {
    const container = document.getElementById('slideshow-container');
    if (!container) return;

    projects.forEach((project, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.dataset.index = index;

        slide.innerHTML = `
            <div class="project-image-container" onclick="navigateToProject('${project.link}')">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="project-overlay">
                    <span class="view-project-text">View Project →</span>
                </div>
            </div>
            <div class="project-info">
                <h2 class="project-title">${project.title}</h2>
                <p class="project-meta">${project.year} • ${project.category}</p>
                <p class="project-description">${project.description}</p>
            </div>
        `;

        container.appendChild(slide);
    });

    // Update counter
    updateCounter();
}

/* ===================================
   SLIDE NAVIGATION
   =================================== */
function showSlide(index) {
    const slides = document.querySelectorAll('.slide');

    // Wrap around
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }

    // Hide all slides
    slides.forEach(slide => slide.classList.remove('active'));

    // Show current slide
    if (slides[currentSlide]) {
        slides[currentSlide].classList.add('active');
    }

    // Update navigation buttons
    updateNavButtons();
    updateCounter();
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

function navigateToProject(link) {
    window.location.href = link;
}

/* ===================================
   UPDATE UI ELEMENTS
   =================================== */
function updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (!prevBtn || !nextBtn) return;

    // Disable buttons at start/end (optional - can also enable wrapping)
    // prevBtn.disabled = currentSlide === 0;
    // nextBtn.disabled = currentSlide === projects.length - 1;

    // Or: Enable wrapping by never disabling
    prevBtn.disabled = false;
    nextBtn.disabled = false;
}

function updateCounter() {
    const counter = document.getElementById('slide-counter');
    if (counter) {
        counter.textContent = `${currentSlide + 1} / ${projects.length}`;
    }
}

/* ===================================
   EVENT LISTENERS
   =================================== */
function setupNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
}

function setupKeyboardNav() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
}

function setupTouchSwipe() {
    const container = document.getElementById('slideshow-container');
    if (!container) return;

    container.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50; // Minimum swipe distance

    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left → Next slide
        nextSlide();
    }

    if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right → Previous slide
        prevSlide();
    }
}

/* ===================================
   UTILITY: ADD NEW PROJECT
   For easy content management
   =================================== */
/**
 * To add a new project:
 *
 * 1. Add a new object to the 'projects' array above:
 *    {
 *        id: 'unique-id',
 *        title: 'Your Project Title',
 *        year: '2024',
 *        category: 'Architecture / Design / Research',
 *        description: 'One sentence description.',
 *        image: 'images/projects/your-image.jpg',
 *        link: 'projects/your-project.html'
 *    }
 *
 * 2. Add your image to /images/projects/
 *    - Dimensions: 900×600px (3:2 ratio)
 *    - Format: JPG optimized, max 300KB
 *
 * 3. Create project detail page at the link location
 *
 * That's it! The slideshow will automatically update.
 */
