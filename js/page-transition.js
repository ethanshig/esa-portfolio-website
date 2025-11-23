// ===================================
// GRID-BASED PAGE TRANSITION V2
// Double-flip: Exit → Navigate → Reveal
// ===================================

class PageTransition {
    constructor() {
        this.overlay = null;
        this.cells = [];
        this.isTransitioning = false;
        this.init();
    }

    init() {
        // Create transition overlay
        this.createOverlay();

        // Intercept link clicks
        this.setupLinkInterception();

        // On page load, reveal the page
        this.revealPage();
    }

    createOverlay() {
        // Check if overlay already exists
        if (document.querySelector('.page-transition-overlay')) {
            this.overlay = document.querySelector('.page-transition-overlay');
            this.cells = Array.from(document.querySelectorAll('.transition-cell'));
            return;
        }

        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'page-transition-overlay';

        // Create grid container
        const grid = document.createElement('div');
        grid.className = 'transition-grid';

        // Get grid dimensions based on screen size
        const gridDimensions = this.getGridDimensions();
        const totalCells = gridDimensions.rows * gridDimensions.cols;

        // Create cells
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'transition-cell';
            cell.setAttribute('data-cell-index', i);
            cell.innerHTML = `
                <div class="transition-flip-card">
                    <div class="transition-card-front"></div>
                    <div class="transition-card-back"></div>
                </div>
            `;
            grid.appendChild(cell);
            this.cells.push(cell);
        }

        this.overlay.appendChild(grid);
        document.body.appendChild(this.overlay);
    }

    getGridDimensions() {
        const width = window.innerWidth;

        if (width <= 480) {
            return { rows: 8, cols: 6 };
        } else if (width <= 768) {
            return { rows: 8, cols: 6 };
        } else if (width <= 1024) {
            return { rows: 8, cols: 10 };
        } else {
            return { rows: 8, cols: 12 };
        }
    }


    setupLinkInterception() {
        // Intercept all internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');

            // Check if it's an internal link
            if (link && this.isInternalLink(link)) {
                e.preventDefault();

                // Don't transition if already transitioning
                if (this.isTransitioning) return;

                const href = link.getAttribute('href');
                this.transitionToPage(href);
            }
        });
    }

    isInternalLink(link) {
        // Check if link is internal (not external, not anchor, not download)
        const href = link.getAttribute('href');

        if (!href) return false;
        if (href.startsWith('#')) return false; // Anchor link
        if (href.startsWith('mailto:')) return false;
        if (href.startsWith('http')) {
            // Check if it's the same domain
            return link.hostname === window.location.hostname;
        }
        if (link.hasAttribute('download')) return false;
        if (link.hasAttribute('target')) return false;

        return true;
    }

    async transitionToPage(url) {
        this.isTransitioning = true;

        // 1. Activate overlay
        this.overlay.classList.add('active');

        // 2. Flip all cells to neutral (hiding current page)
        await this.flipToNeutral();

        // Store intent to transition in sessionStorage
        sessionStorage.setItem('pageTransitioning', 'true');

        // 3. Navigate to new page
        window.location.href = url;
    }

    async flipToNeutral() {
        // Create array of cell indices
        const indices = Array.from({ length: this.cells.length }, (_, i) => i);

        // Shuffle indices for random order
        this.shuffleArray(indices);

        // Calculate delay between each cell flip
        const totalDuration = 500; // ms
        const delayIncrement = totalDuration / this.cells.length;

        // Flip cells with staggered delay
        indices.forEach((index, i) => {
            setTimeout(() => {
                this.cells[index].classList.add('flipped');
            }, i * delayIncrement);
        });

        // Wait for all flips to complete
        await this.wait(totalDuration + 500); // Total duration + flip animation duration
    }


    async revealPage() {
        // Check if we're coming from a transition
        const wasTransitioning = sessionStorage.getItem('pageTransitioning');

        if (!wasTransitioning) {
            // Not transitioning, just hide overlay
            this.overlay.classList.remove('active');
            return;
        }

        // Clear the flag
        sessionStorage.removeItem('pageTransitioning');

        // Make sure overlay is active and all cells are flipped
        this.overlay.classList.add('active');
        this.cells.forEach(cell => cell.classList.add('flipped'));

        // Small delay before revealing
        await this.wait(100);

        // Flip cells back to reveal new page
        await this.flipToReveal();

        // Deactivate overlay
        this.overlay.classList.remove('active');
        this.isTransitioning = false;
    }

    async flipToReveal() {
        // Create array of cell indices
        const indices = Array.from({ length: this.cells.length }, (_, i) => i);

        // Shuffle indices for random order
        this.shuffleArray(indices);

        // Calculate delay between each cell flip
        const totalDuration = 500; // ms
        const delayIncrement = totalDuration / this.cells.length;

        // Flip cells back with staggered delay
        indices.forEach((index, i) => {
            setTimeout(() => {
                this.cells[index].classList.remove('flipped');
            }, i * delayIncrement);
        });

        // Wait for all flips to complete
        await this.wait(totalDuration + 500);
    }

    shuffleArray(array) {
        // Fisher-Yates shuffle
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize page transition when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pageTransition = new PageTransition();
    });
} else {
    window.pageTransition = new PageTransition();
}
