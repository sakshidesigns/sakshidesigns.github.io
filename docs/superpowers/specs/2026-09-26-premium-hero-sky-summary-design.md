# Premium Hero: Cutout Character, Sky & Clouds, Glass Summary Cards — Design

Builds on `2026-09-25-cursor-tracking-hero-design.md`. That spec's constraints still hold: no CSS 3D transforms, the MP4 is never played in the browser, exactly one full-opacity frame drawn per tick with no cross-frame blending.

## 1. Purpose

The hero works (head follows the cursor) but looks unpremium:

- The character is a 720p AI video upscaled to full-bleed, so it is soft; the source also has a Gemini-style sparkle watermark at bottom-right.
- The flat `#64bce2` background is baked into every frame, so she looks pasted onto the page and nothing can sit behind her.
- The dark scrim panel behind the bio covers her left shoulder and makes the left side heavy.

Goals:

1. Sharper, cleaner character that belongs to the scene.
2. Vibrant sky-blue background with subtle, realistic cotton-candy clouds drifting very slowly behind her, on the top half only, at low opacity.
3. A summary section on the landing page as small glass cards (reference: `public/summary hero section.png` in the main checkout), without crowding the hero.

## 2. Character pipeline (build-time only)

Extend `scripts/extract_frames.py` so it reads `source-assets/character.mp4` directly (no WebP-to-WebP re-encode) and, for each of the 64 rotation frames plus `center`:

1. Paint out the sparkle watermark (small region over flat blue, `cv2.inpaint`).
2. Build the matte from a per-frame smooth background model (the backdrop is a soft vignette, about 12-21 units away from `#64bce2` depending on position, not perfectly flat). Alpha is coverage-proportional (edge pixels are projected onto the backdrop-to-subject colour line, because raw colour distance saturates at low coverage against dark hair), and edge colour is decontaminated so semi-transparent hair edges carry hair colour, not blue.
3. Upscale to **1920x1080** (aspect unchanged). Try a local AI upscaler first (no paid credits); fall back to Lanczos plus light unsharp. Show the user a before/after on one frame before running all frames.
4. Write RGBA WebP over `public/frames/frame_XX.webp` and `center.webp`, alpha kept high quality.

Budget: about 8–9 MB total for 65 frames; measure after the run, drop quality or size if it is clearly over.

Verification: composite the output over navy, white and pink and inspect for halos and fringing; assert corner pixels have alpha 0 and face pixels alpha 255.

Frame-angle mapping and frame selection do not change.

## 3. Renderer

`CharacterCanvas` keeps `SOURCE_WIDTH/HEIGHT = 1280x720` logical dimensions and the existing cover transform and face-anchor math, so `drawImage` simply scales the 1920x1080 bitmaps down to logical size and the tracking is untouched. Changes:

- Remove the canvas `background: #64bce2` (it must be transparent).
- Set `imageSmoothingEnabled = true` and `imageSmoothingQuality = "high"`.

## 4. Sky and clouds

Layers, back to front:

1. **Sky gradient** on `.hero`: about `#3d9bf5` at the top to `#9fd8ff` at the horizon. Body/root background updated to match so resize never flashes a mismatched colour.
2. **Clouds** (`SkyClouds` component): 2–3 procedural layers (SVG `feTurbulence` shaped into soft cumulus, white with a faint pink/lilac underside for the cotton-candy tint), duplicated across 2x width for a seamless loop, drifting horizontally over 120–200 s. Only `transform` is animated so the filtered art is rasterised once. Masked with a vertical gradient to the top ~50% of the hero; opacity 0.5 or lower.
3. **Character canvas** (transparent).
4. **Bottom mist**: a soft white-to-transparent gradient so the white table strip melts into the scene.
5. Text, cards, nav, cursor.

Fallback: if procedural clouds do not look realistic in screenshots, replace them with generated cloud images under the same layering and animation.

## 5. Layout and summary cards

- **Left column** (`HeroContent`): "Hi, I'm", the name, the "UI/UX & Product Designer" tagline, a one-line bio, and the Resume and Let's Talk buttons. The dark scrim is removed. Name font changes from Dancing Script to a refined serif in navy (`#0f1f4d`-ish), as in the reference; text stays navy on the sky (about 5.5:1 or better).
- **Summary cards** (`SummaryCards` component, a `<ul>`): four frosted-glass cards (translucent white fill, `backdrop-filter: blur`, 1px white border, inner highlight, soft shadow), tilted ±4–6°, positioned around her head and shoulders and kept clear of the face. Each floats with a 7–9 s ease-in-out bob of about 6 px, staggered. Content confirmed by the user:
  - Currently focused on — AI-powered experiences
  - Based in — Pune, India
  - Experience — 3+ years (AI products, SaaS, digital platforms)
  - What I do — Simplify complex workflows
- **Nav pill and buttons**: navy text; Resume solid navy with white text; Let's Talk glass outline.
- **Magnetic cursor**: dot and ring recoloured navy so they stay visible over the light sky.
- **Mobile (<= 640px)**: the cards become a 2x2 grid under the name; nav and text restack as they do today.

## 6. Accessibility and reduced motion

- `prefers-reduced-motion`: clouds do not drift and cards do not bob (static positions); the character still holds `center.webp` as before.
- Cards are a semantic list; decorative tilt does not affect reading order.
- Focus rings stay visible on navy-on-sky.

## 7. Verification

- Python: alpha and halo checks from section 2 on the generated frames.
- Existing Vitest suite still passes; add a small test for `SummaryCards` rendering its four items.
- Playwright screenshots at 1440x900, 1024x768 and 390x844: character sharp, no halo, clouds subtle and top-half only, cards not covering the face, no horizontal overflow.

## 8. Build order

1. Pipeline change and before/after sign-off, then run all frames.
2. Transparent canvas and sky gradient.
3. Clouds.
4. Layout, type and summary cards.
5. Responsive, reduced-motion and cursor polish, then screenshot pass.

## 9. Out of scope

Scroll indicator, other page sections, card parallax or cursor interaction, changes to angle mapping or tracking math.
