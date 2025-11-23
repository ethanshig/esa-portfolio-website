// ===================================
// CONTACT FORM HANDLING
// ===================================

const form = document.getElementById('contactForm');
const result = document.getElementById('result');

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        result.style.display = 'none';
        result.className = 'form-result';

        try {
            // Send form data to Web3Forms
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Success!
                result.className = 'form-result success';
                result.textContent = 'Thank you! Your message has been sent successfully. I\'ll get back to you soon.';
                result.style.display = 'block';

                // Reset form
                form.reset();

                // Scroll to result message
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                // Error from Web3Forms
                throw new Error(data.message || 'Something went wrong');
            }
        } catch (error) {
            // Handle errors
            result.className = 'form-result error';
            result.textContent = 'Oops! Something went wrong. Please try again or email me directly.';
            result.style.display = 'block';

            console.error('Form submission error:', error);
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// ===================================
// FORM VALIDATION FEEDBACK
// ===================================

// Add real-time validation feedback
const inputs = form ? form.querySelectorAll('input, textarea') : [];

inputs.forEach(input => {
    // Show validation on blur (when user leaves field)
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required')) {
            if (!this.value.trim()) {
                this.style.borderColor = '#dc3545';
            } else if (this.type === 'email' && !isValidEmail(this.value)) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        }
    });

    // Reset border on focus
    input.addEventListener('focus', function() {
        this.style.borderColor = 'var(--color-accent)';
    });
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===================================
// CHARACTER COUNTER FOR TEXTAREA (Optional)
// ===================================

const messageTextarea = document.getElementById('message');
if (messageTextarea) {
    const maxLength = 1000;

    // Create counter element
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.style.cssText = 'text-align: right; font-size: 0.85rem; color: var(--color-text-light); margin-top: 0.25rem;';
    messageTextarea.parentElement.appendChild(counter);

    // Update counter
    function updateCounter() {
        const length = messageTextarea.value.length;
        counter.textContent = `${length} / ${maxLength} characters`;

        if (length > maxLength * 0.9) {
            counter.style.color = '#dc3545';
        } else {
            counter.style.color = 'var(--color-text-light)';
        }
    }

    messageTextarea.addEventListener('input', updateCounter);
    messageTextarea.setAttribute('maxlength', maxLength);
    updateCounter();
}
