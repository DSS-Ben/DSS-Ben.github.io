# Benjamin Alvis — Portfolio

## v5 (Nov 27, 2026) — kinetic-type hero, reorganised homepage
See AUDIT.md for the full audit and what changed. Files: index.html, css/styles.css, js/hero.js (hero motion), js/main.js (page behaviour), js/logo.js (header logo loop).

---

# Earlier notes — v3 (Swiss foundation, Apple-style surface)

Same typeface (Inter Tight 400/500/600) and the exact same copy as v2. Only the design and motion layer changed.

## What's new
- **Translucent header** — frosted glass (`backdrop-filter`), active-section pill, scroll-progress hairline.
- **Hero** — one orchestrated load moment: the headline arrives word by word out of a soft blur, with a slow ambient colour glow behind it.
- **Project tiles** — rounded Apple-style cards with a weighted spring tilt (desktop only), cursor glare, a parallax icon and a gradient "art" placeholder per project.
- **Process** — four cards with line icons; a gradient hairline draws across each step as it arrives.
- **About** — the lead paragraph lights up word by word as you scroll (Apple product-page style); experience table becomes a timeline card (green dot = current role).
- **Contact** — black tile with a pointer-following light, gradient email, glass pill rows.
- Respects `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` and touch devices (no tilt without a cursor).

## Files
- `index.html` — markup + inline SVG icon sprite.
- `css/styles.css` — tokens at the top (`--surface #f5f5f7`, `--ink #1d1d1f`, `--accent #0071e3`, radii, easing).
- `js/main.js` — no dependencies.

## Images
Put an `<img>` inside each `.image` div. The gradient art hides automatically once an image is there. Per-card gradient colours live in the `style` attribute on each `<article class="project">` (`--hue-a`, `--hue-b`, `--glyph`, `--orb`).

## Live v4 — Project 1 replaces the old four (Oct 21)
- Homepage work section now shows only Project 01: OG Series + Versa X new product launch, with a live link to projects/og-versa-launch/.
- INKD, FRIMAS, kinetic typography and e-commerce launch kit are removed from the homepage, per Ben's call.
- Project page: newsletter → landing page, pods carousel live, Versa X scroll reveal live, responsive.

## v5.2 (Nov 27, 2026) — Apple HIG pass
Swatches removed, hero lens now caches letter positions (one layout read per frame instead of one per letter). Fonts verified: Archivo variable + Inter Tight 400/500/600, one request. See AUDIT.md.

## v5.3 (Nov 27, 2026) — Apple HIG audit applied
Inter Tight throughout (Archivo gone), AI gradient title restored, 44pt touch targets, audit copy fixes. See AUDIT.md.

## v5.4 (Nov 27, 2026) — No weird gradients
"Designed end to end." is now solid blue instead of a blue-purple-pink gradient. The big blue circle in Ben's recording is not in the site's code; see AUDIT.md.

## v5.5 (Nov 27, 2026) — DSS out of the intro, blue statement background
"Currently / DSS Distribution" removed from the intro facts. The pinned statement now gets Claude's blue radial background that grows to fill the viewport on scroll, words flipping ink to white. See AUDIT.md.

## v5.6 (Nov 27, 2026) — Blue corners covered
The growing blue circle's end scale went from 1.10 to 1.35 so it covers the viewport corners at full blue (v5.5 left tiny white slivers in the extreme corners).

## v5.7 (Nov 27, 2026) — CMYK press wheel in the hero
Interactive CMYK colour wheel replaces the rotating badge; drag to mix process inks, chip shows the live C/M/Y/K mix. See AUDIT.md.

## v5.8 (Nov 27, 2026) — Seamless blue statement, no oval
The blue statement background is now a full-bleed opacity fade, no growing oval, no visible edge mid-transition. See AUDIT.md.

## v5.9 (Nov 27, 2026) — Wheel knob removed, pen curve draws after the name
The little triangle pointer on the wheel rim is gone, and the hero opens white: the name slices in first, the blue pen curve draws behind it after. See AUDIT.md. (Note: the v5.9 curve timing did not hold in a browser check, fixed properly in v5.10.)

## v5.10 (Nov 27, 2026) — Pen curve gated on the name actually finishing
The curve is invisible until the name has fully risen, driven by the same animation clock as the letters, so it can never beat the name to the screen. See AUDIT.md.
