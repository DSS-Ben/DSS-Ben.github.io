# Benjamin Alvis — Portfolio v3 (Swiss foundation, Apple-style surface)

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

## First-person personal edit (Oct 21, by Brother, on Ben's v3)
- All visitor copy rewritten from third person to first person: hero, work descriptions, process, about, contact.
- Added a welcome line in Contact: "Welcome to my design world — if you like what you see here, I'd love to hear from you. Let's make something together."
- Removed the visible "Images: replace each grey block" note from the live page — that instruction now lives only here, not on the site visitors see.
- V3 design (Inter Tight, Apple-style surface) otherwise kept intact.
