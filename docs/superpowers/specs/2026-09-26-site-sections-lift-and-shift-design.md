# Site Sections: Lift & Shift from `old-portfolio` onto the Sky Hero — Design

Builds on `2026-09-25-cursor-tracking-hero-design.md` and `2026-09-26-premium-hero-sky-summary-design.md`. The new hero is finished and must not change visually or behaviourally.

## 1. Purpose

Add the rest of the portfolio (Intro/About, Work, Experience, Footer/Contact) by lifting the existing components from `old-portfolio/` (Vite + React JSX, Tailwind v4, framer-motion) rather than rewriting them. The old Hero and old Nav are **not** moved. The result must read as one page: the sections sit on the same sky, with the same drifting clouds, glass surfaces, navy ink and serif headings as the hero.

## 2. What is lifted (unchanged unless listed in section 5)

From `old-portfolio/src/` into `src/sections/`:

- `components/Intro.jsx`, `Work.jsx`, `Experience.jsx`, `Footer.jsx`, `BurstHeading.jsx`
- `data.js` with the hero-only exports (`hero`, `nav`, and unused `profile` fields) removed; `placeholders.js` as is
- `ScrollProgress` (the top progress bar, currently inline in `App.jsx`), extracted to its own file
- Not lifted: old `Hero.jsx`, old `Nav.jsx`, `Cloud.jsx` (replaced, see 5), the `font-hand`/`font-ticket`/`perforation`/`animate-*`/`sky-gradient` CSS (used only by the old Hero), `clsx` (unused)

## 3. Tooling

- New dependencies: `tailwindcss`, `@tailwindcss/vite` (peer range covers Vite 6), `framer-motion` (supports React 19). No other runtime dependencies.
- `tsconfig.json`: `allowJs: true`, `checkJs: false` so `.tsx` can import the lifted `.jsx`.
- `vite.config.ts`: add the `@tailwindcss/vite` plugin.
- Tailwind is imported **utilities-only, no global reset**, so the hero's hand-written CSS is untouched:
  `@import "tailwindcss/theme.css" layer(theme);` and `@import "tailwindcss/utilities.css" layer(utilities) source(none);` with `@source "./sections";` so only the lifted files generate utilities.
- The old components relied on Tailwind's preflight, so a small **scoped reset** replaces it, declared inside `@layer base` under `.site-sections` (heading/paragraph margins 0, list-style none, links inherit colour with no underline, `img { display: block; max-width: 100% }`). It must be in a layer below `utilities`, otherwise unlayered rules would beat Tailwind utilities such as `mb-5`.
- `@theme` maps the old tokens onto the new palette: `--color-ink: #0f1f4d` (navy, was near-black), `--color-brand: #2f7ff2`, `--font-serif: "Playfair Display"`; `--font-sans` stays Inter (already loaded).
- Test setup gets `IntersectionObserver` and `ResizeObserver` stubs (framer-motion needs them in jsdom).

## 4. One continuous page

**Hero becomes scrollable content.** The hero currently uses `position: fixed` for its canvas and text column. Changes:

- `.hero-canvas` and `.hero-content` become `position: absolute` inside `.hero` (already `relative`, `100dvh`, `overflow: hidden`). `.site-nav`, `.page-loader` and the custom cursor stay fixed.
- `CharacterCanvas` pauses its tick while the canvas is off-screen (`IntersectionObserver`) and offsets the face anchor by the canvas's `getBoundingClientRect()` so tracking stays correct while the hero is partly scrolled. At scroll position 0 behaviour is identical to today.
- The custom cursor's hover detection also treats every `a` and `button` as a hover target (one-line change in `useInteractionTracking`), so links in the lifted sections get the hover ring without editing them.

**Page structure** (`App.tsx`): `ScrollProgress`, `Hero` (id `top`), then `<div class="site-sections">` containing Intro (`#about`), Work (`#work`), Experience (`#experience`, was `#resume`), Footer (`#contact`). The empty stub `<section>`s in `App.tsx` are removed. `html { scroll-behavior: smooth }` and the `::selection` colour are lifted from the old CSS.

**Nav** (the existing hero pill, not the old one): **WORK · ABOUT · EXPERIENCE · CONTACT** with anchors `#work`, `#about`, `#experience`, `#contact` (the old "Resume" item is dropped because it clashes with the hero's Resume button).

## 5. Look: same sky, clouds and motion

- **Sky below the hero:** `.site-sections` has a background that starts at the hero's horizon colour (`--sky-bottom`, `#9fd8ff`) so there is no seam, easing to a paler `#eaf5ff`.
- **Drifting clouds behind the sections:** a fixed, non-interactive `SiteSky` layer renders the existing `SkyClouds` behind `.site-sections` (`z-index` between the page and the sections), visible through the now-transparent sections. The hero stays opaque above it.
- **Backgrounds:** `bg-white` on Intro, Work, Experience becomes transparent (class edits). The Work last-card fade-to-white targets the pale sky colour instead.
- **Typography/colour:** navy ink via the theme mapping; `font-serif` (Playfair Display) added to the `BurstHeading` `h2` and the Footer `h2`. Intro's scroll reveal colours change from grey→near-black to translucent-navy→navy so they read on the sky.
- **Work cards:** keep the stacked-scroll behaviour and layout. The card surface gets the hero's glass language (deeper blue gradient + translucent white border + `backdrop-filter`) so it stays legible on the pale sky. The old cartoon `Cloud` is replaced by `SkyClouds` in a new `compact` mode (one layer, two tiles) so four cards don't each carry three heavy filtered layers.
- **Experience cards:** `bg-white` becomes frosted glass (`bg-white/70 backdrop-blur`); the timeline dot's `ring-white` matches the sky.
- **Footer:** the dark `bg-ink` becomes a deep-navy gradient (dusk at the bottom of the sky), keeping its radial glow and giant `SAKSHI` watermark.
- Reduced motion: framer-motion's scroll-linked effects and the cloud drift respect `prefers-reduced-motion` (drift already does; add `MotionConfig reducedMotion="user"` at the app root).

## 6. Content decisions

- **Experience years:** `3+ Years` everywhere (matches the hero card). The Experience subheading "four+ years, and counting" becomes "three+ years, and counting". `profile.experience` in the lifted `data.js` is `3+ Years`.
- Everything else in `data.js` moves as is. Known placeholders left untouched and reported to the user: LinkedIn/Behance links point at the sites' home pages; project images are generated SVG placeholders; every "View Case Study" button is a dead `#` link; the freelance entry starts Mar '21, which may not agree with "3+ years".

## 7. Verification

- Vitest: each lifted section renders its key content (headings, first work item, each experience company, footer email link); `Nav` renders the four links with the right hrefs; `App` renders the section ids in order (`top`, `about`, `work`, `experience`, `contact`); `useInteractionTracking` marks `a`/`button` as hover targets; all existing tests still pass.
- `tsc -b` and `npm run build` succeed.
- Playwright: screenshots at hero, Intro, Work (each stacked card), Experience (start/middle/end of the pan) and Footer for 1440x900, 1024x768 and 390x844; no horizontal overflow at 320px; nav anchors scroll to the right sections.
- Hero unchanged: hero-only screenshot at scroll 0 compared before/after at 1440x900 and 390x844, and the existing pointer-tracking check still turns her head.

## 8. Out of scope

Real case-study pages and imagery, real social URLs, re-styling the lifted components beyond section 5, a light/dark mode, and the pending shoulder-tip frame re-render.
