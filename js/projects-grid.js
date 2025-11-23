// ===================================
// PROJECTS GRID PAGE
// Grid generation and flip interactions
// ===================================

// Project data
const projectsData = [
    {
        id: 1,
        title: 'Sustainable Housing',
        year: '2024',
        tags: ['Residential', 'Net-Zero'],
        link: 'projects/project1.html'
    },
    {
        id: 2,
        title: 'Green Office Tower',
        year: '2024',
        tags: ['Commercial', 'LEED'],
        link: 'projects/project2.html'
    },
    {
        id: 3,
        title: 'Urban Eco-Corridor',
        year: '2023',
        tags: ['Urban Planning', 'Green Space'],
        link: 'projects/project3.html'
    },
    {
        id: 4,
        title: 'Modular Eco-Home',
        year: '2023',
        tags: ['Residential', 'Modular'],
        link: 'projects/project4.html'
    },
    {
        id: 5,
        title: 'Learning Center',
        year: '2023',
        tags: ['Commercial', 'Geothermal'],
        link: 'projects/project5.html'
    }
];

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
    const cols = getGridColumns();

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

function getGridColumns() {
    const width = window.innerWidth;
    if (width <= 768) return 6;
    if (width <= 1024) return 10;
    return 12;
}

function createNavCell(cell, letter, fullWord) {
    cell.classList.add('nav-letter-cell');
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
// PROJECT INFO ROWS
// ===================================
function generateProjectInfoRows() {
    const projectItems = document.querySelectorAll('.project-item');

    projectItems.forEach((item, index) => {
        const projectData = projectsData[index];
        if (!projectData) return;

        const infoRow = item.querySelector('.project-info-row');
        if (!infoRow) return;

        const cellCount = 10; // 10 cells across

        // Distribute content across cells
        // Cells 1-4: Title
        // Cells 5-6: Year
        // Cells 7-10: Tags

        for (let i = 0; i < cellCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'info-cell';

            const flipCard = document.createElement('div');
            flipCard.className = 'info-flip-card';

            const front = document.createElement('div');
            front.className = 'info-card-front';

            const back = document.createElement('div');
            back.className = 'info-card-back';

            // Front: Empty (nothing until hover)
            front.textContent = '';

            // Back: Information spans across cells
            // First 4 cells: Project Title (only show in first cell)
            if (i === 0) {
                back.innerHTML = `<span class="info-span-text">${projectData.title}</span>`;
            }
            // Cells 4-5: Year (only show in cell 4)
            else if (i === 4) {
                back.innerHTML = `<span class="info-span-text">${projectData.year}</span>`;
            }
            // Cells 6-9: Tags (only show in cell 6)
            else if (i === 6) {
                back.innerHTML = `<span class="info-span-text">${projectData.tags.join(' • ')}</span>`;
            }

            flipCard.appendChild(front);
            flipCard.appendChild(back);
            cell.appendChild(flipCard);
            infoRow.appendChild(cell);
        }

        // Make entire project clickable
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            if (projectData.link) {
                if (window.pageTransition) {
                    window.pageTransition.transitionToPage(projectData.link);
                } else {
                    window.location.href = projectData.link;
                }
            }
        });
    });
}

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    generateGrid();
    generateProjectInfoRows();
});

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

// Handle window resize
window.addEventListener('resize', () => {
    const gridBackground = document.getElementById('grid-background');
    if (gridBackground) {
        gridBackground.innerHTML = '';
        generateGrid();
    }
});
