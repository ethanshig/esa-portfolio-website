/**
 * LANDING PAGE ANIMATION SEQUENCE
 * Per MASTER-PLAN Section 4
 *
 * Timeline:
 * Phase 1: Grid lines draw in sequentially (1500-2000ms)
 * Phase 2: ESA cells flip e→s→a (with delays)
 * Phase 3: 'a' struggles, gets "smacked" (1000-1500ms)
 * Phase 4: Navigation appears on hover only
 */

/* ===================================
   GRID LAYOUT CONFIGURATION
   12×8 grid with navigation words
   =================================== */
const gridLayout = {
    rows: 8,
    cols: 12,
    // ESA letters at row 5, columns 6-7-8
    esa: [
        { letter: 'e', row: 5, col: 6 },
        { letter: 's', row: 5, col: 7 },
        { letter: 'a', row: 5, col: 8 }
    ],
    // Navigation words
    resume: [
        { letter: 'r', row: 5, col: 1, word: 'resume' },
        { letter: 'e', row: 5, col: 2, word: 'resume' },
        { letter: 's', row: 5, col: 3, word: 'resume' },
        { letter: 'u', row: 5, col: 4, word: 'resume' },
        { letter: 'm', row: 5, col: 5, word: 'resume' },
        { letter: 'e', row: 5, col: 6, word: 'resume', shared: 'esa' } // Shares with ESA
    ],
    about: [
        { letter: 'a', row: 5, col: 8, word: 'about', shared: 'esa' }, // Shares with ESA
        { letter: 'b', row: 5, col: 9, word: 'about' },
        { letter: 'o', row: 5, col: 10, word: 'about' },
        { letter: 'u', row: 5, col: 11, word: 'about' },
        { letter: 't', row: 5, col: 12, word: 'about' }
    ],
    projects: [
        { letter: 'p', row: 1, col: 6, word: 'projects' },
        { letter: 'r', row: 2, col: 6, word: 'projects' },
        { letter: 'o', row: 3, col: 6, word: 'projects' },
        { letter: 'j', row: 4, col: 6, word: 'projects' },
        { letter: 'e', row: 5, col: 6, word: 'projects', shared: 'esa' }, // Shares with ESA
        { letter: 'c', row: 6, col: 6, word: 'projects' },
        { letter: 't', row: 7, col: 6, word: 'projects' },
        { letter: 's', row: 8, col: 6, word: 'projects' }
    ],
    contact: [
        { letter: 'c', row: 1, col: 8, word: 'contact' },
        { letter: 'o', row: 2, col: 8, word: 'contact' },
        { letter: 'n', row: 3, col: 8, word: 'contact' },
        { letter: 't', row: 4, col: 8, word: 'contact' },
        { letter: 'a', row: 5, col: 8, word: 'contact', shared: 'esa' }, // Shares with ESA
        { letter: 'c', row: 6, col: 8, word: 'contact' },
        { letter: 't', row: 7, col: 8, word: 'contact' }
    ]
};

/* ===================================
   ANIMATION TIMING (from MASTER-PLAN)
   =================================== */
const TIMING = {
    // Phase 1: Grid drawing
    gridDrawStart: 0,
    gridLineDelay: 80,              // 50-100ms per line
    gridTotalDuration: 1800,        // 1500-2000ms total

    // Phase 2: ESA flip
    esaStartDelay: 2200,            // Grid complete + 400ms
    esaFlipDuration: 600,           // 400-600ms per flip
    esaBetweenFlips: 200,           // 200ms between flips

    // Phase 3: 'a' struggle
    aStruggleAttempt1Delay: 3600,  // After 's' flips
    aStruggleAttempt1Duration: 500,
    aStruggleAttempt2Delay: 4100,  // 500ms after attempt 1
    aStruggleAttempt2Duration: 500,
    aSuccessDelay: 4700,            // Final flip
    aSuccessDuration: 600
};

/* ===================================
   EASTER EGG CONFIGURATION
   Daily rotation (from MASTER-PLAN)
   =================================== */
