## Status

Single-page site for MacPherson Ventures Pty Ltd (AI consulting for SMBs in Australia and Vietnam) plus an Australian privacy policy at /privacy and an unsubscribe page at /unsubscribe. Uses Ben Clark's brand set (Oct 2026): teal #009494, slate #3D4557, midnight #2B303B, with light and dark mode.

## Remaining

- Cloudflare: create the OPTOUTS KV namespace (and a preview namespace), add the IDs to wrangler.jsonc, and set the OPTOUT_API_TOKEN Worker secret. Wrangler is not logged in on the machine that prepared this branch, so a preview deploy will not record opt-outs until that is done. Local `wrangler dev` already works.

## Done

- Initial corporate website with four pages (Feb 2026)
- Wrangler config for Cloudflare Pages deployment
- Rebuild as a single-page landing site with AI consultancy copy
- Redesign with gradient accents, animated grid hero, and scroll animations
- Hero background image with gradient overlay; default to dark mode
- Redesign as AI consulting site with updated positioning and navy/amber palette
- Workflow card copy updated to emphasise team empowerment over cost reduction
- Nov 2026 refresh: new logo and favicons, brand palette, light/dark toggle, copy tidy-up, APP-based privacy policy, self-hosted Inter, canonical/OG tags, sitemap and robots; old about/contact pages redirect to the home page
- Unsubscribe page at /unsubscribe with a prefilled email field, one-click confirm, RFC 8058 POST, KV-backed do-not-contact list and a bearer-protected /api/optouts endpoint; privacy policy updated to say requests are actioned immediately
- Email-ready logo PNGs at /assets/email/ for outreach templates

## Notes

Deployed as a Cloudflare Worker with static assets (wrangler.jsonc) via Workers Builds: pushes to main deploy to production; other branches upload preview versions. .assetsignore keeps repo files off the site. Brand source files live outside the repo (Ben Clark's Drive folder). The opt-out list is stored in Workers KV. Confirmation of an unsubscribe is shown on the page; a confirmation email is not sent, because Cloudflare Email Routing would need MX changes and we must not touch the Microsoft 365 MX records.
