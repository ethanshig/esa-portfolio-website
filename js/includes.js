/**
 * SIMPLE HTML INCLUDES SYSTEM
 * Loads navbar and footer into pages
 *
 * Usage: Add data-include attribute to any element
 * <div data-include="includes/navbar.html"></div>
 */

document.addEventListener('DOMContentLoaded', function() {
    loadIncludes();
});

async function loadIncludes() {
    const includeElements = document.querySelectorAll('[data-include]');

    for (const element of includeElements) {
        const file = element.getAttribute('data-include');

        try {
            const response = await fetch(file);
            if (response.ok) {
                const html = await response.text();
                element.innerHTML = html;
            } else {
                console.error(`Failed to load ${file}`);
            }
        } catch (error) {
            console.error(`Error loading ${file}:`, error);
        }
    }

    // After includes loaded, initialize navigation highlighting
    highlightActiveNav();
}

/**
 * Highlight active navigation link based on current page
 */
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index-landing.html';

    // Find all nav links
    const navLinks = document.querySelectorAll('.nav-link, .tab-item');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
}
