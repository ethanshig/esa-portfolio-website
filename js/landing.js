// ===================================
// LANDING PAGE GRID GENERATION
// ===================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanding);
} else {
    initLanding();
}

function initLanding() {
    const gridOverlay = document.getElementById('grid-overlay');

    if (!gridOverlay) {
        console.error('Grid overlay element not found');
        return;
    }

    // Continue with initialization
    setupGrid(gridOverlay);
}

function setupGrid(gridOverlay) {

// Navigation links configuration
const navigationCells = [
    { row: 2, col: 5, label: 'Projects', link: 'index.html#projects' },
    { row: 3, col: 7, label: 'About', link: 'about.html' },
    { row: 5, col: 3, label: 'Resume', link: 'resume.html' },
    { row: 6, col: 8, label: 'Contact', link: 'contact.html' }
];

// Decorative text for random cells (like your sketch)
const decorativeText = [
    's', 't', 'c', 'e', 'o', 'n', 'p',
    '+', '○', '◐', 'c', '3', 'b', 'o'
];

// Get grid dimensions based on screen size
function getGridDimensions() {
    const width = window.innerWidth;
    if (width <= 480) return { cols: 4, rows: 6 };
    if (width <= 768) return { cols: 6, rows: 8 };
    if (width <= 1024) return { cols: 8, rows: 6 };
    return { cols: 10, rows: 8 };
}

}

// Generate grid cells
function generateGrid(gridOverlay) {
    if (!gridOverlay) return;
    const { cols, rows } = getGridDimensions();
    const totalCells = cols * rows;

    // Update grid template
    gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Clear existing cells
    gridOverlay.innerHTML = '';

    // Create cells
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols) + 1;
        const col = (i % cols) + 1;

        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        // Check if this cell should have a navigation link
        const navCell = navigationCells.find(
            nav => nav.row === row && nav.col === col
        );

        if (navCell) {
            // Create flip card for navigation
            cell.classList.add('interactive');
            cell.innerHTML = `
                <div class="flip-card">
                    <div class="flip-card-front"></div>
                    <a href="${navCell.link}" class="flip-card-back">
                        ${navCell.label}
                    </a>
                </div>
            `;
        } else {
            // Randomly add decorative text to some cells
            if (Math.random() < 0.15) {
                const randomText = decorativeText[Math.floor(Math.random() * decorativeText.length)];
                cell.innerHTML = `
                    <div class="flip-card">
                        <div class="flip-card-front">
                            <span class="cell-decoration">${randomText}</span>
                        </div>
                    </div>
                `;
            } else {
                cell.innerHTML = '<div class="flip-card"><div class="flip-card-front"></div></div>';
            }
        }

        gridOverlay.appendChild(cell);
    }
}

    // Initialize grid on load
    generateGrid(gridOverlay);

    // Regenerate grid on resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => generateGrid(gridOverlay), 250);
    });

    // ===================================
    // TIMING SEQUENCE
    // ===================================

    // Make grid interactive after animations complete
    setTimeout(() => {
        gridOverlay.classList.add('active');
    }, 7000); // 7 seconds: 3s glow + 2s text reveal + 1.5s grid + 0.5s buffer

    // ===================================
    // ESA PATH SETUP
    // ===================================

    // Ensure the glow follows the path
    const esaGlow = document.getElementById('esa-glow');
    const esaPath = document.getElementById('esa-path');

    if (esaGlow && esaPath) {
        const pathData = esaPath.getAttribute('d');
        if (pathData) {
            esaGlow.style.offsetPath = `path("${pathData}")`;
            console.log('ESA animation initialized');
        }
    }

    // ===================================
    // KEYBOARD NAVIGATION
    // ===================================

    // Allow Enter key to activate flip cards
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.activeElement.classList.contains('interactive')) {
            const link = document.activeElement.querySelector('.flip-card-back');
            if (link) {
                window.location.href = link.getAttribute('href');
            }
        }
    });

    // Make flip cards focusable (after grid is generated)
    setTimeout(() => {
        document.querySelectorAll('.grid-cell.interactive').forEach(cell => {
            cell.setAttribute('tabindex', '0');
        });
    }, 100);

    // ===================================
    // SKIP TO PORTFOLIO SHORTCUT
    // ===================================

    // Allow pressing 'P' to skip directly to portfolio
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            window.location.href = 'index.html#projects';
        }
    });

    // ===================================
    // PRELOAD NEXT PAGES
    // ===================================

    // Preload linked pages for faster navigation
    const preloadLinks = ['index.html', 'about.html', 'resume.html', 'contact.html'];

    preloadLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
    });

    // ===================================
    // ANALYTICS TRIGGER (Optional)
    // ===================================

    // Track when grid becomes interactive
    setTimeout(() => {
        console.log('Landing page reveal sequence complete');
    }, 7000);
}
