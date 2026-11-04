# Site Sections: Lift & Shift onto the Sky Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Intro/About, Work, Experience and Footer/Contact to the portfolio by lifting the components from `old-portfolio/` (JSX + Tailwind v4 + framer-motion) with minimal edits, so they read as one page with the finished sky hero: same sky, drifting clouds, glass surfaces, navy ink and serif headings.

**Architecture:** The lifted files keep their original relative layout under `src/sections/` (`components/*.jsx`, `data.js`, `placeholders.js`) so their imports need no edits. Tailwind is imported utilities-only with no preflight, plus a scoped reset in `@layer base` under `.site-sections`, so the hand-written hero CSS cannot change. The hero's pinned canvas/text become part of the scrolling hero; a fixed `SiteSky` cloud layer (clipped to the sections wrapper) sits behind the transparent sections.

**Tech Stack:** Vite 6 + React 19 + TypeScript + Vitest (existing); new: `tailwindcss`, `@tailwindcss/vite`, `framer-motion`.

**Spec:** `docs/superpowers/specs/2026-09-26-site-sections-lift-and-shift-design.md`

**Working directory:** the worktree `C:\Users\saksh\OneDrive\Desktop\portfolio\.claude\worktrees\cursor-tracking-hero`. The old site is at `..\..\old-portfolio` relative to it (`C:\Users\saksh\OneDrive\Desktop\portfolio\old-portfolio`). The dev server is `npm run dev -- --port 5173 --strictPort`. The worktree has unrelated uncommitted changes (`.gitignore`, an old spec edit, moved/deleted assets): never `git add -A` or `git add .`; stage exactly the files each task names. Use the Write/Edit tools (not shell heredocs) for files containing backslashes or regexes. Playwright screenshots must be saved under `public/.playwright-mcp/` of the main checkout (`C:\Users\saksh\OneDrive\Desktop\portfolio\public\.playwright-mcp\`) and deleted at the end; never commit them.

## Global Constraints

- The hero must not change visually or behaviourally at scroll position 0 (compared in Task 6 with animations frozen via `prefers-reduced-motion`).
- The old `Hero.jsx` and old `Nav.jsx` are not moved. `clsx` and the old hero-only CSS (`font-hand`, `font-ticket`, `perforation`, `animate-*`, `sky-gradient`) are not moved.
- Lifted files are copied byte-for-byte except for the edits listed in Tasks 4 and 5 (and the trimmed `data.js` in Task 2). `Cloud.jsx` is lifted in Task 2 only because `Work.jsx` imports it, and is deleted in Task 5.
- New dependencies limited to `tailwindcss`, `@tailwindcss/vite`, `framer-motion`. No Tailwind preflight anywhere.
- Nav labels exactly: WORK · ABOUT · EXPERIENCE · CONTACT with anchors `#work`, `#about`, `#experience`, `#contact`.
- Experience years are `3+` everywhere (`3+ Years`, "three+ years, and counting"); never "4+"/"four+".
- Section ids in DOM order: `top` (hero), `about`, `work`, `experience`, `contact`.
- Sky colours: hero horizon `#9fd8ff` (`--sky-bottom`) flowing to `#eaf5ff`; ink `#0f1f4d`; brand `#2f7ff2`; headings in Playfair Display.
- `prefers-reduced-motion`: framer-motion respects it (`MotionConfig reducedMotion="user"`); cloud drift and card bobbing already stop.
- Verification viewports: 1440x900, 1024x768, 390x844, plus 320x568 for horizontal overflow.

## Review Focus

Failure modes the obvious tests would miss, most likely first:

1. **Tailwind vs hero CSS collisions.** Utilities must not restyle the hero, and the scoped reset must not beat Tailwind utilities (unlayered rules always beat layered ones). Pinned in Task 1 (CSS text test: no preflight, reset inside `@layer base`, `layer(utilities) source(none)`) and Task 6 (computed `margin-bottom` of a `BurstHeading` `h2` is non-zero).
2. **Hero pieces pinned to the screen and floating over the sections when scrolling.** Pinned in Task 4 (CSS test: `.hero-canvas` and `.hero-content` are not `position: fixed`) and Task 6 (screenshot after scrolling past the hero).
3. **Eye tracking wrong after scrolling** (face anchor is in canvas space, pointer is in viewport space). Pinned in Task 4 (`offsetByRect` unit test).
4. **Fixed cloud layer bleeding over the hero at scroll 0.** Pinned in Task 3 (CSS test: `.site-sections` has `clip-path: inset(0)`) and Task 6 (hero-unchanged pixel diff).
5. **jsdom crashes from framer-motion** (`IntersectionObserver`/`ResizeObserver` missing). Pinned in Task 1 (setup stubs) and Task 2 (every lifted section renders).
6. **Horizontal overflow** from the Experience pan track (`pl-[100vw]`) at narrow widths. Pinned in Task 6 (320px `scrollWidth` check).
7. **Duplicate SVG filter ids** when several `SkyClouds` are on one page (hero, site sky, four cards). Pinned in Task 3 (unique-id test).

---

### Task 1: Tooling, Tailwind wiring (no preflight), test stubs, hero baseline

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Modify: `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/test-setup.ts`
- Create: `src/sections/sections.css`, `src/sections/sections.css.test.ts`

**Interfaces:**
- Produces: CSS class scope `.site-sections`; Tailwind utilities (generated only from `src/sections/`); theme tokens `ink` (`#0f1f4d`), `brand` (`#2f7ff2`), `font-serif` (Playfair Display), `font-sans` (Inter). Global `IntersectionObserver`/`ResizeObserver` test stubs.

- [ ] **Step 1: Capture the hero baseline before touching anything**

With the dev server running from the worktree, use Playwright: `browser_emulate_media` with `reducedMotion: "reduce"`; for each of 1440x900 and 390x844: `browser_resize`, `browser_navigate` to `http://localhost:5173/`, `browser_evaluate` `async () => { const t0 = performance.now(); while (!document.querySelector('.page-loader').classList.contains('is-done') && performance.now() - t0 < 20000) await new Promise(r => setTimeout(r, 100)); await new Promise(r => setTimeout(r, 1000)); return true; }`, then `browser_take_screenshot` with filename `.playwright-mcp/baseline-1440.png` / `.playwright-mcp/baseline-390.png`. Leave `reducedMotion` set to `reduce` for now.
Expected: two PNGs exist; the loader is done in both.

- [ ] **Step 2: Install dependencies**

Run: `npm install tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 framer-motion@^13.2.0`
Expected: exits 0; `package.json` lists the three under `dependencies`/`devDependencies`. If `framer-motion@^13.2.0` is not resolvable, use the newest 12.x/13.x that lists React 19 in its peers and note the version in the ledger.

- [ ] **Step 2b: Allow JS and add the Tailwind plugin**

In `tsconfig.json` add inside `compilerOptions`: `"allowJs": true,` and `"checkJs": false,`.

In `vite.config.ts` replace the file with:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    // Vitest stubs CSS files to "" by default; these tests need the real text
    // of these two files to pin rules that cannot be checked in jsdom.
    css: { include: [/src\/index\.css/, /src\/sections\/sections\.css/] },
  },
});
```

- [ ] **Step 3: Write the failing CSS test**

Create `src/sections/sections.css.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import css from "./sections.css?raw";

