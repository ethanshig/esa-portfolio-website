/**
 * Resume Page - Grid Background with Navigation and Individual Cell Flips
 */

// Navigation links
const navLinks = {
    'projects': 'projects-grid.html',
    'about': 'about.html',
    'resume': 'resume.html',
    'contact': 'contact.html'
};

// Card data - defines position and content for each card area
const cardData = {
    'download-card': {
        startCol: 1, startRow: 2, cols: 10, rows: 1,
        frontContent: '<h2>Resume</h2><p class="card-subtitle">View my experience</p>',
        backContent: '<a href="assets/resume/Your-Name-Resume.pdf" download class="download-link">Download PDF</a>'
    },
    'education-card': {
        startCol: 1, startRow: 4, cols: 4, rows: 2,
        frontContent: '<h2>Education</h2>',
        backContent: `
            <div class="resume-item">
                <h3>B.S. Sustainable Design</h3>
                <p class="institution">University of Illinois Urbana-Champaign</p>
                <p class="date">2022 - 2026</p>
                <p class="detail">GPA: 3.8/4.0 | Dean's List</p>
            </div>
            <div class="resume-item">
                <h3>LEED Green Associate</h3>
                <p class="institution">U.S. Green Building Council</p>
                <p class="date">2023</p>
            </div>
        `
    },
    'experience-card': {
        startCol: 7, startRow: 4, cols: 4, rows: 2,
        frontContent: '<h2>Experience</h2><p class="card-subtitle">Design Intern</p>',
        backContent: `
            <h3>Design Intern</h3>
            <p class="institution">Architecture Firm Name</p>
            <p class="date">Summer 2024</p>
            <ul class="detail-list">
                <li>Sustainable design concepts for mixed-use development</li>
                <li>3D modeling with Rhino and V-Ray</li>
                <li>Energy modeling with Climate Studio</li>
                <li>Low-carbon construction research</li>
            </ul>
        `
    },
    'experience-card-2': {
        startCol: 6, startRow: 3, cols: 6, rows: 1,
        frontContent: '<h2>Research</h2><p class="card-subtitle">Student Assistant</p>',
        backContent: `
            <h3>Student Research Assistant</h3>
            <p class="institution">Sustainable Design Lab</p>
            <p class="date">2023 - 2024</p>
            <ul class="detail-list">
                <li>Embodied carbon research</li>
                <li>Renewable energy systems data</li>
                <li>Symposium organization (200+ attendees)</li>
            </ul>
        `
    },
    'skills-card': {
        startCol: 0, startRow: 5, cols: 4, rows: 2,
        frontContent: '<h2>Skills</h2><p class="card-subtitle">Technical Proficiency</p>',
        backContent: `
            <div class="skill-group">
                <h4>Design</h4>
                <p>Rhino, Grasshopper, AutoCAD, SketchUp, Revit</p>
            </div>
            <div class="skill-group">
                <h4>Sustainability</h4>
                <p>Climate Studio, Ladybug, eQuest, LEED, LCA</p>
            </div>
            <div class="skill-group">
                <h4>Visualization</h4>
                <p>V-Ray, Enscape, Adobe Suite</p>
            </div>
        `
    },
    'awards-card': {
        startCol: 4, startRow: 5, cols: 4, rows: 2,
        frontContent: '<h2>Awards</h2><p class="card-subtitle">Recognition</p>',
        backContent: `
            <div class="resume-item">
                <h3>First Place</h3>
                <p class="institution">Regional Sustainable Design Competition</p>
                <p class="date">2024</p>
                <p class="detail">Net-zero housing complex design</p>
            </div>
            <div class="resume-item">
                <h3>Student Scholarship</h3>
                <p class="institution">American Institute of Architects</p>
                <p class="date">2023</p>
            </div>
        `
    },
    'leadership-card': {
        startCol: 8, startRow: 5, cols: 4, rows: 2,
        frontContent: '<h2>Leadership</h2><p class="card-subtitle">Student Organizations</p>',
        backContent: `
            <div class="resume-item">
                <h3>President</h3>
                <p class="institution">Sustainable Design Student Org</p>
                <p class="date">2024 - Present</p>
                <p class="detail">Lead 50+ students in green building initiatives</p>
            </div>
            <div class="resume-item">
                <h3>Member</h3>
                <p class="institution">AIAS</p>
                <p class="date">2023 - Present</p>
            </div>
        `
    },
    'contact-card': {
        startCol: 1, startRow: 7, cols: 10, rows: 1,
        frontContent: '<h2>Get in Touch</h2><p class="card-subtitle">Let\'s connect</p>',
        backContent: '<a href="contact.html" class="cta-link">Contact Me</a>'
    }
};

// ===================================
// GRID GENERATION
// ===================================
function generateGrid() {
    const gridBackground = document.getElementById('grid-background');
    if (!gridBackground) return;

    const rows = 8;
    const cols = 12;

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
    if (fullWord.toLowerCase() === 'resume') {
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

// ===================================
// CONTENT CARDS - INDIVIDUAL CELL FLIPS
// ===================================
function generateContentCards() {
    const container = document.querySelector('.resume-container');
    if (!container) return;

    container.innerHTML = '';

    // Generate each card area
    Object.entries(cardData).forEach(([cardClass, data]) => {
        const cardArea = document.createElement('div');
        cardArea.className = `resume-card ${cardClass}`;

        // Calculate total cells in this card area
        const totalCells = data.cols * data.rows;

        // Create wrapper for full-card content (front and back) that sits above the flip cells
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'card-content-wrapper';

        // Front content layer (spans entire card)
        const frontContentLayer = document.createElement('div');
        frontContentLayer.className = 'card-front-layer';
        frontContentLayer.innerHTML = `<div class="card-content">${data.frontContent}</div>`;
        contentWrapper.appendChild(frontContentLayer);

        // Back content layer (spans entire card)
        const backContentLayer = document.createElement('div');
        backContentLayer.className = 'card-back-layer';
        backContentLayer.innerHTML = `<div class="card-content-detailed">${data.backContent}</div>`;
        contentWrapper.appendChild(backContentLayer);

        cardArea.appendChild(contentWrapper);

        // Create individual flip cells for visual effect (no content, just backgrounds)
        for (let i = 0; i < totalCells; i++) {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'flip-cell';

            const flipCard = document.createElement('div');
            flipCard.className = 'flip-card-resume';

            const front = document.createElement('div');
            front.className = 'flip-card-front-resume';

            const back = document.createElement('div');
            back.className = 'flip-card-back-resume';

            // No content - just background colors for flip effect
            flipCard.appendChild(front);
            flipCard.appendChild(back);
            cellDiv.appendChild(flipCard);
            cardArea.appendChild(cellDiv);
        }

        container.appendChild(cardArea);
    });

    // Add hover effects
    setupCardHoverEffects();
}

function setupCardHoverEffects() {
    const cards = document.querySelectorAll('.resume-card');

    cards.forEach(card => {
        const cells = card.querySelectorAll('.flip-cell');

        card.addEventListener('mouseenter', () => {
            cells.forEach((cell, index) => {
                setTimeout(() => {
                    cell.classList.add('flipped');
                }, index * 30); // Stagger the flip
            });
        });

        card.addEventListener('mouseleave', () => {
            cells.forEach((cell, index) => {
                setTimeout(() => {
                    cell.classList.remove('flipped');
                }, index * 30); // Stagger the flip back
            });
        });
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
    generateContentCards();
});
