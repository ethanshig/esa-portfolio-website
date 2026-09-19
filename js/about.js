/**
 * About Page - Grid Background with Navigation
 */

// Navigation links
const navLinks = {
    'projects': 'projects-grid.html',
    'about': 'about.html',
    'resume': 'resume.html',
    'contact': 'contact.html'
};

// ===================================
// GRID GENERATION
// ===================================
function generateGrid() {
    const gridBackground = document.getElementById('grid-background');
    if (!gridBackground) return;

    const rows = 8;
    const cols = 12; // Fixed 12x8 grid

    gridBackground.innerHTML = '';

    // Generate grid cells
    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);

            // Navigation row (row 1)
            if (row === 1) {
                cell.classList.add('nav-cell');

                // ESA in cell (1,1)
                if (col === 1) {
                    cell.classList.add('esa-cell');
                    cell.textContent = 'esa';
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => {
                        if (window.pageTransition) {
                            window.pageTransition.transitionToPage('index-landing.html');
                        } else {
                            window.location.href = 'index-landing.html';
                        }
                    });
                }

                // Navigation letters (centered: cols 5-8)
                if (col === 5) {
                    createNavCell(cell, 'P', 'Projects');
                } else if (col === 6) {
                    createNavCell(cell, 'A', 'About');
                } else if (col === 7) {
                    createNavCell(cell, 'R', 'Resume');
                } else if (col === 8) {
                    createNavCell(cell, 'C', 'Contact');
                }
            }

            gridBackground.appendChild(cell);
        }
    }
}

function createNavCell(cell, letter, fullWord) {
    cell.classList.add('nav-letter-cell');

    // Mark active nav item
    if (fullWord.toLowerCase() === 'about') {
        cell.classList.add('active');
    }

    cell.innerHTML = `
        <div class="flip-card">
            <div class="flip-card-front">${letter}</div>
            <div class="flip-card-back">${fullWord}</div>
        </div>
    `;

    // Click to navigate
    cell.addEventListener('click', () => {
        const wordKey = fullWord.toLowerCase();
        if (navLinks[wordKey]) {
            if (window.pageTransition) {
                window.pageTransition.transitionToPage(navLinks[wordKey]);
            } else {
                window.location.href = navLinks[wordKey];
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    generateGrid();
});
