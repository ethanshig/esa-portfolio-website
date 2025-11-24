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

                // Theme toggle in last column
                if (col === cols) {
                    cell.classList.add('theme-cell');
                    cell.id = 'theme-cell';

                    const currentTheme = localStorage.getItem('theme') || 'light';
                    const currentIcon = currentTheme === 'light' ? 'Sun.jpg' : 'Moon.jpg';
                    const hoverIcon = currentTheme === 'light' ? 'Moon.jpg' : 'Sun.jpg';

                    cell.innerHTML = `
                        <div class="flip-card" id="theme-flip-card">
                            <div class="flip-card-front">
                                <img src="images/${currentIcon}" alt="Current theme" class="theme-icon">
                            </div>
                            <div class="flip-card-back">
                                <img src="images/${hoverIcon}" alt="Toggle theme" class="theme-icon">
                            </div>
                        </div>
                    `;
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

// Theme toggle functionality
document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-cell')) {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcons(newTheme);
    }
});

function updateThemeIcons(theme) {
    const flipCard = document.getElementById('theme-flip-card');
    if (!flipCard) return;

    const currentIcon = theme === 'light' ? 'Sun.jpg' : 'Moon.jpg';
    const hoverIcon = theme === 'light' ? 'Moon.jpg' : 'Sun.jpg';

    const frontImg = flipCard.querySelector('.flip-card-front img');
    const backImg = flipCard.querySelector('.flip-card-back img');

    if (frontImg) frontImg.src = `images/${currentIcon}`;
    if (backImg) backImg.src = `images/${hoverIcon}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    generateGrid();
});