function getEasterEggPosition() {
    // Rotate daily based on date
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);

    // Available cells (avoid ESA and navigation)
    const availableCells = [];
    for (let row = 1; row <= 8; row++) {
        for (let col = 1; col <= 12; col++) {
            // Skip ESA, navigation, and theme toggle cells
            if (!isCellOccupied(row, col)) {
                availableCells.push({ row, col });
            }
        }
    }

    // Select cell based on day
    const index = dayOfYear % availableCells.length;
    return availableCells[index];
}

function isCellOccupied(row, col) {
    // Check if cell contains ESA, navigation, or theme toggle
    if (row === 5 && col >= 6 && col <= 8) return true; // ESA
    if (row === 5) return true; // Resume and About horizontal
    if (col === 6 || col === 8) return true; // Projects and Contact vertical
    if (row === 1 && col === 12) return true; // Theme toggle
    return false;
}

/* ===================================
   INITIALIZATION
   =================================== */
document.addEventListener('DOMContentLoaded', function() {
    const gridOverlay = document.querySelector('.grid-overlay');
    if (!gridOverlay) return;

    // Generate grid structure
    generateGrid(gridOverlay);

    // Start animation sequence
    startAnimationSequence();
});

/* ===================================
   GRID GENERATION
   =================================== */
function generateGrid(container) {
    // Create all grid cells
    for (let row = 1; row <= gridLayout.rows; row++) {
        for (let col = 1; col <= gridLayout.cols; col++) {
            const cell = createCell(row, col);
            container.appendChild(cell);
        }
    }

    // Create grid lines (will be animated)
    createGridLines(container);

    // Setup hover effects for navigation words
    setupWordHoverEffects();

    // Add easter egg
    addEasterEgg();
}

function createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.style.gridRow = row;
    cell.style.gridColumn = col;
    cell.dataset.row = row;
    cell.dataset.col = col;

    // Check if this cell contains a letter
    const letterData = getCellLetter(row, col);

    if (letterData) {
        cell.innerHTML = `
            <div class="flip-card">
                <div class="flip-card-front"></div>
                <div class="flip-card-back">
                    <span class="${letterData.type === 'esa' ? 'letter-esa' : 'letter-nav'}">${letterData.letter}</span>
                </div>
            </div>
        `;

        cell.dataset.letter = letterData.letter;
        if (letterData.word) {
            cell.dataset.word = letterData.word;
            cell.classList.add(`word-${letterData.word}`);
        }
        if (letterData.type === 'esa') {
            cell.classList.add('esa-letter');
        }
    }

    // Theme toggle cell
    if (row === 1 && col === 12) {
        cell.innerHTML = `
            <div class="theme-toggle-cell" onclick="toggleTheme()">
                <span class="theme-icon-landing" id="theme-icon-landing">☀</span>
            </div>
        `;
    }

    return cell;
}

function getCellLetter(row, col) {
    // Check ESA
    for (const esa of gridLayout.esa) {
        if (esa.row === row && esa.col === col) {
            return { letter: esa.letter, type: 'esa' };
        }
    }

    // Check navigation words
    for (const word of ['resume', 'about', 'projects', 'contact']) {
        for (const letterObj of gridLayout[word]) {
            if (letterObj.row === row && letterObj.col === col) {
                return {
                    letter: letterObj.letter,
                    word: letterObj.word,
                    type: letterObj.shared ? 'esa' : 'nav',
                    shared: letterObj.shared
                };
            }
        }
    }

    return null;
}

function createGridLines(container) {
    // Horizontal lines (rows 1-7, row 0 and 8 are edges)
    for (let i = 1; i < gridLayout.rows; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line horizontal';
        line.dataset.row = i;
        container.appendChild(line);
    }

    // Vertical lines (cols 1-11, col 0 and 12 are edges)
    for (let i = 1; i < gridLayout.cols; i++) {
        const line = document.createElement('div');
        line.className = 'grid-line vertical';
        line.dataset.col = i;
        container.appendChild(line);
    }
}

function addEasterEgg() {
    const eggPos = getEasterEggPosition();
    const eggCell = document.querySelector(`.grid-cell[data-row="${eggPos.row}"][data-col="${eggPos.col}"]`);

    if (eggCell && !eggCell.querySelector('.flip-card')) {
        eggCell.innerHTML = `
            <div class="flip-card">
                <div class="flip-card-front"></div>
                <div class="flip-card-back" style="cursor: pointer;" onclick="openEasterEgg()">
                    <div class="easter-egg-icon">🥚</div>
                </div>
            </div>
        `;
    }
}

