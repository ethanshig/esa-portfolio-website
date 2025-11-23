// ===================================
// LANDING PAGE WITH INTEGRATED NAVIGATION
// ===================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanding);
} else {
    initLanding();
}

function initLanding() {
    const gridOverlay = document.getElementById('grid-overlay');
    const esaText = document.getElementById('esa-text');

    if (!gridOverlay) {
        console.error('Grid overlay element not found');
        return;
    }

    // Get grid center position where "esa" will be
    const gridDimensions = getGridDimensions();
    const centerRow = Math.floor(gridDimensions.rows / 2);
    const centerCol = Math.floor(gridDimensions.cols / 2);

    // Define integrated navigation:
    // Words that blend with the "esa" letters
    const integratedNav = [
        {
            word: 'resume',
            sharedLetter: 'e',
            position: 'before', // word comes before 'esa'
            letters: ['r', 'e', 's', 'u', 'm'],
            link: 'resume.html',
            baseRow: centerRow,
            baseCol: centerCol - 3 // starts 3 cells to the left of 'e'
        },
        {
            word: 'projects',
            sharedLetter: 's',
            position: 'around', // wraps around the 's'
            letters: ['p', 'r', 'o', 'j', 'e', 'c', 't'],
            link: 'index.html#projects',
            baseRow: centerRow - 3,
            baseCol: centerCol + 1 // 's' is at centerCol+1
        },
        {
            word: 'contact',
            sharedLetter: 'a',
            position: 'after',
            letters: ['c', 'o', 'n', 't', 'a', 'c', 't'],
            link: 'contact.html',
            baseRow: centerRow + 2,
            baseCol: centerCol + 2 // 'a' is at centerCol+2
        },
        {
            word: 'about',
            sharedLetter: 'a',
            position: 'vertical',
            letters: ['a', 'b', 'o', 'u', 't'],
            link: 'about.html',
            baseRow: centerRow,
            baseCol: centerCol + 2 // 'a' is at centerCol+2, go vertical
        }
    ];

    setupGrid(gridOverlay, gridDimensions, centerRow, centerCol, integratedNav);
}

function getGridDimensions() {
    const width = window.innerWidth;
    if (width <= 480) return { cols: 6, rows: 8 };
    if (width <= 768) return { cols: 8, rows: 10 };
    if (width <= 1024) return { cols: 10, rows: 8 };
    return { cols: 12, rows: 10 };
}

function setupGrid(gridOverlay, gridDimensions, centerRow, centerCol, integratedNav) {
    generateGrid(gridOverlay, gridDimensions, centerRow, centerCol, integratedNav);

    // Regenerate grid on resize (debounced)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newDimensions = getGridDimensions();
            const newCenterRow = Math.floor(newDimensions.rows / 2);
            const newCenterCol = Math.floor(newDimensions.cols / 2);
            generateGrid(gridOverlay, newDimensions, newCenterRow, newCenterCol, integratedNav);
        }, 250);
    });

    // Make grid interactive after animations complete
    setTimeout(() => {
        gridOverlay.classList.add('active');
    }, 7000);

    // Setup ESA path animation
    setupESAAnimation();

    // Setup keyboard navigation
    setupKeyboardNav();

    // Preload pages
    preloadPages();
}

