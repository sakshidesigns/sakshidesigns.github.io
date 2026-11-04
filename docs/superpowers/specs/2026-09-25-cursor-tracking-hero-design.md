# Cursor-Tracking Character Hero — Design

## 1. Purpose & framing

A new, standalone portfolio project (separate from the earlier `2026-09-07-sakshi-haste-portfolio-design.md` airplane/sky spec, which is left as an unused reference doc — not superseded, not built on). This project's hero section is a full-viewport character portrait whose head follows the visitor's cursor in real time, built entirely from a pre-recorded animation with no in-browser video playback or 3D transforms. Subject: Sakshi Haste, UI/UX & Product Designer.

## 2. Non-negotiable technical constraints

1. No CSS 3D transforms (`perspective`, `rotateX`, `rotateY`) anywhere on the page or canvas. The canvas element itself never moves or transforms — only which bitmap is drawn on it changes.
2. The source MP4 (`source-assets/character.mp4`) is never seeked or played in the browser (single-keyframe generated video → severe stutter/freeze risk). It is only ever read at build time by a Python script.
3. All character frames are pre-extracted, high-quality WebP stills, drawn one at a time on a `<canvas>`, at 100% opacity, with zero alpha-blending between frames (blending two frames causes visible double-face ghosting).

## 3. Source video — investigated facts

`source-assets/character.mp4`: 1280×720, 24 fps, 240 frames total (10s), solid flat background, confirmed via pixel sampling across all frames as **`#64bce2`** (std-dev ≈ 2–6 per channel — genuinely flat, not a gradient).

The clip is one continuous, real animation, not 8 discrete stills: it starts at a neutral center pose, sweeps clockwise through all 8 compass directions in viewer/screen space, and returns to a neutral center hold at the tail — i.e. the whole 240-frame clip is already a seamless 360° loop (frame 0 and the tail frames are visually equivalent "center" poses). This was confirmed by visually inspecting labeled contact sheets of the full clip.

Hand-identified anchor frames (by inspection), in time order, with true screen-angle labeled in VIEWER space — not the character's own left/right (convention: `atan2(dy, dx)` in y-down screen space — 0°=RIGHT, 90°=DOWN, 180°=LEFT, 270°=UP, increasing clockwise):

| time-order k | source frame | direction | angle |
|---|---|---|---|
| 0 | 18 | UP | 270° |
| 1 | 39 | UP-RIGHT | 315° |
| 2 | 60 | RIGHT | 0° |
| 3 | 93 | DOWN-RIGHT | 45° |
| 4 | 111 | DOWN | 90° |
| 5 | 126 | DOWN-LEFT | 135° |
| 6 | 165 | LEFT | 180° |
| 7 | 189 | UP-LEFT | 225° |
| 8 | 258 (=18, next-loop wrap) | UP | 270° |

Dedicated neutral/eye-contact frame for the cursor-near-face deadzone: **source frame 219** (direct gaze, closed warm smile, no head tilt) — visually confirmed, saved as `center.webp`.

Approximate face anchor (eye-level midpoint), used as the `atan2` origin, measured in the source video's native 1280×720 space via darkest-pixel clustering in a narrow eye-level band: **normalized `(0.49, 0.38)`** (49% across, 38% down). This gets remapped through the same `object-fit: cover` transform used to draw the canvas, recomputed on resize, to get the live viewport-pixel anchor.

## 4. Asset pipeline

`scripts/extract_frames.py` (already written and run — see file for full derivation comments):

- Reads all 240 source frames via OpenCV.
- For each of 64 target angles (`i * 5.625°`, `i = 0..63`), finds which pair of adjacent anchors (table above) brackets that angle and linearly interpolates the **real source frame index** at the proportional position between them (never interpolates pixels — always picks one genuine recorded frame).
- Writes `public/frames/frame_00.webp` … `frame_63.webp` (`frame_XX` = angle `XX * 5.625°`) plus `public/frames/center.webp`, all at WebP quality 92, native 1280×720 resolution (no upscaling).
- Output re-verified visually as a smooth, gap-free, monotonic 360° sweep with no discontinuities.

This script is a one-time/re-run-when-source-changes build tool, not part of the app's runtime.

## 5. Tech stack

Vite + React + TypeScript, scaffolded fresh at the repo root. No routing library needed yet (single page); the nav pill's `WORK`/`ABOUT`/`CONTACT` links are in-page anchors to stubbed `<section>`s so future sections can be filled in without touching the hero.

## 6. Component architecture

```
src/
  main.tsx
  App.tsx                    — mounts <Hero/> + empty #work #about #contact section stubs
  components/
    Hero.tsx                 — composes CharacterCanvas + Nav + HeroContent, owns pointer tracking
    CharacterCanvas.tsx       — full-viewport <canvas>; the rAF loop lives here
    Nav.tsx                  — frosted-glass pill nav, centered top
    HeroContent.tsx          — bottom-left type block + CTA pills
    MagneticCursor.tsx       — custom dot + trailing aura ring
  hooks/
    usePointerTarget.ts       — mousemove -> mutable ref {x,y} (no re-renders); exposes hover-target scale via a small event-driven store for MagneticCursor
    useReducedMotion.ts       — reads prefers-reduced-motion once
  lib/
    frameAssets.ts            — preloads the 65 WebP Images into an array, exposes a ready promise
    angle.ts                  — angleTo(origin, point), lerpAngle(current, target, factor), angleToFrameIndex(angle)
    coverTransform.ts         — given canvas size + source 1280x720, returns the object-fit:cover scale/offset, and a helper to map the normalized face anchor (0.49, 0.38) through it into live viewport pixels
public/
  frames/frame_00.webp … frame_63.webp, center.webp   (done)
  resume.pdf             (placeholder added if not already present)
source-assets/
  character.mp4          (build-time source only; kept outside public/ so Vite
                          never copies it into the shipped bundle)
scripts/
  extract_frames.py      (done)
```

