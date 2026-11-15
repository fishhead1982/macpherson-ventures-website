# MacPherson Ventures website

The corporate site for MacPherson Ventures Pty Ltd, at [macphersonventures.com](https://macphersonventures.com). It is a static site with a small Cloudflare Worker in front for the unsubscribe page and opt-out list.

Pushes to `main` deploy production. Other branches get a preview at `https://<branch>-macpherson-ventures.andrew-b1a.workers.dev`.

## Unsubscribe and opt-out list

Cold outreach must be checked against the opt-out list before anything is sent. Nothing is sent automatically.

- Page (per-recipient link): `https://macphersonventures.com/unsubscribe?e=<url-encoded-email>`
- One-click unsubscribe (RFC 8058): `POST /unsubscribe?e=<url-encoded-email>` with the body `List-Unsubscribe=One-Click`
- Suggested headers for outreach emails:

```
List-Unsubscribe: <https://macphersonventures.com/unsubscribe?e=person%40example.com>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

People can also reply with "unsubscribe". The page records the request immediately. The Spam Act 2003 requires this to be actioned within 5 business days; we do it straight away.

### Checking the list before a send

`GET /api/optouts` returns the full list as JSON. Add `?format=csv` for CSV, or `?e=<email>` to check a single address. The list is not public. Send the Worker secret `OPTOUT_API_TOKEN` as a bearer token:

```
Authorization: Bearer <token>
```

### Cloudflare setup (needed before a deploy will work)

Wrangler on a machine that is logged in to the Cloudflare account should:

1. Create the KV namespaces and put the IDs in `wrangler.jsonc` under `kv_namespaces` (`id` for production, `preview_id` for previews):

```
npx wrangler kv namespace create OPTOUTS
npx wrangler kv namespace create OPTOUTS --preview
```

2. Set the API token secret on the Worker, using the same value stored for local development in `.dev.vars` (that file is not in the repo; there is a `.dev.vars.example`):

```
npx wrangler secret put OPTOUT_API_TOKEN
```

If previews use a separate environment in the Cloudflare dashboard, set the secret there too. Do not change DNS or MX records; mail stays on Microsoft 365.

Local testing does not need those IDs. Copy `.dev.vars.example` to `.dev.vars`, add a token, then run `npx wrangler dev`.

## Email logos

Two PNG logos for outreach emails are served at:

- `/assets/email/mv-logo-full-320.png`
- `/assets/email/mv-logo-full-reversed-320.png`

They are public, use a long cache, and are not restricted for use from email clients.
