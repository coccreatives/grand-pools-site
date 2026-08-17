# Losh Pools / Grand Pools — Full Landing Page

Implemented from Figma:
https://www.figma.com/design/ZJO6q4b7ivrv4XCwyExFSg/Grand-Pools---TEST-PROJECT--300-Prize--Copy-?node-id=9034-3145

Plain HTML / CSS / JS, no build step, no framework. Open `index.html` directly
or serve the folder statically (e.g. GitHub Pages).

## What's included

Every section of the 9,530px Figma frame, top to bottom:

- **Header + full-screen nav overlay** — logo, CONTACT button, hamburger menu
  that opens a full-screen nav (Home/Services/Projects/Contact, legal links,
  social icons). Sits over the hero and scrolls away with it (Figma only shows
  the header positioned inside the hero frame, so that's what this matches —
  no sticky/scrolled state is implied by the file).
- **Hero** — background photo, decorative gradient glow, tagline.
- **Mission statement** — centered pull-quote on the dark green background.
- **Process (scroll-scrubbed video)** — built with the `scroll-scrub-video-section`
  skill, replacing the static "Excavation" photo. A 400vh scroll wrapper pins
  the video/copy/progress-bar in place; scroll position drives one eased
  timeline that scrubs the video's `currentTime`, fills the 4-segment progress
  bar, and swaps the step title/description — all from that single value, so
  they can't drift out of sync. Only step 1 ("Excavation") had real copy in
  the Figma file; steps 2–4 ("Steel & Plumbing", "Shotcrete & Shell",
  "Finishing & Handover") are drafted in the same voice — edit the `STEPS`
  array near the bottom of `js/script.js` to change the wording.
  Tuning knobs: `.process-scrub__scroll { height: 400vh }` in `style.css`
  controls scrub speed (more vh = slower), and the `0.14` easing factor in
  `js/script.js` controls responsiveness vs. smoothness.
  Your source video was re-encoded for scrubbing (H.264, keyframe every 4
  frames for near-instant seeking, audio stripped since it's muted anyway) —
  see `assets/video/process-scrub.mp4` (6.4MB) and its poster frame.
- **Featured Projects** — all 6 project cards in the exact asymmetric/staggered
  layout from the file (absolute-positioned to match Figma's coordinates
  precisely, since the design itself isn't a simple grid).
- **About Us** — copy + photo + "Discover our story" button.
- **Lifestyle statement / wellness #2** — full-bleed photo with quote.
- **The Approach** — 3-step process cards (Site visit / Design / Build).
- **Footer** — logo, contact info, link columns, newsletter form (UI only,
  doesn't submit anywhere), social icons, copyright.

## Motion

Same hand-authored motion system as the header build (see inline comments in
`style.css`): hover/press feedback on buttons and links, image zoom on card
hover, staggered nav-link entrance. Figma has no authored prototype animation
anywhere in this file, so all of it is original, not extracted — built to the
`transform`/`opacity`-only, `prefers-reduced-motion`-respecting system used
throughout.

## Font substitution

The "Approach" card headings — *(i) Site visit*, *(ii) Design*, *(iii) Build*
— use **Canela Trial** in Figma, a commercial typeface with no free
distribution. This build substitutes **Playfair Display Italic** (open,
self-hosted), the closest freely-licensable equivalent in tone (an italic
display serif). Swap `--font-editorial` in `style.css` for the real Canela
files if you have a license.

## ⚠️ Images and icons — action needed before shipping long-term

Every photo and icon in this build (hero photo, both wellness photos, all 6
project photos, the About Us photo, the 3 Approach photos, the hamburger icon,
and all 14 social icons across the nav overlay + footer) currently points
directly at Figma's asset CDN (`https://www.figma.com/api/mcp/asset/...`).

**These work today but expire in about a week** — Figma's asset links are
short-lived by design. This session downloaded them this way, at your
direction, because the cloud sandbox this build ran in has no outbound network
access to figma.com (confirmed: direct `curl` is blocked, and a same-origin
policy blocks fetching through a headless browser here too) — the Figma MCP
connection itself is the only thing in this environment that can reach
figma.com. A same-machine attempt via the connected desktop (writing a
download helper into your Downloads folder) also didn't complete.

Before this goes live for real:

1. In Figma, select each image/icon layer and export it (PNG for photos, SVG
   for icons).
2. Drop the files into `assets/images/` and `assets/icons/`.
3. Find-and-replace every `https://www.figma.com/api/mcp/asset/...` URL in
   `index.html` with the matching local path.

Fonts have no such problem — they're already self-hosted in `assets/fonts/`
with no expiring dependency.

## Elementor notes

If this gets pasted into an Elementor HTML widget: bring `css/style.css` and
`css/fonts.css` in as a `<style>` block (or enqueue them), keep `js/script.js`
as-is, and upload the woff2 files + resolved image/icon assets to the
WordPress media library, updating the paths to match.

For the process video section specifically: set the host section's padding to
0 and its column to 100% width, and make sure that section does **not** have
`overflow: hidden` set anywhere in its Elementor settings — that breaks the
sticky pin. Swap `assets/video/process-scrub.mp4` / `process-poster.jpg` to
WordPress media library URLs when publishing rather than shipping the ~6.4MB
file inline in post content.

## Fixes in this revision

- Added scroll-triggered entrance animations (fade/slide-up, staggered on card
  groups) to section headings, copy, and cards — the previous version only had
  hover/click-triggered motion, so scrolling through it looked static.
- Fixed a horizontal scrollbar that appeared below ~1436px viewport width: the
  featured-projects grid and the old process step-bar used fixed pixel
  positions sized to the design's native 1440px canvas. The grid now falls
  back to a stacked column below 1450px, and the step bar (superseded by the
  video section above) would have scaled fluidly.
