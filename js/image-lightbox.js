// ===================================
// IMAGE LIGHTBOX
// Click gallery images to view fullscreen
// ===================================

(function() {
    'use strict';

    let currentImageIndex = 0;
    let galleryImages = [];

    // Initialize lightbox on page load
    function init() {
        // Get all gallery images
        const galleryItems = document.querySelectorAll('.gallery-item img');

        if (galleryItems.length === 0) return;

        // Store image data
        galleryImages = Array.from(galleryItems).map(img => ({
            src: img.src,
            alt: img.alt,
            caption: img.nextElementSibling ? img.nextElementSibling.textContent : ''
        }));

        // Add click listeners to gallery images
        galleryItems.forEach((img, index) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                openLightbox(index);
            });
        });

        // Create lightbox HTML
        createLightboxHTML();
    }

    // Create lightbox structure
    function createLightboxHTML() {
        const lightboxHTML = `
            <div id="image-lightbox" class="lightbox">
                <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
                <button class="lightbox-prev" aria-label="Previous image">&#10094;</button>
                <button class="lightbox-next" aria-label="Next image">&#10095;</button>
                <div class="lightbox-content">
                    <img id="lightbox-img" src="" alt="">
                    <div id="lightbox-caption" class="lightbox-caption"></div>
                </div>
                <div class="lightbox-counter">
                    <span id="lightbox-counter-text"></span>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        // Add event listeners
        const lightbox = document.getElementById('image-lightbox');
        const closeBtn = document.querySelector('.lightbox-close');
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');

        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', showPrevImage);
        nextBtn.addEventListener('click', showNextImage);

        // Click outside image to close
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', handleKeyPress);
    }

    // Open lightbox with specific image
    function openLightbox(index) {
        currentImageIndex = index;
        const lightbox = document.getElementById('image-lightbox');
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        updateLightboxImage();
    }

    // Close lightbox
    function closeLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Show previous image
    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        updateLightboxImage();
    }

    // Show next image
    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        updateLightboxImage();
    }

    // Update lightbox image
    function updateLightboxImage() {
        const img = document.getElementById('lightbox-img');
        const caption = document.getElementById('lightbox-caption');
        const counter = document.getElementById('lightbox-counter-text');

        const currentImage = galleryImages[currentImageIndex];

        img.src = currentImage.src;
        img.alt = currentImage.alt;
        caption.textContent = currentImage.caption;
        counter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;

        // Hide prev/next buttons if only one image
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');

        if (galleryImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    }

    // Handle keyboard navigation
    function handleKeyPress(e) {
        const lightbox = document.getElementById('image-lightbox');
        if (!lightbox || !lightbox.classList.contains('active')) return;

        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
