// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Enable tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Scroll to top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    scrollToTopBtn.className = 'btn btn-primary btn-scroll-top';
    scrollToTopBtn.style.position = 'fixed';
    scrollToTopBtn.style.bottom = '20px';
    scrollToTopBtn.style.right = '20px';
    scrollToTopBtn.style.display = 'none';
    scrollToTopBtn.style.zIndex = '99';
    scrollToTopBtn.style.borderRadius = '50%';
    scrollToTopBtn.style.width = '50px';
    scrollToTopBtn.style.height = '50px';
    scrollToTopBtn.style.padding = '0';
    document.body.appendChild(scrollToTopBtn);
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'block';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });
    
    // Form validation example
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
});
