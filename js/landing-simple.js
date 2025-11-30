// ===================================
// SIMPLIFIED LANDING - GROUP FLIP NAVIGATION
// ===================================

// Grid layout configuration
// Layout: resume (horizontal) → esa (horizontal) → about (horizontal)
//         with projects (vertical through 'e') and contact (vertical through 'a')
const gridLayout = {
    // ESA letters - always visible, bold, 2x size
    // Positioned at row 5, cols 6-7-8
    esa: [
        { letter: 'e', row: 5, col: 6, class: 'letter-esa' },
        { letter: 's', row: 5, col: 7, class: 'letter-esa' },
        { letter: 'a', row: 5, col: 8, class: 'letter-esa' }
    ],

    // Theme toggle - has its own cell
    theme: [
        { row: 1, col: 12 } // Top right corner
    ],

    // Easter egg - bouncing egg that appears on random/rotating cell
    easterEgg: [
        { row: 8, col: 3 } // Bottom left area (grid is 8 rows max)
    ],

    // Navigation words - hidden until hover
    // Each word is a group that flips together

    // "resume" - horizontal (left to right), final 'e' shares with esa's first 'e'
    // r-e-s-u-m-e at row 5, cols 1-6 (6 letters total)
    resume: [
        { letter: 'r', row: 5, col: 1 },
        { letter: 'e', row: 5, col: 2 },
        { letter: 's', row: 5, col: 3 },
        { letter: 'u', row: 5, col: 4 },
        { letter: 'm', row: 5, col: 5 },
        { letter: 'e', row: 5, col: 6 } // Shares with esa's 'e'
    ],

    // "projects" - vertical (top to bottom), 'e' shares with esa's 'e'
    // p-r-o-j-e-c-t-s at rows 1-8, col 6
    projects: [
        { letter: 'p', row: 1, col: 6 },
        { letter: 'r', row: 2, col: 6 },
        { letter: 'o', row: 3, col: 6 },
        { letter: 'j', row: 4, col: 6 },
        { letter: 'e', row: 5, col: 6 }, // Shares with esa's 'e'
        { letter: 'c', row: 6, col: 6 },
        { letter: 't', row: 7, col: 6 },
        { letter: 's', row: 8, col: 6 }
    ],

    // "about" - horizontal (left to right), first 'a' shares with esa's last 'a'
    // a-b-o-u-t at row 5, cols 8-12 (5 letters total)
    about: [
        { letter: 'a', row: 5, col: 8 }, // Shares with esa's 'a'
        { letter: 'b', row: 5, col: 9 },
        { letter: 'o', row: 5, col: 10 },
        { letter: 'u', row: 5, col: 11 },
        { letter: 't', row: 5, col: 12 }
    ],

    // "contact" - vertical (top to bottom), 'a' shares with esa's last 'a'
    // c-o-n-t-a-c-t at rows 1-7, col 8 (7 letters total)
    contact: [
        { letter: 'c', row: 1, col: 8 },
        { letter: 'o', row: 2, col: 8 },
        { letter: 'n', row: 3, col: 8 },
        { letter: 't', row: 4, col: 8 },
        { letter: 'a', row: 5, col: 8 }, // Shares with esa's 'a'
        { letter: 'c', row: 6, col: 8 },
        { letter: 't', row: 7, col: 8 }
    ]
};

// Navigation links
const navLinks = {
    resume: 'resume.html',
    projects: 'projects.html',
    about: 'about.html',
    contact: 'contact.html'
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    const gridOverlay = document.getElementById('grid-overlay');

    if (!gridOverlay) {
        console.error('Grid overlay not found');
        return;
    }

    generateGrid(gridOverlay);
    setupHoverEffects();
}

