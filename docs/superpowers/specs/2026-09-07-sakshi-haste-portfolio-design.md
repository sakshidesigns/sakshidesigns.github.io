# Sakshi Haste Portfolio — High-Fidelity Wireframe/Prototype Design

## 1. Purpose & framing

Build a complete, high-fidelity, responsive portfolio prototype for Sakshi Haste (UI/UX & Product Designer). This is the design/interaction phase: the full visual system, page structure, responsive layouts, navigation, animations, and case-study framework must be built now using realistic, clearly-replaceable placeholders. Real project images, case-study copy, education details, personal photos, and final headings/metrics arrive later and must slot into the structure without any redesign.

Core narrative the site must express, and which drives layout/motion decisions (never the reverse):

```
ENTER → ARRIVE → DISCOVER → UNDERSTAND → EXPLORE → JOURNEY → KNOW → CONNECT
```

Visitor journey: begins inside an airplane cabin → looks through the window → passes into the sky → discovers Sakshi (hero) → explores her capabilities (What I Do) → follows a flight path into her work (Selected Work) → travels through her experience (Journey) → gets to know her (About) → arrives at Contact.

## 2. Non-negotiable constraints (from content brief)

- No grey wireframe boxes, no lorem ipsum, no generic AI portfolio copy, no unfinished layouts. Only actual project content/assets are placeholder; everything else (type, color, spacing, grid, hierarchy, cards, nav, hover/scroll states, transitions, responsive behavior) is finished.
- Visual world: natural blue sky, cotton-candy white clouds, white typography, restrained blue accent, translucent glass surfaces, thin white borders, restrained shadows, editorial typography, generous whitespace. Premium + editorial + modern + calm + slightly playful. Not cartoon, childish, futuristic, gamey, generic SaaS, or visually noisy.
- **Sky rule**: after the intro, the sky background itself is completely static — no camera movement, no parallax on the sky, no changing perspective. Only clouds move, and only slowly/softly/atmospherically.
- Airplane intro: no hand, no character; the shutter opens on its own. Cabin is "editorially illustrated realism" — realistic proportions/perspective, not photorealistic 3D, not flat vector cartoon. Scroll-controlled, ~1–1.5 viewport heights, reversible.
- Airplane motif (flight paths) appears only at 3 meaningful transitions: What I Do → Selected Work, Selected Work → Journey So Far, About → Contact (final, subtler). Never a generic recurring decoration.
- Selected Work is a sticky focus-shift system (one project dominant at a time, scale/opacity/blur/translate transitions) — explicitly not a carousel, not horizontal scroll.
- Journey So Far is chapter-style (current sharp, adjacent quieter, connecting route line) — explicitly not a generic dotted vertical timeline.
- Case studies share one modular template with swappable content-block types (single image, full-width image, two-image, three-image grid, UI gallery, image+text, text+image, flow diagram, before/after, mobile screens, desktop screens, metrics, quote/insight) — never locked to one rigid image layout.
- Back-to-Top / internal navigation must never replay the airplane cinematic; it plays only on a genuine fresh load/entry to `/`.
- Fully responsive at 1440/1280/1024/768/430/390/375, with mobile as an intentional redesign (not a shrink) including its own simplified airplane intro.
- Accessibility: semantic HTML, keyboard nav, visible focus states, correct heading hierarchy, alt text, accessible mobile menu, sufficient contrast, `prefers-reduced-motion` support that fully simplifies/skips motion while keeping all content reachable.
- Content must not invent: no fake stats, testimonials, clients, URLs, or case-study outcomes. Project order and facts are fixed (see §7).

## 3. Tech stack (confirmed)

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, chosen over a Vite SPA or static HTML/JS because case studies need real routes (`/work/[slug]`) and the modular content-block system benefits from shared React components over copy-pasted HTML.
- **GSAP + ScrollTrigger** (+ MotionPathPlugin for the flight-path plane) for all scroll-linked motion. Prefer transform/opacity-driven animation; no native-scroll hijacking.
- Placeholder imagery strategy (confirmed): **styled placeholder frames** — labeled, glass-aesthetic frames sitting in the exact final image slot (project name, aspect ratio, subtle icon/gradient) — never AI-generated mock screenshots that could be mistaken for real product UI.

## 4. Information architecture & routing

```
/                          full one-page journey (Airplane Intro → ... → Footer)
/work/bhoomi-foundation    case study
/work/kora                 case study
/work/schooliat            case study
/work/dataassist           case study
```

All four case studies render through one `CaseStudyTemplate`, driven by a per-project data record and an ordered array of content-block instances. Prev/Next project navigation uses the fixed order in §7.

## 5. Content data model

Typed data modules under `content/`, so future content edits never touch layout/component code:

- `content/projects.ts` — array of `Project`: `{ slug, number, title, category, shortDescription, role, scope, year, isLive?: boolean, heroImagePlaceholder, sections: { overview, problem, users, research, insights, userFlow, wireframes, designDecisions, finalUI, outcome, reflection }, gallery: ContentBlock[] }`. `ContentBlock` is a discriminated union over the 13 module types in §2 (single-image, full-width-image, two-image, three-image-grid, ui-gallery, image-text, text-image, flow-diagram, before-after, mobile-screens, desktop-screens, metrics, quote).
- `content/experience.ts` — ordered `Experience[]`: `{ company, role, dates, description }`, seeded with the three real roles given (Accenture / SAP-SAPUI5, Feb 2024–Sep 2025; IFT Media, UI/UX Designer, Sep 2023–Jan 2024; Globuzz, UI/UX Designer & Digital Lead). No invented roles or dates.
- `content/education.ts` — `Education[]`: seeded with the one real entry (B.Tech, Electronics & Telecommunication, Government College of Engineering Nagpur, 2018–2022), structured so more entries can be appended.
- `content/about.ts` — placeholder copy blocks for Design Philosophy, Background, Capabilities, Beyond Design, and the personal "when I'm not designing" section.
- `content/contact.ts` — placeholder `mailto:`, LinkedIn, Behance links, clearly marked as placeholders until real URLs are supplied.

## 6. Component architecture

```
app/
  layout.tsx                 — fonts, ReducedMotionProvider, SkyBackground mount
  page.tsx                   — Home: composes the one-page journey
  work/[slug]/page.tsx       — CaseStudyTemplate instance

components/
  sky/SkyBackground.tsx      — static gradient, painted once
  sky/CloudLayer.tsx         — independent slow-drift cloud shapes
  intro/AirplaneIntro.tsx    — pinned scroll timeline, sessionStorage-gated
  layout/Header.tsx
  layout/MobileMenu.tsx
  layout/Footer.tsx
  home/Hero.tsx
  home/HeroInteraction.tsx   — UNDERSTAND → SHAPE → SIMPLIFY → SHIP hover/scroll word
  home/WhatIDo.tsx
  home/FlightPath.tsx        — reusable, used at the 3 designated transitions only
  home/SelectedWork.tsx      — pinned focus-shift container
  home/ProjectCard.tsx
  home/Journey.tsx
  home/ExperienceChapter.tsx
  home/About.tsx
  home/Education.tsx
  home/PersonalSection.tsx
  home/Contact.tsx
  case-study/CaseStudyTemplate.tsx
  case-study/CaseStudyHero.tsx
  case-study/ContentBlock.tsx        — dispatches to the 13 block renderers
  case-study/ProjectNavigation.tsx   — prev/next + back-to-selected-work
  shared/RevealOnScroll.tsx          — reusable editorial reveal wrapper
  shared/PlaceholderFrame.tsx        — styled "replace me" image slot

lib/
  useReducedMotion.ts
  useIntroPlayedOnce.ts      — sessionStorage gate for the airplane intro
  gsap.ts                    — GSAP + plugin registration
```

## 7. Fixed project facts (do not alter)

Order: **01 Bhoomi Foundation, 02 Kora, 03 Schooliat, 04 DataAssist.**

- **Bhoomi Foundation** — government-affiliated smart waste-management platform; end-to-end UX/UI; scope covers Admin, Super Admin, RFID-tracked collection fleet, Citizen app, Complaints, Attendance, Driver contact; may carry a "Live Product" label; strongest visual emphasis of the four.
- **Kora** — personal healthcare records app; end-to-end UX/UI case study.
- **Schooliat** — multi-tenant School ERP; end-to-end product design across multiple role-based experiences.
- **DataAssist** — AI-powered SaaS dashboard; independent UX/UI concept, explicitly **not** presented as a launched client product.

## 8. Design system

- **Color**: sky gradient (3–4 blue stops, deep to soft), white/near-white text, one restrained accent blue, glass surface = translucent white + backdrop-blur + 1px ~30%-opacity white border, shadows soft and rare.
- **Typography**: one editorial display face for headings (serif or high-contrast sans) paired with a clean grotesk for body/labels/UI chrome — a specific pairing is selected during implementation and applied as a Tailwind theme token, not hard-coded per component.
- **Spacing/grid**: generous whitespace, editorial two-column layouts on desktop, collapsing to single-column, redesigned (not shrunk) mobile layouts.
- All tokens (color, type scale, spacing scale, radii, blur/border values for glass) live in `tailwind.config.ts` / CSS variables, not scattered literals.

## 9. Animation system

