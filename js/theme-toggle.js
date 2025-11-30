/**
 * THEME TOGGLE - Universal
 * Works across all pages
 * Persists preference in localStorage
 */

// Initialize theme on page load
(function initTheme() {
    const saved Theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
})();

// Setup theme toggle after DOM loads
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('theme-toggle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
});

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeIcon(newTheme);
}

/**
 * Update theme icon (sun/moon)
 */
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    const iconLanding = document.getElementById('theme-icon-landing');
    const label = document.getElementById('theme-label');

    const iconChar = theme === 'dark' ? '☀' : '☽';
    const labelText = theme === 'dark' ? 'Light' : 'Dark';

    if (icon) icon.textContent = iconChar;
    if (iconLanding) iconLanding.textContent = iconChar;
    if (label) label.textContent = labelText;
}

/**
 * Expose toggleTheme globally for inline onclick handlers
 * (Used in landing page grid cell)
 */
window.toggleTheme = toggleTheme;
