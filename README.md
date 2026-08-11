# Huiru Feng — Personal Website

Source files for Huiru Feng's personal website.

## Publishing

This is a static site. GitHub Pages can publish it directly from the repository root on the `main` branch.

## Journal

Journal source files live in `journal/entries/`. The homepage gallery is generated from those Markdown files, so articles should not be pasted into `index.html` by hand.

To add an entry:

```bash
npm run journal:add -- "/absolute/path/to/article.md" \
  --date 2026-08-11 \
  --summary "A one- or two-sentence introduction."
```

The command copies the article into the repository and rebuilds the gallery. Dates may be written as `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. See `journal/README.md` for the complete branch, check, and pull-request workflow.

## Guestbook

The public guestbook page talks to a Cloudflare Worker at `guestbook-api.sofhrina.com`.
Messages are stored in D1 as `pending` and only appear publicly after approval.

- Public form: `https://sofhrina.com/guestbook.html`
- Private moderation: `https://guestbook-admin.sofhrina.com`
- Contact address: `hi@sofhrina.com` forwards to Sophia's Gmail through Cloudflare Email Routing.
- New submissions trigger an email notification and are protected by Turnstile plus anonymous rate limiting.

The Worker source and database schema live in `cloudflare/`. Worker secrets are stored only in Cloudflare and must never be committed.

## Remaining assets

- `cv-en.pdf` for the CV download button
- `og-card.png` for social sharing previews
- `sofhrina.com` is the site's canonical custom domain