function generateGrid(gridOverlay) {
    const rows = 8;
    const cols = 12;
    const totalCells = rows * cols;

    // Create cell map for easy lookup
    const cellMap = new Map();

    // Map ESA letters
    gridLayout.esa.forEach(item => {
        const key = `${item.row}-${item.col}`;
        cellMap.set(key, {
            letter: item.letter,
            type: 'esa',
            visible: true
        });
    });

    // Map navigation letters
    Object.keys(gridLayout).forEach(wordKey => {
        if (wordKey === 'esa') return;

        gridLayout[wordKey].forEach(item => {
            const key = `${item.row}-${item.col}`;
            const existing = cellMap.get(key);

            if (existing && existing.type === 'esa') {
                // This letter is shared with ESA - mark it
                cellMap.set(key, {
                    ...existing,
                    navWord: wordKey,
                    sharedWithESA: true
                });
            } else {
                cellMap.set(key, {
                    letter: item.letter,
                    type: 'nav',
                    word: wordKey,
                    visible: false
                });
            }
        });
    });

    // Clear and generate cells
    gridOverlay.innerHTML = '';

    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols) + 1;
        const col = (i % cols) + 1;
        const key = `${row}-${col}`;

        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        const cellData = cellMap.get(key);

        // Check if this is the theme toggle cell
        const isThemeCell = gridLayout.theme.some(t => t.row === row && t.col === col);

        // Check if this is the easter egg cell
        const isEasterEggCell = gridLayout.easterEgg.some(e => e.row === row && e.col === col);

        if (isThemeCell) {
            // Theme toggle cell
            cell.classList.add('theme-cell', 'interactive');
            cell.id = 'theme-cell';

            const currentTheme = localStorage.getItem('theme') || 'light';
            const currentIcon = currentTheme === 'light' ? 'Sun.jpg' : 'Moon.jpg';
            const hoverIcon = currentTheme === 'light' ? 'Moon.jpg' : 'Sun.jpg';

            cell.innerHTML = `
                <div class="flip-card">
                    <div class="flip-card-front">
                        <img src="images/${currentIcon}" alt="Current theme" class="theme-icon">
                    </div>
                    <div class="flip-card-back">
                        <img src="images/${hoverIcon}" alt="Toggle theme" class="theme-icon">
                    </div>
                </div>
            `;
        } else if (isEasterEggCell) {
            // Easter egg cell
            cell.classList.add('easter-egg-cell', 'interactive');
            cell.id = 'easter-egg-cell';

            const currentTheme = localStorage.getItem('theme') || 'light';
            const keyIcon = currentTheme === 'light' ? 'key-light.svg' : 'key-dark.svg';

            cell.innerHTML = `
                <div class="flip-card">
                    <div class="flip-card-front">
                    </div>
                    <div class="flip-card-back">
                        <img src="images/${keyIcon}" alt="Secret key" class="easter-egg-key">
                    </div>
                </div>
            `;
        } else if (cellData) {
            if (cellData.type === 'esa') {
                // ESA letter - always visible
                cell.classList.add('esa-cell');
                if (cellData.navWord) {
                    cell.classList.add('interactive', `word-${cellData.navWord}`);
                    cell.dataset.word = cellData.navWord;
                }

                cell.innerHTML = `
                    <div class="flip-card">
                        <div class="flip-card-front">
                            <span class="letter-esa">${cellData.letter}</span>
                        </div>
                        <div class="flip-card-back">
                            <span class="letter-esa">${cellData.letter}</span>
                        </div>
                    </div>
                `;
            } else if (cellData.type === 'nav') {
                // Navigation letter - hidden initially
                cell.classList.add('interactive', `word-${cellData.word}`);
                cell.dataset.word = cellData.word;

                cell.innerHTML = `
                    <div class="flip-card">
                        <div class="flip-card-front">
                        </div>
                        <div class="flip-card-back">
                            <span class="letter-nav">${cellData.letter}</span>
                        </div>
                    </div>
                `;
            }
        } else {
            // Empty cell
            cell.innerHTML = `
                <div class="flip-card">
                    <div class="flip-card-front"></div>
                </div>
            `;
        }

        gridOverlay.appendChild(cell);
    }
}

function setupHoverEffects() {
    const allCells = document.querySelectorAll('.grid-cell.interactive');

    // Setup theme toggle
    const themeCell = document.getElementById('theme-cell');
    if (themeCell) {
        themeCell.addEventListener('click', toggleTheme);
    }

    // Setup easter egg click
    const easterEggCell = document.getElementById('easter-egg-cell');
    if (easterEggCell) {
        easterEggCell.addEventListener('click', () => {
            if (window.pageTransition) {
                window.pageTransition.transitionToPage('easter-egg.html');
            } else {
                window.location.href = 'easter-egg.html';
            }
        });
    }

    allCells.forEach(cell => {
        // Skip theme cell and easter egg cell for word hover effects
        if (cell.id === 'theme-cell' || cell.id === 'easter-egg-cell') return;
        cell.addEventListener('mouseenter', () => {
            const word = cell.dataset.word;
            if (!word) return;

            // Find all cells that belong to this word
            const wordCells = document.querySelectorAll(`.word-${word}`);

            // Add hover class to all cells in the word
            wordCells.forEach(wordCell => {
                wordCell.classList.add('word-hover');
            });
        });

        cell.addEventListener('mouseleave', () => {
            const word = cell.dataset.word;
            if (!word) return;

            // Remove hover class from all cells in the word
            const wordCells = document.querySelectorAll(`.word-${word}`);
            wordCells.forEach(wordCell => {
                wordCell.classList.remove('word-hover');
            });
        });

        // Click to navigate
        cell.addEventListener('click', () => {
            const word = cell.dataset.word;
            if (word && navLinks[word]) {
                // Use page transition if available
                if (window.pageTransition) {
                    window.pageTransition.transitionToPage(navLinks[word]);
                } else {
                    window.location.href = navLinks[word];
                }
            }
        });
    });

    // Keyboard navigation
    allCells.forEach(cell => {
        cell.setAttribute('tabindex', '0');

        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const word = cell.dataset.word;
                if (word && navLinks[word]) {
                    // Use page transition if available
                    if (window.pageTransition) {
                        window.pageTransition.transitionToPage(navLinks[word]);
                    } else {
                        window.location.href = navLinks[word];
                    }
                }
            }
        });
    });
}

// Preload pages
['index.html', 'about.html', 'resume.html', 'contact.html'].forEach(href => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
});

// Theme toggle function
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update theme cell icons
    updateThemeCell(newTheme);
}

function updateThemeCell(theme) {
    const themeCell = document.getElementById('theme-cell');
    if (!themeCell) return;

    const currentIcon = theme === 'light' ? 'Sun.jpg' : 'Moon.jpg';
    const hoverIcon = theme === 'light' ? 'Moon.jpg' : 'Sun.jpg';

    const frontImg = themeCell.querySelector('.flip-card-front img');
    const backImg = themeCell.querySelector('.flip-card-back img');

    if (frontImg) frontImg.src = `images/${currentIcon}`;
    if (backImg) backImg.src = `images/${hoverIcon}`;
}

console.log('Landing page initialized');
console.log('Grid layout:', gridLayout);
console.log('Hover over any letter in a word to see the full word!');