/* ===================================
   ANIMATION SEQUENCE
   =================================== */
function startAnimationSequence() {
    // Phase 1: Draw grid lines
    setTimeout(() => animateGridLines(), TIMING.gridDrawStart);

    // Phase 2: Flip ESA letters (e→s)
    setTimeout(() => flipCell('e'), TIMING.esaStartDelay);
    setTimeout(() => flipCell('s'), TIMING.esaStartDelay + TIMING.esaFlipDuration + TIMING.esaBetweenFlips);

    // Phase 3: 'a' struggles
    setTimeout(() => animateAStruggle(), TIMING.aStruggleAttempt1Delay);
}

function animateGridLines() {
    const horizontalLines = document.querySelectorAll('.grid-line.horizontal');
    const verticalLines = document.querySelectorAll('.grid-line.vertical');

    // Draw horizontal lines sequentially
    horizontalLines.forEach((line, index) => {
        setTimeout(() => {
            line.classList.add('draw');
        }, index * TIMING.gridLineDelay);
    });

    // Draw vertical lines after horizontals
    const horizontalDelay = horizontalLines.length * TIMING.gridLineDelay;
    verticalLines.forEach((line, index) => {
        setTimeout(() => {
            line.classList.add('draw');
        }, horizontalDelay + (index * TIMING.gridLineDelay));
    });
}

function flipCell(letter) {
    const cell = document.querySelector(`.grid-cell[data-letter="${letter}"].esa-letter`);
    if (cell) {
        cell.classList.add('flipped');
    }
}

function animateAStruggle() {
    const aCell = document.querySelector(`.grid-cell[data-letter="a"].esa-letter`);
    if (!aCell) return;

    const flipCard = aCell.querySelector('.flip-card');

    // Attempt 1: Flip to 45° then fall back
    flipCard.style.animation = 'struggleAttempt1 500ms ease-in-out';

    // Attempt 2: Flip to 70° then fall back
    setTimeout(() => {
        flipCard.style.animation = 'struggleAttempt2 500ms ease-in-out';
    }, TIMING.aStruggleAttempt2Delay - TIMING.aStruggleAttempt1Delay);

    // Success: Final flip
    setTimeout(() => {
        flipCard.style.animation = '';
        aCell.classList.add('flipped');
    }, TIMING.aSuccessDelay - TIMING.aStruggleAttempt1Delay);
}

/* ===================================
   HOVER EFFECTS - Wave Flip
   =================================== */
function setupWordHoverEffects() {
    const words = ['resume', 'projects', 'about', 'contact'];

    words.forEach(word => {
        const cells = document.querySelectorAll(`.word-${word}`);

        cells.forEach(cell => {
            cell.addEventListener('mouseenter', () => {
                // Add hover class to all cells in word (wave effect)
                cells.forEach((c, index) => {
                    setTimeout(() => {
                        c.classList.add('word-hover');
                        c.classList.add('flipped');
                    }, index * 50); // Sequential flip
                });
            });

            cell.addEventListener('mouseleave', () => {
                cells.forEach(c => {
                    c.classList.remove('word-hover');
                });
            });

            // Click to navigate
            cell.addEventListener('click', () => {
                navigateToPage(word);
            });
        });
    });
}

function navigateToPage(word) {
    const pages = {
        'resume': 'resume.html',
        'projects': 'projects.html',
        'about': 'about.html',
        'contact': 'contact.html'
    };

    if (pages[word]) {
        window.location.href = pages[word];
    }
}

/* ===================================
   THEME TOGGLE
   =================================== */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update icon
    const icon = document.getElementById('theme-icon-landing');
    if (icon) {
        icon.textContent = newTheme === 'dark' ? '☀' : '☽';
    }
}

// Initialize theme from localStorage
(function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.getElementById('theme-icon-landing');
    if (icon) {
        icon.textContent = savedTheme === 'dark' ? '☀' : '☽';
    }
})();

/* ===================================
   EASTER EGG
   =================================== */
function openEasterEgg() {
    window.location.href = 'easter-egg.html';
}
