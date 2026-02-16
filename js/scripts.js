// === Dark/Light Mode Toggle ===
(function () {
    const html = document.documentElement;

    // Restore saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    document.addEventListener('DOMContentLoaded', function () {
        // Theme toggle (light/dark)
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                const current = html.getAttribute('data-theme');
                const next = current === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
            });
        }

        // Mobile nav toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', function () {
                navLinks.classList.toggle('open');
            });

            // Close menu when a link is tapped
            navLinks.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    navLinks.classList.remove('open');
                });
            });
        }
    });
})();