Single shared `requestAnimationFrame` loop, owned by `CharacterCanvas`: each tick it (a) reads the latest pointer position from the shared ref, (b) recomputes the live face anchor via `coverTransform` (cheap, or cached until resize), (c) computes target angle, lerps it, selects and draws exactly one frame, and (d) updates the magnetic cursor's lerped position/scale (cursor visuals rendered as absolutely-positioned DOM elements transformed via `translate3d`, not canvas, so they composite on their own layer). One loop avoids two competing 60fps timers.

## 7. Renderer algorithm

1. Preload all 65 images before first paint; render nothing (or a static `center.webp` `<img>` fallback) until ready.
2. Each frame: `dx = cursorX - faceAnchorX`, `dy = cursorY - faceAnchorY`; `targetAngle = atan2(dy, dx)` in degrees, normalized to `[0, 360)`.
3. `smoothedAngle = lerpAngle(smoothedAngle, targetAngle, 0.26)` — shortest angular path (handles the 0°/360° wrap), reaches target in ~35ms at 60fps.
4. Deadzone: if `distance(cursor, faceAnchor) < 0.12 * min(viewportWidth, viewportHeight)`, draw `center.webp` regardless of angle (direct eye contact when the cursor is near the face).
5. Otherwise `frameIndex = Math.round(normalize(smoothedAngle) / 5.625) % 64`; `ctx.clearRect(...)`, then `ctx.drawImage(frames[frameIndex], ...coverTransform)` — exactly one `drawImage` call per tick, full opacity, no compositing operations that would blend two frames.
6. Canvas is sized to `window.innerWidth/Height * devicePixelRatio`, CSS-sized to 100vw/100vh; redraw-on-resize recomputes the cover transform and face anchor.

## 8. UI & layout

- **Background**: `body`/canvas background both set to `#64bce2` so the canvas edges (before cover-crop fills them, and during resize/orientation changes) never flash a mismatched color.
- **Header**: floating frosted-glass pill, centered top, `WORK` / `ABOUT` / `CONTACT`, `backdrop-filter: blur(20px)`, translucent white fill, thin white border.
- **Hero type block** (bottom-left): "Hi, I'm" in a clean spaced modern sans; "Sakshi Haste" in a cursive script (Google Fonts *Dancing Script*) with a soft drop-shadow; a 3-line UI/UX & Product Design bio (max-width ~340px, positioned so it doesn't crowd the character); two pill CTAs — `Resume` (solid white, arrow icon, opens `public/resume.pdf` in a new tab) and `Let's Talk` (frosted-glass/white-border outline, `mailto:sakshihaste1008@gmail.com`).
- **Magnetic cursor**: real cursor hidden (`cursor: none`) on non-touch pointers only; a glowing white dot tracks the raw pointer almost immediately, a larger trailing aura ring lerps behind it more slowly, both scale up on hover over nav links/buttons (detected via a shared hover-target state, not per-element listeners duplicating the rAF loop).

## 9. Responsive & accessibility

- Canvas always full-bleed via the cover-fit transform at any viewport size; face anchor recomputed on resize so tracking stays accurate.
- Below ~640px width: type block and nav pill restack/resize; magnetic cursor and custom `cursor:none` are disabled entirely on touch/coarse-pointer devices (native tap targets stay standard-sized).
- `prefers-reduced-motion`: canvas freezes on `center.webp` (no per-frame angle tracking), cursor-follow easing is skipped (dot/ring simply match pointer position with no trailing lag animation). No content is ever hidden by this — only motion is reduced.
- Semantic landmarks (`<nav>`, `<main>`, `<section>` stubs with ids), visible focus states on the pill buttons/nav links, alt text on the canvas via an `aria-label`/offscreen text describing the portrait, sufficient contrast for white text on the sky-blue background.

## 10. Build sequencing

1. Vite scaffold, base styles/fonts, `#64bce2` background, `frameAssets.ts` preloader.
2. `CharacterCanvas` with the cover-fit transform + static center-frame draw (no tracking yet) — verify crisp full-bleed rendering at several viewport sizes.
3. Pointer tracking + `angle.ts` (`lerpAngle`, deadzone, frame index) wired into the rAF loop — verify smooth zero-ghosting tracking.
4. `Nav`, `HeroContent` (type, bio, CTA pills), fonts.
5. `MagneticCursor`.
6. Responsive pass + `prefers-reduced-motion` + `resume.pdf` placeholder + cross-check at common breakpoints.

## 11. Explicitly out of scope

Any other page section beyond stubbed anchors, routing, CMS/content wiring beyond the placeholder bio copy, any 3D/perspective effects, any in-browser video playback of `character.mp4`.
