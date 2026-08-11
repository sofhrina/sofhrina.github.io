# Design QA — Guestbook

- Source visual truth: `/var/folders/jr/xpvz47w11wx2dwk_0wnmfr2c0000gn/T/TemporaryItems/NSIRD_screencaptureui_iPJOAz/Screenshot 2026-08-10 at 22.17.51.png`
- Browser-rendered implementation: `/private/tmp/sofhrina-guestbook-desktop.png`
- URL/state: `http://sofhrina.com/guestbook.html?v=qa3`, empty approved-message wall, desktop initial viewport
- Viewport and pixels: 1280 × 720 CSS px; screenshot 1280 × 720 px; density 1×; no normalization required
- Mobile evidence: attempted at 390 × 844, but the in-app browser retained a 1280 × 720 capture, so it is not accepted as mobile evidence
- Primary interactions checked: page load, public messages GET, homepage-to-guestbook link presence, contact mailto presence
- Console errors checked: no site-script errors observed; browser instrumentation network timeouts were unrelated to the site

## Full-view comparison evidence

The rendered page preserves the source site's violet field, cream/white window surface, Fraunces-led editorial hierarchy, IBM Plex Mono utility copy, traffic-light window dots, and small yellow accent. The guestbook hero has a deliberate single-focus composition rather than copying the three-column homepage, while remaining visibly part of the same system.

## Focused-region comparison evidence

The hero and upper form window were legible in the implementation capture. The window chrome, display type, body copy, stamp, radius, and card spacing align with the source visual language. The lower form and message-wall details were not accepted as focused visual evidence because the full-page capture timed out.

## Findings

- [P0] HTTPS is not yet available on `sofhrina.com`.
  - Location: custom domain / all public pages.
  - Evidence: GitHub Pages currently serves a `*.github.io` certificate and reports `https_enforced: false`; the browser rejects `https://sofhrina.com` with a certificate-name error.
  - Impact: the guestbook cannot safely collect a nickname or optional email over the custom domain yet.
  - Fix: wait for GitHub Pages to issue the custom-domain certificate, then enable Enforce HTTPS; do not invite public submissions before that.

- [P2] Mobile visual evidence is incomplete.
  - Location: guestbook responsive layout.
  - Evidence: the browser viewport override did not affect its screenshot output, so the captured image remained desktop-sized.
  - Impact: CSS includes a mobile breakpoint, but a real narrow-device render has not been visually signed off.
  - Fix: repeat at 390 × 844 after HTTPS is active using a browser that honors the viewport override.

## Required fidelity surfaces

- Fonts and typography: passed for the visible desktop region; Fraunces, Inter, and IBM Plex Mono create the intended hierarchy.
- Spacing and layout rhythm: passed for hero and upper form; lower page and mobile remain unverified.
- Colors and visual tokens: passed; violet, cream, white, and yellow remain consistent with the homepage.
- Image quality and asset fidelity: passed; the page uses no raster illustration or substituted logo asset.
- Copy and content: passed; required/optional privacy cues and moderation copy are clear and consistent.

## Comparison history

- Initial pass: identified the HTTPS P0 and missing valid mobile evidence. No design-code changes were made because both blockers are deployment/browser-state issues rather than visible desktop mismatches.

## Implementation checklist

1. Complete custom-domain certificate issuance and enable HTTPS.
2. Repeat desktop and 390 × 844 captures over HTTPS.
3. Submit one real Turnstile-protected test message and approve it from the Access-protected dashboard.

final result: blocked
