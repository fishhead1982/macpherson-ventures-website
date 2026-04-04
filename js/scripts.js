// === Theme Toggle ===
(function () {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);

    document.addEventListener('DOMContentLoaded', function () {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                const current = html.getAttribute('data-theme');
                const next = current === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
            });
        }

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    });
})();