function generateGrid(gridOverlay, dimensions, centerRow, centerCol, integratedNav) {
    const { cols, rows } = dimensions;
    const totalCells = cols * rows;

    // Update grid template
    gridOverlay.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridOverlay.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Clear existing cells
    gridOverlay.innerHTML = '';

    // Create map of special cells (where navigation letters go)
    const specialCells = new Map();

    // Map out integrated navigation letters
    integratedNav.forEach(nav => {
        if (nav.position === 'before') {
            // Horizontal before esa
            nav.letters.forEach((letter, index) => {
                const cellKey = `${nav.baseRow}-${nav.baseCol + index}`;
                specialCells.set(cellKey, {
                    letter,
                    link: nav.link,
                    word: nav.word
                });
            });
        } else if (nav.position === 'around') {
            // Vertical or wrapped around
            nav.letters.forEach((letter, index) => {
                const cellKey = `${nav.baseRow + index}-${nav.baseCol}`;
                specialCells.set(cellKey, {
                    letter,
                    link: nav.link,
                    word: nav.word
                });
            });
        } else if (nav.position === 'vertical') {
            // Vertical down from 'a'
            nav.letters.forEach((letter, index) => {
                if (index === 0) return; // skip first 'a' (shared with esa)
                const cellKey = `${nav.baseRow + index}-${nav.baseCol}`;
                specialCells.set(cellKey, {
                    letter,
                    link: nav.link,
                    word: nav.word
                });
            });
        } else if (nav.position === 'after') {
            // Horizontal after or around
            nav.letters.forEach((letter, index) => {
                const cellKey = `${nav.baseRow + Math.floor(index / 3)}-${nav.baseCol + (index % 3)}`;
                specialCells.set(cellKey, {
                    letter,
                    link: nav.link,
                    word: nav.word
                });
            });
        }
    });

    // Create cells
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols) + 1;
        const col = (i % cols) + 1;
        const cellKey = `${row}-${col}`;

        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        // Check if this is an "esa" cell (center area)
        const isESACell = row === centerRow &&
                         (col === centerCol || col === centerCol + 1 || col === centerCol + 2);

        // Check if this is a navigation letter cell
        const specialCell = specialCells.get(cellKey);

        if (isESACell) {
            // These cells are where "esa" sits - make them invisible in grid
            cell.classList.add('esa-cell');
            cell.style.border = 'none';
            cell.innerHTML = '<div class="flip-card"><div class="flip-card-front"></div></div>';
        } else if (specialCell) {
            // Navigation letter cells
            cell.classList.add('interactive', 'nav-letter');
            cell.innerHTML = `
                <div class="flip-card">
                    <div class="flip-card-front">
                        <span class="integrated-letter">${specialCell.letter}</span>
                    </div>
                    <a href="${specialCell.link}" class="flip-card-back">
                        → ${specialCell.word}
                    </a>
                </div>
            `;
        } else {
            // Regular cells - some with decoration
            if (Math.random() < 0.12) {
                const decorations = ['○', '◐', '+', '·', '×'];
                const randomDecor = decorations[Math.floor(Math.random() * decorations.length)];
                cell.innerHTML = `
                    <div class="flip-card">
                        <div class="flip-card-front">
                            <span class="cell-decoration">${randomDecor}</span>
                        </div>
                    </div>
                `;
            } else {
                cell.innerHTML = '<div class="flip-card"><div class="flip-card-front"></div></div>';
            }
        }

        gridOverlay.appendChild(cell);
    }

    // Add special styling for integrated letters
    const style = document.createElement('style');
    style.textContent = `
        .integrated-letter {
            font-family: var(--font-heading);
            font-size: clamp(1.5rem, 3vw, 2.5rem);
            font-weight: 500;
            color: var(--color-primary);
            letter-spacing: -0.02em;
            opacity: 0;
            animation: revealLetter 0.5s ease-in-out 5.5s forwards;
        }

        @keyframes revealLetter {
            to { opacity: 1; }
        }

        .esa-cell {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

function setupESAAnimation() {
    const esaGlow = document.getElementById('esa-glow');
    const esaPath = document.getElementById('esa-path');

    if (esaGlow && esaPath) {
        const pathData = esaPath.getAttribute('d');
        if (pathData) {
            esaGlow.style.offsetPath = `path("${pathData}")`;
            console.log('ESA animation initialized');
        }
    }
}

function setupKeyboardNav() {
    // Allow Enter key to activate flip cards
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.activeElement.classList.contains('interactive')) {
            const link = document.activeElement.querySelector('.flip-card-back');
            if (link) {
                window.location.href = link.getAttribute('href');
            }
        }
    });

    // Skip shortcut
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            window.location.href = 'index.html#projects';
        }
    });

    // Make flip cards focusable
    setTimeout(() => {
        document.querySelectorAll('.grid-cell.interactive').forEach(cell => {
            cell.setAttribute('tabindex', '0');
        });
    }, 100);
}

function preloadPages() {
    const preloadLinks = ['index.html', 'about.html', 'resume.html', 'contact.html'];
    preloadLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
    });
}