| Section | Technique |
|---|---|
| Airplane window intro | Pinned GSAP timeline scrubbed by ScrollTrigger over ~1.2 viewport heights: mechanical anticipation → shutter opens → sky/clouds reveal → camera moves toward and through window → cabin unmounts. Fully reversible on scroll-up. Plays only once per fresh `/` load via `useIntroPlayedOnce` (sessionStorage), never on Back-to-Top or in-page nav. |
| Clouds (all sections) | Independent infinite tweens (transform + slight opacity) unlinked from scroll; strongest choreography in the Hero, present but restrained elsewhere. Sky itself never animates. |
| Hero word interaction | `UNDERSTAND → SHAPE → SIMPLIFY → SHIP` — active word responds to hover/scroll/cursor with subtle type change + accent color + small movement; secondary to the hero, not a centerpiece. |
| What I Do | Sequential ScrollTrigger per capability line toggling blur/opacity/color as it crosses a focus band; active line gets the restrained accent. |
| Flight path (×3 only) | SVG path with dash-offset scrub for the draw-on, GSAP MotionPathPlugin moves a small elegant plane silhouette along it; disappears after arrival. |
| Selected Work | Pinned container, all 4 project panels stacked; scroll progress drives an active index that maps to scale/opacity/blur/translateY per card — focus shifts from one project to the next, no carousel semantics. |
| Case studies | `RevealOnScroll` wrapper (mask/opacity/translate/stagger) applied uniformly across whichever content blocks a case study uses. |
| Journey So Far | Each `ExperienceChapter` sharpens as active, recedes as previous/next, connected by a subtle SVG route line — chapter progression, not a dotted timeline. |
| About / Education / Personal | Calm typography and image reveals only; no new animation concept introduced this late in the journey. |
| Final flight path → Contact | Same mechanism as §"Flight path" but visually subtler, marking arrival. |

Overall motion intensity decreases across the journey: cinematic (intro) → atmospheric (clouds) → gentle (hero) → typography-focused (What I Do) → directional (flight path) → depth/focus-shift (Selected Work) → editorial reveal (case studies) → chapter progression (Journey) → calm (About) → arrival (Contact).

## 10. Responsive strategy

Breakpoints: 1440, 1280, 1024, 768, 430, 390, 375 (Tailwind theme `screens`).

- **Desktop**: editorial two-column layouts, sticky/pinned sections, large project cards, full flight paths, spacious type.
- **Tablet**: adjusted grid, spacing, type scale, card dimensions, shorter animation distances.
- **Mobile**: intentionally redesigned, not shrunk — single-column content, full-width project cards, simplified flight paths, smaller plane, fewer/slower clouds, shorter animation durations, dedicated mobile menu, stacked experience chapters, single-column case-study flow, and a redesigned (shorter, simpler) airplane intro sized to the viewport rather than a scaled-down cabin illustration.

## 11. Accessibility & reduced motion

- Semantic landmarks and heading hierarchy throughout; all interactive elements keyboard-reachable with visible focus states; accessible mobile menu (focus trap, Escape to close, ARIA `expanded` state); alt text on every image slot including placeholders.
- `useReducedMotion` reads `prefers-reduced-motion` once via a provider: when set, the airplane intro is skipped straight to the hero, cloud drift and parallax are disabled, and all scroll-linked reveals (What I Do, Selected Work, Journey, case studies) become instant/opacity-only state changes — no content is ever hidden or gated behind motion.
- Animations built on transform/opacity/clip-path (GPU-friendly), scroll listeners kept efficient, images lazy-loaded; native scrolling is never hijacked or blocked.

## 12. Build sequencing (single implementation plan, phased)

1. App shell, design tokens, `SkyBackground` + `CloudLayer`, `Header`/`MobileMenu`.
2. `AirplaneIntro`, `Hero` + `HeroInteraction`, `WhatIDo`, first `FlightPath` (What I Do → Selected Work).
3. `SelectedWork` focus-shift system + `ProjectCard`, `CaseStudyTemplate` + all content-block renderers + the four case-study pages, second `FlightPath` (Selected Work → Journey).
4. `Journey` + `ExperienceChapter`, `About`, `Education`, `PersonalSection`, final `FlightPath` (About → Contact).
5. `Contact`, `Footer` (including non-replaying Back-to-Top).
6. Cross-cutting pass: full responsive verification at all seven breakpoints, accessibility audit, `prefers-reduced-motion` verification, performance check (GPU-friendly properties only, lazy-loaded images).

## 13. Explicitly out of scope / forbidden

Moving sky, fast clouds, giant or cartoon airplane, a hand or character opening the window, the airplane appearing outside its 3 designated transitions, particle/star effects, excessive gradients or glassmorphism, a generic AI-sounding hero, a large biography in the hero, a horizontal project carousel, a generic dotted vertical timeline, excessive cursor effects, fake statistics/testimonials/clients/URLs/outcomes, lorem ipsum, unnecessary loaders, animation applied indiscriminately.

## 14. Reference inspiration (style/rhythm only, never to be copied)

Sanjay Menon (sky environment, What I Do, Selected Work, editorial scrolling, typography, calm motion) and Harini Senthil Kumar (concise personal intro, minimal hero copy, designer identity) are used only as calibration for visual language and interaction quality; the resulting identity is original to Sakshi Haste.
