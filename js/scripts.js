// MacPherson Ventures site scripts.
// The initial theme is set by a small inline script in each page's <head>
// (before first paint) so there is no flash of the wrong theme.
(function () {
    var html = document.documentElement;
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function savedTheme() {
        try {
            var t = localStorage.getItem('theme');
            return t === 'light' || t === 'dark' ? t : null;
        } catch (e) {
            return null;
        }
    }

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        var toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            var label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
            toggle.setAttribute('aria-label', label);
            toggle.setAttribute('title', label);
        }
    }

    // Follow the system setting until the visitor picks a theme themselves
    if (media) {
        var onChange = function (e) {
            if (!savedTheme()) applyTheme(e.matches ? 'dark' : 'light');
        };
        if (media.addEventListener) media.addEventListener('change', onChange);
        else if (media.addListener) media.addListener(onChange);
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyTheme(html.getAttribute('data-theme') || (media && media.matches ? 'dark' : 'light'));

        var themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                applyTheme(next);
                try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
            });
        }

        // Mobile menu
        var menuBtn = document.querySelector('.mobile-menu-btn');
        var mobileNav = document.querySelector('.mobile-nav');
        if (menuBtn && mobileNav) {
            menuBtn.addEventListener('click', function () {
                var open = mobileNav.classList.toggle('open');
                menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            mobileNav.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    mobileNav.classList.remove('open');
                    menuBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Fade-in on scroll
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

        // Contact form: nothing is sent to a server. Submitting opens the
        // visitor's own email app with the message filled in.
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