describe("sections.css (Tailwind wiring)", () => {
  it("imports Tailwind utilities only: no preflight, no automatic source scanning", () => {
    expect(css).toContain('@import "tailwindcss/theme.css" layer(theme);');
    expect(css).toContain('@import "tailwindcss/utilities.css" layer(utilities) source(none);');
    expect(css).not.toMatch(/tailwindcss\/preflight/);
    expect(css).not.toMatch(/@import\s+["']tailwindcss["']/);
    expect(css).toContain('@source "./";');
  });

  it("declares layer order so the scoped reset (base) sits below utilities", () => {
    expect(css).toMatch(/@layer theme, base, components, utilities;/);
  });

  it("scopes the preflight replacement to .site-sections inside @layer base", () => {
    const base = css.match(/@layer base \{([\s\S]*?)\r?\n\}/);
    expect(base, "expected an @layer base block").not.toBeNull();
    expect(base![1]).toContain(".site-sections");
    expect(base![1]).toMatch(/list-style:\s*none/);
  });

  it("maps the old tokens onto the new palette", () => {
    expect(css).toMatch(/--color-ink:\s*#0f1f4d/);
    expect(css).toMatch(/--color-brand:\s*#2f7ff2/);
    expect(css).toMatch(/--font-serif:\s*"Playfair Display"/);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run src/sections/sections.css.test.ts`
Expected: FAIL (`Failed to resolve import "./sections.css?raw"` / file not found).

- [ ] **Step 5: Create `src/sections/sections.css`**

```css
/* Tailwind for the lifted sections. Utilities only: NO preflight (it would
   reset the hand-written hero CSS), and no automatic source scanning (so only
   files under src/sections generate utilities). */
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/utilities.css" layer(utilities) source(none);
@source "./";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", Georgia, serif;
  --color-ink: #0f1f4d;
  --color-brand: #2f7ff2;
}

/* The lifted components were written against Tailwind's preflight. This is a
   scoped replacement. It lives in @layer base, below utilities: unlayered
   rules would otherwise beat utilities such as `mb-5`. */
@layer base {
  .site-sections h1,
  .site-sections h2,
  .site-sections h3,
  .site-sections h4,
  .site-sections p,
  .site-sections blockquote {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
  }
  .site-sections ul,
  .site-sections ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .site-sections a {
    color: inherit;
    text-decoration: inherit;
  }
  .site-sections img,
  .site-sections svg {
    display: block;
    max-width: 100%;
  }
  .site-sections button {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
}

html {
  scroll-behavior: smooth;
}

::selection {
  background: var(--color-brand);
  color: #ffffff;
}

/* Grain overlay used by the Work cards. */
.noise::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

In `src/main.tsx` add `import "./sections/sections.css";` after `import "./index.css";`.

In `src/test-setup.ts` append:

```ts

// framer-motion (whileInView / useScroll) needs these; jsdom implements neither.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
for (const name of ["IntersectionObserver", "ResizeObserver"] as const) {
  if (typeof window !== "undefined" && !(name in window)) {
    Object.defineProperty(window, name, { writable: true, configurable: true, value: ObserverStub });
  }
}
```

- [ ] **Step 6: Run the test, the full suite, type-check and build**

Run: `npx vitest run src/sections/sections.css.test.ts` then `npm test` then `npx tsc -b` then `npm run build`
Expected: the 4 new tests PASS; the existing suite still passes; no TypeScript errors; build succeeds. Then in the browser, reload `http://localhost:5173/` (reduced motion still on) at 1440x900 and take `.playwright-mcp/after-t1-1440.png`; confirm by eye it matches `baseline-1440.png` (Tailwind must not have changed the hero; a precise pixel diff happens in Task 6).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts src/main.tsx src/test-setup.ts src/sections/sections.css src/sections/sections.css.test.ts
git commit -m "Add Tailwind (utilities-only, no preflight) and framer-motion for the lifted sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- package.json package-lock.json tsconfig.json vite.config.ts src/main.tsx src/test-setup.ts src/sections/sections.css src/sections/sections.css.test.ts
```

---

### Task 2: Lift the components, data and placeholders

**Files:**
- Create (copied): `src/sections/components/Intro.jsx`, `Work.jsx`, `Experience.jsx`, `Footer.jsx`, `BurstHeading.jsx`, `Cloud.jsx`; `src/sections/placeholders.js`
- Create (trimmed): `src/sections/data.js`
- Create (extracted): `src/sections/components/ScrollProgress.jsx`
- Test: `src/sections/sections.test.tsx`

**Interfaces:**
- Produces: default exports `Intro`, `Work`, `Experience`, `Footer`, `ScrollProgress` (JSX components, no props); named exports of `data.js`: `profile`, `intro`, `workHeading`, `work`, `experience`, `footer`.

- [ ] **Step 1: Write the failing test**

Create `src/sections/sections.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import Intro from "./components/Intro";
import ScrollProgress from "./components/ScrollProgress";
import Work from "./components/Work";
import { experience, footer, profile, work } from "./data";

describe("lifted sections render", () => {
  it("Intro shows its eyebrow and the full statement", () => {
    const { container } = render(<Intro />);
    expect(container.querySelector("#about")).not.toBeNull();
    expect(screen.getByText("What I do")).toBeInTheDocument();
    expect(container.querySelector("p")?.textContent).toContain("understand");
  });

  it("Work shows its heading and every project", () => {
    const { container } = render(<Work />);
    expect(container.querySelector("#work")).not.toBeNull();
    expect(screen.getByText("Selected Work")).toBeInTheDocument();
    work.forEach((item) => expect(screen.getByText(item.title)).toBeInTheDocument());
  });

  it("Experience shows every company", () => {
    render(<Experience />);
    experience.items.forEach((item) => expect(screen.getByText(item.company)).toBeInTheDocument());
  });

  it("Footer shows the contact email link and watermark", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("#contact")).not.toBeNull();
    expect(screen.getByRole("link", { name: profile.email })).toHaveAttribute("href", `mailto:${profile.email}`);
    expect(screen.getByText(footer.watermark)).toBeInTheDocument();
  });

  it("ScrollProgress renders", () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstChild).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/sections/sections.test.tsx`
Expected: FAIL (`Failed to resolve import "./components/Experience"`).

- [ ] **Step 3: Copy the unchanged files**

```bash
mkdir -p src/sections/components
cp ../../old-portfolio/src/components/Intro.jsx ../../old-portfolio/src/components/Work.jsx ../../old-portfolio/src/components/Experience.jsx ../../old-portfolio/src/components/Footer.jsx ../../old-portfolio/src/components/BurstHeading.jsx ../../old-portfolio/src/components/Cloud.jsx src/sections/components/
cp ../../old-portfolio/src/placeholders.js src/sections/placeholders.js
```

Expected: 6 component files and `placeholders.js` present. Do NOT copy `Hero.jsx` or `Nav.jsx`.

- [ ] **Step 4: Create the trimmed `src/sections/data.js`**

Copy `../../old-portfolio/src/data.js` and remove ONLY: the `avatarPlaceholder`, `photoPlaceholder`, `idPhotoPlaceholder` imports; the `nav` export; the `hero` export; and every `profile` field except `name`, `role`, `email`, `location`, `experience` (set to `'3+ Years'`), `socials`. Everything else (`intro`, `workHeading`, `work`, `experience`, `footer`) stays byte-identical. The file must begin exactly:

```js
// Central place for all portfolio content.
// Swap these values out later — components just read from here.
// (Trimmed when lifted from old-portfolio: the old hero-only exports were removed.)

import { phoneScreenPlaceholder, companyLogoPlaceholder } from './placeholders'

export const profile = {
  name: 'Sakshi Haste',
  role: 'UI/UX & Product Designer',
  email: 'sakshihaste1008@gmail.com',
  location: 'Pune, India',
  experience: '3+ Years',
  socials: {
    linkedin: 'https://linkedin.com/',
    behance: 'https://behance.net/',
  },
}

export const intro = {
```

followed by the old file's `intro`, `workHeading`, `work`, `experience`, `footer` blocks exactly as they are (starting at the old `export const intro = {`).

- [ ] **Step 5: Create `src/sections/components/ScrollProgress.jsx`**

Extracted verbatim from the old `App.jsx` (lines 9-22), as its own default-exported component:

```jsx
import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  })
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-brand"
    />
  )
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run src/sections/sections.test.tsx` then `npm test` then `npx tsc -b`
Expected: 5 new tests PASS, suite green, no type errors. If jsdom throws a framer-motion error about a missing browser API, add a stub for exactly that API to `src/test-setup.ts` (do not edit the lifted files) and record it in the ledger.

- [ ] **Step 7: Commit**

```bash
git add src/sections
git commit -m "Lift Intro, Work, Experience, Footer, BurstHeading, Cloud, data and placeholders from old-portfolio

Copied unchanged (data.js trimmed of hero-only exports); the old Hero and Nav are not moved.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/sections
```

---

### Task 3: `SkyClouds` compact mode + unique ids, `SiteSky`, sections wrapper background

**Files:**
- Modify: `src/components/SkyClouds.tsx`, `src/components/SkyClouds.test.tsx`, `src/index.css`, `src/index.css.test.ts`
- Create: `src/components/SiteSky.tsx`

**Interfaces:**
- Consumes: existing `SkyClouds` (3 layers x 3 tiles).
- Produces: `SkyClouds({ compact?: boolean })` (compact = 1 layer x 2 tiles, root class adds `sky-clouds-compact`); every instance's SVG filter ids are unique (`useId`-based). `SiteSky()` renders `<div class="site-sky" aria-hidden="true"><SkyClouds /></div>`. CSS classes `.site-sections`, `.site-sky`, `.sky-clouds-compact`.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/SkyClouds.test.tsx` (inside the file, after the existing `describe`), adding `import { Fragment } from "react";` is not needed; use this:

```tsx
describe("SkyClouds compact mode and unique ids", () => {
  it("compact renders one layer of two tiles and is marked compact", () => {
    const { container } = render(<SkyClouds compact />);
    expect(container.querySelector(".sky-clouds")).toHaveClass("sky-clouds-compact");
    const layers = container.querySelectorAll(".sky-cloud-layer");
    expect(layers).toHaveLength(1);
    expect(layers[0].querySelectorAll("svg")).toHaveLength(2);
  });

  it("gives every filter a document-unique id even with several instances on the page", () => {
    const { container } = render(
      <>
        <SkyClouds />
        <SkyClouds />
        <SkyClouds compact />
      </>
    );
    const ids = [...container.querySelectorAll("filter")].map((filter) => filter.id);
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

Append to `src/index.css.test.ts`:

```ts
describe("index.css sections wrapper", () => {
  it("clips the fixed sky layer to the sections so the clouds never paint over the hero", () => {
    expect(ruleBodies(".site-sections")).toContain("clip-path: inset(0)");
  });

  it("keeps the site sky fixed, behind the sections and non-interactive", () => {
    const body = ruleBodies(".site-sky");
    expect(body).toContain("position: fixed");
    expect(body).toMatch(/z-index:\s*-1/);
    expect(body).toContain("pointer-events: none");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/components/SkyClouds.test.tsx src/index.css.test.ts`
Expected: FAIL (compact class missing; duplicate ids; `.site-sections`/`.site-sky` rules not found).

- [ ] **Step 3: Implement `SkyClouds` changes**

In `src/components/SkyClouds.tsx`: add `import { useId } from "react";` at the top; change the signature and body:

```tsx
export function SkyClouds({ compact = false }: { compact?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const layers = compact ? LAYERS.slice(0, 1) : LAYERS;
  const tiles = compact ? [0, 1] : [0, 1, 2];
  const filterId = (layer: CloudLayer) => `${uid}-${layer.id}`;
  return (
    <div className={compact ? "sky-clouds sky-clouds-compact" : "sky-clouds"} aria-hidden="true">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {layers.map((layer) => (
            <filter
              key={layer.id}
              id={filterId(layer)}
              filterUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={TILE_WIDTH}
              height={TILE_HEIGHT}
            >
              {/* feTurbulence / feColorMatrix / feGaussianBlur children exactly as before */}
            </filter>
          ))}
        </defs>
      </svg>
      {layers.map((layer) => (
        <div
          key={layer.id}
          className="sky-cloud-layer"
          style={{ top: layer.top, opacity: layer.opacity, animationDuration: `${layer.duration}s` }}
        >
          {tiles.map((copy) => (
            <svg key={copy} width={TILE_WIDTH} height={TILE_HEIGHT} viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`}>
              <rect width={TILE_WIDTH} height={TILE_HEIGHT} fill="#ffffff" filter={`url(#${filterId(layer)})`} />
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}
```

Keep the three `fe*` child elements inside `<filter>` exactly as they are today (do not retype them differently). The existing three tests in `SkyClouds.test.tsx` must still pass unchanged.

Create `src/components/SiteSky.tsx`:

```tsx
// src/components/SiteSky.tsx
// The drifting hero clouds, fixed behind the lifted sections. Clipped to the
// sections wrapper (see .site-sections) so they never paint over the hero.
import { SkyClouds } from "./SkyClouds";

export function SiteSky() {
  return (
    <div className="site-sky" aria-hidden="true">
      <SkyClouds />
    </div>
  );
}
```

Append to `src/index.css`:

```css

/* --- Sections below the hero: one continuous sky --- */
.site-sections {
  position: relative;
  /* Starts at the hero's horizon colour so there is no seam. */
  background: linear-gradient(180deg, var(--sky-bottom) 0%, #eaf5ff 100%);
  color: var(--ink);
  /* Clips the fixed .site-sky to this wrapper (overflow does not clip fixed
     descendants; clip-path does) and creates the stacking context that keeps
     the z-index -1 layer above this background but behind the sections. */
  clip-path: inset(0);
}

.site-sky {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

/* Compact clouds sit inside a card: fill the card, not the viewport. */
.sky-clouds-compact {
  height: 100%;
}
```

- [ ] **Step 4: Run tests, type-check, build**

Run: `npx vitest run src/components/SkyClouds.test.tsx src/index.css.test.ts` then `npm test` then `npx tsc -b`
Expected: all PASS (existing SkyClouds tests included); no type errors. Hero clouds look unchanged: reload at 1440x900 and confirm clouds still render in the hero.

- [ ] **Step 5: Commit**

```bash
git add src/components/SkyClouds.tsx src/components/SkyClouds.test.tsx src/components/SiteSky.tsx src/index.css src/index.css.test.ts
git commit -m "Add SkyClouds compact mode with unique filter ids, SiteSky and the sections wrapper background

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/components/SkyClouds.tsx src/components/SkyClouds.test.tsx src/components/SiteSky.tsx src/index.css src/index.css.test.ts
```

---

### Task 4: Hero as scrolling content, nav, hover targets, App wiring

**Files:**
- Modify: `src/index.css`, `src/index.css.test.ts`, `src/lib/coverTransform.ts`, `src/lib/coverTransform.test.ts`, `src/components/CharacterCanvas.tsx`, `src/hooks/useInteractionTracking.ts`, `src/hooks/useInteractionTracking.test.tsx`, `src/components/Nav.tsx`, `src/components/Hero.tsx`, `src/App.tsx`
- Create: `src/components/Nav.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Produces: `offsetByRect(point: {x: number; y: number}, rect: {left: number; top: number}): {x: number; y: number}` in `coverTransform.ts`; hover selector `a, button, [data-cursor-hover]`; `Nav` links `#work/#about/#experience/#contact`; `<section id="top" class="hero">`; `App` = `MotionConfig` > `ScrollProgress` + `main` > (`Hero`, `.site-sections` > `SiteSky`, `Intro`, `Work`, `Experience`, `Footer`).

- [ ] **Step 1: Write the failing tests**

`src/lib/coverTransform.test.ts` — add `offsetByRect` to the import list and append:

```ts
describe("offsetByRect", () => {
  it("moves a canvas-space point into viewport space by the canvas's on-screen position", () => {
    expect(offsetByRect({ x: 704, y: 342 }, { left: 0, top: -250 })).toEqual({ x: 704, y: 92 });
    expect(offsetByRect({ x: 10, y: 20 }, { left: 5, top: 7 })).toEqual({ x: 15, y: 27 });
  });
});
```

`src/hooks/useInteractionTracking.test.tsx` — in `TestHarness`, add two elements after the `data-cursor-hover` button (existing tests are unaffected): `<a href="#plain">plain link</a>` and `<button>plain button</button>`. Then add inside the existing `describe`:

```tsx
  it("treats plain links and plain buttons (no data attribute) as hover targets", () => {
    const { getByText, getByTestId } = render(<TestHarness />);
    const outside = getByTestId("outside");
    for (const label of ["plain link", "plain button"]) {
      const target = getByText(label);
      act(() => {
        target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      });
      expect(interactionState.hovering, label).toBe(true);
      act(() => {
        target.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: outside }));
      });
      expect(interactionState.hovering, label).toBe(false);
    }
  });
```

`src/components/Nav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav } from "./Nav";

describe("Nav", () => {
  it("links to the four page sections in order", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Work", "About", "Experience", "Contact"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#work", "#about", "#experience", "#contact"]);
  });
});
```

`src/App.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, blob: async () => new Blob([]) })));
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders the hero and the four sections in order with the nav anchors' ids", () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll("#top, #about, #work, #experience, #contact")].map((el) => el.id);
    expect(ids).toEqual(["top", "about", "work", "experience", "contact"]);
  });

  it("puts the lifted sections inside the .site-sections wrapper and the hero outside it", () => {
    const { container } = render(<App />);
    const wrapper = container.querySelector(".site-sections") as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector("#about, #work, #experience, #contact")).not.toBeNull();
    expect(wrapper.querySelector("#top")).toBeNull();
    expect(wrapper.querySelector(".site-sky")).not.toBeNull();
  });
});
```

`src/index.css.test.ts` — replace the existing "viewport height" test with:

```ts
describe("index.css hero layers scroll with the page", () => {
  it("sizes the hero with the dynamic viewport unit so phone toolbars neither stretch nor hide the bottom of the scene", () => {
    expect(ruleBodies(".hero")).toContain("100dvh");
  });

  it("keeps the canvas and text column inside the hero (absolute), never pinned to the screen (fixed)", () => {
    expect(ruleBodies(".hero-canvas")).not.toContain("position: fixed");
    expect(ruleBodies(".hero-canvas")).toContain("position: absolute");
    expect(ruleBodies(".hero-content")).not.toContain("position: fixed");
    expect(ruleBodies(".hero-content")).toContain("position: absolute");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL in `offsetByRect`, the hover test, `Nav`, `App` (imports/ids), and the new CSS test.

- [ ] **Step 3: Implement**

`src/lib/coverTransform.ts` — append:

```ts

/** Moves a point from canvas space into viewport space, given the canvas's on-screen rectangle. */
export function offsetByRect(point: { x: number; y: number }, rect: { left: number; top: number }): { x: number; y: number } {
  return { x: point.x + rect.left, y: point.y + rect.top };
}
```

`src/hooks/useInteractionTracking.ts` — replace `const HOVER_ATTR = "data-cursor-hover";` with `const HOVER_SELECTOR = "a, button, [data-cursor-hover]";` and change both `closest(\`[${HOVER_ATTR}]\`)` calls to `closest(HOVER_SELECTOR)`.

`src/components/Nav.tsx` — replace the three links with four: Work `#work`, About `#about`, Experience `#experience`, Contact `#contact` (each `<a href=... data-cursor-hover>` exactly like today).

`src/components/Hero.tsx` — add `id="top"` to the `<section className="hero" ...>`.

`src/components/CharacterCanvas.tsx` — (a) import `offsetByRect` from `../lib/coverTransform`; (b) add `const visibleRef = useRef(true);` and inside the second `useEffect`, before `subscribeTick`, an `IntersectionObserver` on `canvas`:

```tsx
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting) lastDrawnRef.current = null; // redraw on return
          });
    observer?.observe(canvas);
```
and `observer?.disconnect();` in the effect cleanup; (c) at the top of the tick callback add `if (!visibleRef.current) return;`; (d) wrap the anchor: `const faceAnchor = offsetByRect(mapSourcePointToContainer(...), canvas.getBoundingClientRect());` (`canvas` is the non-null local already defined in that effect; use `canvas!` if TypeScript requires it).

`src/index.css` — in the `.hero-canvas` rule replace `position: fixed; inset: 0; display: block; width: 100vw; height: 100vh; height: 100dvh;` with `position: absolute; inset: 0; display: block; width: 100%; height: 100%;` (keep its comment, updated to say it fills the hero, which is `100dvh`). In the `.hero-content` rule change `position: fixed;` to `position: absolute;`. Do not touch `.site-nav`, `.page-loader` or the cursor (they stay `fixed`).

`src/App.tsx` — replace the file:

```tsx
// src/App.tsx
import { MotionConfig } from "framer-motion";
import { Hero } from "./components/Hero";
import { SiteSky } from "./components/SiteSky";
import Experience from "./sections/components/Experience";
import Footer from "./sections/components/Footer";
import Intro from "./sections/components/Intro";
import ScrollProgress from "./sections/components/ScrollProgress";
import Work from "./sections/components/Work";

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      <main>
        <Hero />
        <div className="site-sections">
          <SiteSky />
          <Intro />
          <Work />
          <Experience />
          <Footer />
        </div>
      </main>
    </MotionConfig>
  );
}
```

`src/sections/components/Experience.jsx` — one edit so the nav anchor and the App test line up: `<section id="resume" className="relative bg-white">` → `<section id="experience" className="relative bg-white">` (only the id; the background is restyled in Task 5).

- [ ] **Step 4: Run tests, type-check, build**

Run: `npm test` then `npx tsc -b` then `npm run build`
Expected: all PASS; build succeeds.

- [ ] **Step 5: Browser check of the pinned pieces**

Reduced motion still emulated. At 1440x900 reload; then `browser_evaluate` `() => { window.scrollTo(0, 900); return true; }`, wait 1 s, screenshot `.playwright-mcp/t4-scrolled.png`. Expected: the character, hero text and cards are NOT visible over the sections (they scrolled away with the hero); the nav pill and scroll-progress bar remain fixed. Scroll back to 0 and confirm the hero looks as before.

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/index.css.test.ts src/lib/coverTransform.ts src/lib/coverTransform.test.ts src/components/CharacterCanvas.tsx src/hooks/useInteractionTracking.ts src/hooks/useInteractionTracking.test.tsx src/components/Nav.tsx src/components/Nav.test.tsx src/components/Hero.tsx src/App.tsx src/App.test.tsx src/sections/components/Experience.jsx
git commit -m "Make the hero scroll with the page and wire the lifted sections into App

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/index.css src/index.css.test.ts src/lib/coverTransform.ts src/lib/coverTransform.test.ts src/components/CharacterCanvas.tsx src/hooks/useInteractionTracking.ts src/hooks/useInteractionTracking.test.tsx src/components/Nav.tsx src/components/Nav.test.tsx src/components/Hero.tsx src/App.tsx src/App.test.tsx src/sections/components/Experience.jsx
```

---

### Task 5: Restyle the lifted sections onto the sky (the only edits to lifted files)

**Files:**
- Modify: `src/sections/components/Intro.jsx`, `Work.jsx`, `Experience.jsx`, `Footer.jsx`, `BurstHeading.jsx`, `src/sections/data.js`, `src/sections/sections.css`
- Delete: `src/sections/components/Cloud.jsx`
- Test: `src/sections/restyle.test.tsx`

**Interfaces:**
- Consumes: `SkyClouds({ compact })` (Task 3), `.site-sections` (Task 3).
- Produces: sections with transparent backgrounds, `font-serif` headings, glass cards, navy footer; section id `experience`.

- [ ] **Step 1: Write the failing test**

Create `src/sections/restyle.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BurstHeading from "./components/BurstHeading";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import Intro from "./components/Intro";
import Work from "./components/Work";
import { experience, work } from "./data";

describe("lifted sections sit on the sky", () => {
  it("have no opaque white/ink section backgrounds", () => {
    for (const [element, selector] of [
      [render(<Intro />).container, "#about"],
      [render(<Work />).container, "#work"],
      [render(<Experience />).container, "#experience"],
      [render(<Footer />).container, "#contact"],
    ] as const) {
      const root = element.querySelector(selector) as HTMLElement;
      expect(root, selector).not.toBeNull();
      expect(root.className).not.toMatch(/\bbg-white\b/);
      expect(root.className).not.toMatch(/\bbg-ink\b/);
    }
  });

  it("uses the serif display font for section headings", () => {
    const { container: burst } = render(<BurstHeading eyebrow="e" title="a title" />);
    expect(burst.querySelector("h2")).toHaveClass("font-serif");
    const { container: footer } = render(<Footer />);
    expect(footer.querySelector("h2")).toHaveClass("font-serif");
  });

  it("puts realistic (compact) clouds in every Work card", () => {
    const { container } = render(<Work />);
    expect(container.querySelectorAll(".sky-clouds-compact")).toHaveLength(work.length);
  });

  it("says 3+ years, never 4+", () => {
    expect(experience.subheading).toMatch(/three\+ years/i);
    expect(experience.subheading).not.toMatch(/four\+/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/sections/restyle.test.tsx`
Expected: FAIL (bg-white present, no `font-serif`, no compact clouds, `#experience` missing, "four+" present).

- [ ] **Step 3: Apply the edits (exact replacements)**

`Intro.jsx`:
- `['#a3a9b3', '#0f1115']` → `['rgba(15, 31, 77, 0.3)', '#0f1f4d']`
- `className="relative bg-white px-6 py-32 sm:py-40"` → `className="relative px-6 py-32 sm:py-40"`

`Work.jsx`:
- `import Cloud from './Cloud'` → `import { SkyClouds } from '../../components/SkyClouds'`
- Replace the whole `function CardClouds() { ... }` with:
```jsx
function CardClouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
      <SkyClouds compact />
    </div>
  )
}
```
- `<section id="work" className="relative bg-white">` → `<section id="work" className="relative">`
- `rgba(255,255,255,0.9)` → `rgba(234,245,255,0.95)` (last-card fade targets the pale sky)

`Experience.jsx`:
- `<section id="experience" className="relative bg-white">` → `<section id="experience" className="relative">` (the id was changed in Task 4)
- `bg-white p-6 shadow-lg shadow-black/5 sm:p-7` → `bg-white/70 p-6 shadow-lg shadow-black/5 backdrop-blur-md sm:p-7`
- `ring-4 ring-white` → `ring-4 ring-white/70`

`BurstHeading.jsx`: in the `h2` className, insert `font-serif ` before `text-balance` (i.e. `className="font-serif text-balance text-4xl font-extrabold ..."`).

`Footer.jsx`:
- `className="relative overflow-hidden bg-ink py-28 text-white"` → `className="relative overflow-hidden pb-28 pt-56 text-white"` and add to that same element `style={{ background: 'linear-gradient(180deg, #eaf5ff 0%, #8fb8ec 9%, #2a4b95 24%, #0b1638 46%, #0b1638 100%)' }}`
- In the `motion.h2` className insert `font-serif ` before `text-balance`.

`data.js`: in `experience.subheading` replace `four+ years, and counting.` with `three+ years, and counting.`

`sections.css`: append

```css

/* Work card surface: the hero's glass language (deeper blue gradient,
   translucent white border, backdrop blur) so it reads on the pale sky. */
.card-sky-gradient {
  background: linear-gradient(160deg, rgba(31, 111, 214, 0.94) 0%, rgba(61, 155, 245, 0.9) 55%, rgba(108, 184, 248, 0.86) 100%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}
```

Delete `src/sections/components/Cloud.jsx` (`git rm` is not needed; it was never committed elsewhere: use `git rm src/sections/components/Cloud.jsx`).

- [ ] **Step 4: Run tests, type-check, build**

Run: `npx vitest run src/sections` then `npm test` then `npx tsc -b` then `npm run build`
Expected: all PASS including the App id test (`#experience`); build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/sections
git commit -m "Restyle the lifted sections onto the sky: transparent backgrounds, serif headings, glass cards, navy footer, 3+ years

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/sections
```

---

### Task 6: Verify the whole page in the browser

**Files:** none modified unless a defect is found (fix it with a test where a unit test can express it, else with the smallest CSS change, and ledger it).

- [ ] **Step 1: Hero unchanged (pixel diff)**

`browser_emulate_media` `reducedMotion: "reduce"` still on. For 1440x900 and 390x844 repeat the baseline capture from Task 1 step 1 with filenames `.playwright-mcp/final-1440.png` / `.playwright-mcp/final-390.png`. Then run:

```bash
python - <<'PYEOF'
import cv2, numpy as np
base = "C:/Users/saksh/OneDrive/Desktop/portfolio/public/.playwright-mcp"
for size in ("1440", "390"):
    a = cv2.imread(f"{base}/baseline-{size}.png"); b = cv2.imread(f"{base}/final-{size}.png")
    assert a is not None and b is not None and a.shape == b.shape, size
    d = np.abs(a.astype(int) - b.astype(int)).mean()
    print(size, "mean abs diff:", round(float(d), 3))
PYEOF
```
Expected: mean absolute difference below 1.0 for both sizes. If higher, view both images, find the changed region and fix the cause (it is a regression of the hero, not an acceptable difference).

- [ ] **Step 2: Tracking still works while scrolled**

Emulate `no-preference`, load at 1440x900, scroll to `window.scrollTo(0, 300)`, dispatch a `pointermove` at the top-right of the viewport, wait 3 s, screenshot `.playwright-mcp/final-tracking.png`. Expected: her head turns up and to the right relative to the (scrolled) face; no console errors.

- [ ] **Step 3: Section screenshots**

For 1440x900, 1024x768 and 390x844, scroll to each of: Intro, Work (top, and after each stacked card completes), Experience (start, middle, end of the horizontal pan), Footer; take a screenshot at each and read them. Check: navy text is legible on the sky; the sky is seamless where the hero ends; clouds drift behind (visible through transparent sections); Work cards are legible glass; Experience cards are frosted; footer transitions to deep navy; the nav pill and progress bar stay on top; nothing from the hero overlaps a section.

- [ ] **Step 4: Layout-layer checks**

`browser_evaluate` at 1440x900 (load the page first):
- Layer order: `() => { const cs = (sel) => getComputedStyle(document.querySelector(sel)); return { scrollBehavior: cs('html').scrollBehavior, siteSectionsClip: cs('.site-sections').clipPath, heroCanvasPosition: cs('.hero-canvas').position, heroContentPosition: cs('.hero-content').position, navPosition: cs('.site-nav').position, workSubtitleMarginTop: cs('#work p').marginTop }; }` Expect `smooth`, `inset(0px)`, `absolute`, `absolute`, `fixed`, and a `workSubtitleMarginTop` of `24px` (the BurstHeading subtitle's `mt-6`); a value of `0px` means the scoped reset is beating Tailwind utilities and must be moved into `@layer base`.
- Nav anchors: for each of `#work`, `#about`, `#experience`, `#contact`, click the nav link (or set `location.hash`) and confirm the target section's top is within 120px of the viewport top after 1 s.
- 320x568: `() => document.documentElement.scrollWidth <= innerWidth` must be `true` (also at the Experience section scrolled to its end). If not, find the offender with `[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1)` and constrain it with the smallest CSS change.
- Reduced motion: with `reducedMotion: "reduce"`, `document.querySelectorAll('.sky-cloud-layer')` computed `animationName` is `none`, and the Intro words are not mid-blur after scrolling past them (framer-motion respects `MotionConfig reducedMotion="user"`).

- [ ] **Step 5: Full suite and cleanup**

Run: `npm test`, `npx tsc -b`, `npm run build`, `python -m unittest discover -s scripts -p "test_*.py"`, `python scripts/verify_frames.py`.
Expected: all PASS. Delete the scratch screenshots: remove `C:\Users\saksh\OneDrive\Desktop\portfolio\public\.playwright-mcp` (never commit it). Restore `browser_emulate_media` `reducedMotion: "no-preference"`.

- [ ] **Step 6: Commit (only if a defect fix was needed)**

Stage only the files changed by the fix, commit with a message naming the defect.

---

## Self-Review Notes

- **Spec coverage:** §2 lifted files → Task 2 (+ `ScrollProgress`, `Cloud` deleted in Task 5); §3 tooling → Task 1; §4 hero/nav/cursor/App → Task 4; §5 look → Tasks 3 and 5; §6 content (3+ years) → Tasks 2 and 5; §7 verification → tests in Tasks 1-5, browser in Task 6; §8 out of scope respected.
- **Deviation from the spec to note in the ledger:** the lifted files keep their original relative layout (`src/sections/components/`, `src/sections/data.js`) so imports need no edits; `Cloud.jsx` is lifted in Task 2 and deleted in Task 5 because `Work.jsx` imports it until it is replaced.
- **Consistency:** `SkyClouds({ compact })`, `.sky-clouds-compact`, `.site-sections`, `.site-sky`, `offsetByRect`, `HOVER_SELECTOR`, section ids and `MotionConfig reducedMotion="user"` are named identically wherever used.
- **Known judgement calls to tune with screenshots:** footer gradient stops and top padding, card glass opacities, `opacity-70` on card clouds.
