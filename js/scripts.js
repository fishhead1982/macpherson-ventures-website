// === Theme — default to system preference === //
(function () {
    var html = document.documentElement;
    var saved = localStorage.getItem('theme');
    if (saved) {
        html.setAttribute('data-theme', saved);
    } else {
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Theme toggle
        var themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                var current = html.getAttribute('data-theme');
                var next = current === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
            });
        }

        // Mobile menu toggle
        var menuBtn = document.querySelector('.mobile-menu-btn');
        var mobileNav = document.querySelector('.mobile-nav');
        if (menuBtn && mobileNav) {
            menuBtn.addEventListener('click', function () {
                mobileNav.classList.toggle('open');
            });
            // Close mobile nav on link click
            mobileNav.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    mobileNav.classList.remove('open');
                });
            });
        }

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Intersection Observer for fade-in animations
        var fadeEls = document.querySelectorAll('.fade-in');
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

            fadeEls.forEach(function (el) { observer.observe(el); });
        } else {
            fadeEls.forEach(function (el) { el.classList.add('visible'); });
        }

        // Contact form — mailto fallback
        var form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var name = form.querySelector('#name').value;
                var email = form.querySelector('#email').value;
                var message = form.querySelector('#message').value;
                var subject = encodeURIComponent('Enquiry from ' + name);
                var body = encodeURIComponent('From: ' + name + ' (' + email + ')\n\n' + message);
                window.location.href = 'mailto:andrew@macphersonventures.com?subject=' + subject + '&body=' + body;
            });
        }
    });
})();
