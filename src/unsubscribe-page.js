/**
 * HTML for the /unsubscribe page, served by the Worker so the email field
 * can be prefilled without JavaScript and so confirmation works after POST.
 */
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
        return ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[ch];
    });
}

export function renderUnsubscribePage({ email = "", done = false, error = "" } = {}) {
    const safeEmail = escapeHtml(email);
    const title = done ? "You've been unsubscribed" : "Unsubscribe";
    const description = done
        ? "You have been taken off the MacPherson Ventures email list."
        : "Stop receiving emails from MacPherson Ventures.";

    let main;
    if (done) {
        const who = email
            ? `We will not email ${safeEmail} again about MacPherson Ventures.`
            : "We will not email you again about MacPherson Ventures.";
        main = `
                <h1>You've been unsubscribed</h1>
                <p>${who} We recorded this straight away and will keep the address on our do-not-contact list.</p>
                <p>If this was a mistake, email <a href="mailto:andrew@macphersonventures.com">andrew@macphersonventures.com</a> and we'll put it right.</p>
                <p><a href="/">Back to the home page</a></p>`;
    } else {
        const errorHtml = error
            ? `<p class="form-error" role="alert">${escapeHtml(error)}</p>`
            : "";
        main = `
                <h1>Unsubscribe</h1>
                <p>Enter your email address to stop receiving emails from MacPherson Ventures. We'll take you off our list straight away.</p>
                ${errorHtml}
                <form class="unsubscribe-form" method="post" action="/unsubscribe">
                    <div class="form-group">
                        <label for="email">Email address</label>
                        <input type="email" id="email" name="email" value="${safeEmail}" autocomplete="email" required autofocus>
                    </div>
                    <button type="submit" class="btn btn-primary">Unsubscribe</button>
                </form>
                <p class="form-privacy">This is free and takes effect immediately. You can also reply "unsubscribe" to any of our emails. See our <a href="/privacy">Privacy Policy</a> for how we handle your details.</p>`;
    }

    return `<!DOCTYPE html>
<html lang="en-AU">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | MacPherson Ventures</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="noindex, nofollow">
    <link rel="canonical" href="https://macphersonventures.com/unsubscribe">
    <script>
        (function () {
            var d = document.documentElement, t = null;
            d.className += ' js';
            try { t = localStorage.getItem('theme'); } catch (e) {}
            if (t !== 'light' && t !== 'dark') {
                t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            d.setAttribute('data-theme', t);
        })();
    </script>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
    <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#2B303B" media="(prefers-color-scheme: dark)">
    <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header>
        <nav class="container" aria-label="Main">
            <a href="/" class="logo" aria-label="MacPherson Ventures home">
                <img class="logo-light" src="/img/brand/mv-logo.svg" alt="MacPherson Ventures" width="170" height="48">
                <img class="logo-dark" src="/img/brand/mv-logo-reversed.svg" alt="MacPherson Ventures" width="170" height="48">
            </a>
            <div class="nav-links">
                <a href="/#services">What we build</a>
                <a href="/#how-it-works">How it works</a>
                <a href="/#about">About</a>
                <a href="/#contact">Contact</a>
            </div>
            <div class="nav-right">
                <button class="mobile-menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <button class="theme-toggle" type="button" aria-label="Toggle dark mode">
                    <svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </button>
            </div>
        </nav>
        <div class="mobile-nav" id="mobile-nav">
            <a href="/#services">What we build</a>
            <a href="/#how-it-works">How it works</a>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
        </div>
    </header>

    <main id="main">
        <section class="page-header">
            <div class="container unsubscribe-panel">
${main}
            </div>
        </section>
    </main>

    <footer>
        <div class="container footer-inner">
            <div class="footer-brand">
                <img class="logo-light" src="/img/brand/mv-logo.svg" alt="MacPherson Ventures" width="128" height="36" loading="lazy">
                <img class="logo-dark" src="/img/brand/mv-logo-reversed.svg" alt="MacPherson Ventures" width="128" height="36" loading="lazy">
            </div>
            <div class="footer-meta">
                <p>&copy; 2026 MacPherson Ventures Pty Ltd &middot; ABN 50 680 855 243</p>
                <p>Camira QLD, Australia &middot; <a href="mailto:andrew@macphersonventures.com">andrew@macphersonventures.com</a></p>
            </div>
            <div class="footer-links">
                <a href="/privacy">Privacy Policy</a>
                <a href="/#contact">Contact</a>
            </div>
        </div>
    </footer>

    <script src="/js/scripts.js"></script>
</body>
</html>
`;
}
