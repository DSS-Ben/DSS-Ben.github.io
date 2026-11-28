# Site audit + v5 rebuild — Nov 27, 2026

## What was wrong (homepage)

1. **The opening was a 30-word paragraph set as the H1.** Recruiters skim. The first screen said nothing visual about a designer.
2. **Four overlapping ways to find work.** A "Start here" guide, four featured cards, filter buttons and "Start here" badges all repeated the same three projects. Gündem, Glās and Versa X each showed up twice.
3. **Only a small text link was clickable on each card.** The image and title did nothing.
4. **`role="img"` on the image wrappers** hid the real `alt` text from screen readers.
5. **Two videos autoplayed on page load**, even off-screen.
6. **No `loading="lazy"` on the ten project images**, so all of them downloaded up front.
7. **The "My take on AI" block sat inside About**, between the lead line and the experience table. It broke the flow.
8. **Hard-coded counts** ("Showing all 10 projects") would go wrong as soon as a project is added.
9. **About 40 inline `style=""` attributes**, plus about 16 `!important` rules and three generations of CSS stacked in one file.
10. **Two separate Google Fonts requests.**
11. **No favicon, no Open Graph tags, no canonical link.** Links shared on LinkedIn showed no preview.
12. **No skip link.** Section headings jumped from h2 to h3 with no structure.

## Project pages
- **Missing meta descriptions on 7 of 10 pages.** Added.
- **"Back to portfolio" pointed to the live URL** (`https://dss-ben.github.io/`), so it broke in local previews and on any other host. It's now relative (`../../`).
- **Not changed:** the page designs themselves. Each one is its own showcase.

## What v5 does
- **Hero:** kinetic type on white. Grid lines and crop marks draw in, a pen-tool curve draws itself, and the name slices in. Each letter starts condensed and thin, then springs to wide and heavy. An Illustrator-style selection box snaps around the name with live W/H numbers. Then the role rotator and an "open to work" badge come in.
- **Hero, after it loads:** letters near the cursor go thin, like a lens. On phones, a slow weight wave runs through them instead. Scrolling compresses the name as it leaves the screen.
- **No hard edge:** the hero ends in a ticker that fades into the page.
- **Intro:** one sentence plus four facts.
- **Work:** one filter bar with live counts, then "Start here" (one project per discipline) and "More work". Each card is fully clickable.
- **About:** timeline and toolkit side by side. The AI take is its own block.
- **Contact:** clear actions (Email me, Download CV).
- **Code:** split into `js/hero.js`, `js/main.js` and `js/logo.js` (the header logo loop is unchanged). One font request, adding Archivo's width axis. `styles.css` is rewritten and organised into numbered sections.
- **Accessibility:** respects reduced motion (static hero), reduced transparency and forced colours.
- **If an image is missing**, the card shows its tinted project number instead of a broken image.

## Not included in the zip
The zip had code only, no images or videos. All media paths are unchanged, so dropping these files over the live repo keeps every image working.

## v5.1 — Apple-style motion layer (js/motion.js)
- Hero pins, then zooms back and fades as the page slides over it on a rounded sheet with a soft shadow.
- New pinned statement ("Brand. Packaging. Motion. E-commerce. Designed end to end.") lights up word by word as you scroll.
- The intro line highlights word by word as you read, like the About lead.
- Project cards rise and scale into place, tied to scroll position. Their images drift with a parallax effect.
- Section titles rise through a mask. The "Designing since" number counts up to 2016. Buttons and filters pull slightly toward the cursor.
- The contact tile grows into place as it arrives.
- Everything is driven by scroll position, so it scrubs both ways. With reduced motion turned on, it all goes static.

## v5.2 — Apple HIG pass (Nov 27, 2026)
- **Delight, not decoration:** the colour swatches are gone (HTML, CSS, JS). The hero keeps the kinetic name, the pen curve, the rotator and the badge.
- **Craft, in performance:** the lens effect no longer measures every letter on every frame (13 forced layouts per frame). Each letter's resting centre is cached once in `fit()` (resize / font load / start) from transform-independent offsets, and the frame loop takes one stage measurement per frame. Same look, far less work.
- **Fonts verified intact:** one Google Fonts request, Archivo variable (wght 100-900, wdth 62-125%) + Inter Tight 400/500/600, `display=swap`. Every weight and width the CSS and JS use sits inside those ranges, with Helvetica Neue / Arial fallbacks. Cache-buster bumped to `?v=20261127b`.

## v5.3 — Fonts back to Inter Tight, blue style restored (Nov 27, 2026)
Apple HIG audit (Nov 22) applied to v5.2:
- **Fonts:** one typeface again. Archivo is gone; Inter Tight throughout (variable wght 100-900, one request, verified live). The kinetic hero now springs thin-to-heavy on weight only, no width axis; the rotator and ticker do the same. Every weight the CSS and JS use (100-900) sits inside the requested range.
- **Blue style:** the "My take on AI" gradient title is back (ink black at rest, blue #0090ff / #007AFF / #7AB8FF sweep on hover desktop, once on scroll on phones via the restored JS snippet, with reduced-motion and forced-colours fallbacks). Body type is bigger again and "fundamentals" is blue once more.
- **44pt touch targets (audit finding 2):** nav links, header CV button and filter buttons all reach 44px min-height.
- **Copy (audit finding 4):** About line is now "Everything here is work I designed and shipped myself." Project 06 result line now leads with the craft (directed and cut solo in 60 seconds, Claude + Seedance 2.0 + Premiere) and drops the vape-shop framing. Project 02's weak result line was already gone.

## v5.4 — No weird gradients (Nov 27, 2026)
Ben sent a 38s screen recording of the live site and said "make sure there's no weird gradients".
- **Watched frame by frame.** The one gradient that looks off in the recording is in the statement section (around 19-21s): a giant blue radial circle grows to fill the screen and the words flip black to white. That effect is NOT in the site: the live CSS/JS were diffed against the repo and are identical, and no file in the workspace contains a radial blob, a circle clip or a statement background. A clean-browser check (8 screenshots through the section, plus a reverse-scroll pass) confirmed the live statement stays on a plain white background the whole way through. So the blue circle is something on Ben's machine or a local build he is working on. Ask him what he was recording before touching it.
- **Fixed what is actually live:** "Designed end to end." was a blue-to-purple-to-pink gradient, the only pink on the whole site and the only gradient that breaks the one-blue-accent rule. It is now solid #007AFF, so it reads the same on white and on any blue behind it.
- **Kept on purpose:** the AI title's blue sweep (Ben asked for it back in v5.3), the contact card's soft blue glow, the email's light-blue-to-white text, the ticker's edge fade (a mask, not a visible gradient). The badge centre is flat blue; the shaded-ball look in the recording is compression at small size.
- **Project images (Ben's follow-up):** all 10 homepage cards show a real image or video frame in a clean browser, and every media file returns 200 live. The blank pastel cards in Ben's recording were the fast scroll plus lazy loading, the images had not fetched yet in those frames. No code change needed.
