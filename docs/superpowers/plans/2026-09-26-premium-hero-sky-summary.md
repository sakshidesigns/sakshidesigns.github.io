# Premium Hero: Cutout Character, Sky & Clouds, Glass Summary Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the working cursor-tracking hero into a premium scene: a sharp, transparent-background character over a vibrant sky-blue gradient with slow, subtle cotton-candy clouds behind her (top half only), plus four small glass summary cards and a lighter left text column.

**Architecture:** A build-time Python pipeline (`scripts/cutout.py`, driven by `scripts/extract_frames.py`) fits a smooth per-frame background model, derives an alpha matte, decontaminates edge colour, upscales to 1920x1080 and writes RGBA WebP frames over `public/frames/`. The runtime canvas keeps its cover-fit and tracking maths and only becomes transparent. New React components (`SkyClouds`, `SummaryCards`) add the layered sky and glass cards; `HeroContent` and `index.css` are restyled.

**Tech Stack:** Python 3 + OpenCV 5 + NumPy (build script, `unittest`); Vite + React 19 + TypeScript + Vitest + Testing Library (app); Playwright MCP for screenshots.

**Spec:** `docs/superpowers/specs/2026-09-26-premium-hero-sky-summary-design.md` (builds on `2026-09-25-cursor-tracking-hero-design.md`).

**Working directory:** all paths are relative to the worktree `C:\Users\saksh\OneDrive\Desktop\portfolio\.claude\worktrees\cursor-tracking-hero`. The dev server (`npm run dev`) serves `http://localhost:5173/` from there. Never `git add -A` / `git add .`: the worktree has unrelated uncommitted changes (`.gitignore`, the earlier spec edit, a staged deletion of `public/character.png`). Stage only the files each task names.

## Global Constraints

- No CSS 3D transforms (`perspective`, `rotateX`, `rotateY`) anywhere; the canvas element never moves or transforms, only which bitmap is drawn.
- The MP4 (`source-assets/character.mp4`) is never played or seeked in the browser; it is only read by the Python build script.
- Exactly one full-opacity frame is drawn per tick with no cross-frame blending.
- Frames are 1920x1080 RGBA WebP (`public/frames/frame_00.webp` to `frame_63.webp` plus `center.webp`); target about 8-9 MB total, hard ceiling 12 MB.
- Sky gradient: about `#3d9bf5` at the top to `#9fd8ff` at the horizon. Ink/navy text colour: `#0f1f4d`.
- Clouds: 2-3 layers, opacity 0.5 or lower, top ~50% of the hero only, drift 120-200 s, animate `transform` only.
- Summary cards: four cards, tilt +/-4-6 degrees, 7-9 s ease-in-out bob of about 6 px, staggered, kept clear of the face. Card copy (user-confirmed): "Currently focused on / AI-powered experiences", "Based in / Pune, India", "Experience / 3+ Years / AI products, SaaS and digital platforms", "What I do / Simplify complex workflows".
- Mobile breakpoint is `max-width: 640px` (existing); cards become a 2x2 grid there.
- `prefers-reduced-motion`: clouds do not drift, cards do not bob, character holds `center.webp` (existing behaviour).
- Text contrast at least 4.5:1; keyboard focus rings stay visible.
- Verification viewports: 1440x900, 1024x768, 390x844 (plus 320x568 for overflow).
- Do not add runtime dependencies.

## Review Focus

Inputs and conditions the spec implies but the obvious tests would miss, most likely first:

1. **Blue fringe on hair wisps.** Semi-transparent hair edges must not carry background blue when composited over navy, white or pink. Pinned in Task 1 (`test_decontaminate_removes_background_blue`) and Task 3 (`verify_frames.py` writes contact sheets over three backgrounds for the human check).
2. **Watermark region and table strip.** The bottom-right sparkle area must be fully transparent while the white table strip below it stays opaque. Pinned in Task 3 (`verify_frames.py` asserts alpha at both points on every frame).
3. **Background is a gradient, not flat.** The source vignette (about 12-21 units from `#64bce2`) must not leak into the alpha. Pinned in Task 1 (`test_alpha_ignores_smooth_background_gradient`).
4. **Very narrow viewport (320px) horizontal overflow** from the 1600px cloud tiles and absolutely positioned cards. Pinned in Task 8 (Playwright `scrollWidth` check).
5. **Reduced motion.** Cloud drift and card bobbing must stop. Pinned in Task 8 (`index.css` reduced-motion test) alongside the existing canvas behaviour.
6. **Cards colliding with the face, name block or each other** at desktop sizes. Pinned in Task 8 (Playwright collision check at three desktop sizes).

---

### Task 1: Matting library `scripts/cutout.py`

**Files:**
- Create: `scripts/cutout.py`
- Test: `scripts/test_cutout.py`
- Modify: `docs/superpowers/specs/2026-09-26-premium-hero-sky-summary-design.md` (one-sentence correction in section 2, step 2)

**Interfaces:**
- Produces (used by Task 2):
  - `fit_background(frame_bgr: np.ndarray, iterations: int = 3, tolerance: float = 14.0) -> np.ndarray` returns a float64 `(h, w, 3)` BGR background model.
  - `compute_alpha(frame_bgr, background, lo: float = 12.0, hi: float = 40.0) -> np.ndarray` returns float64 `(h, w)` in `[0, 1]`.
  - `decontaminate(frame_bgr, background, alpha) -> np.ndarray` returns float64 `(h, w, 3)` foreground colour.
  - `cutout_frame(frame_bgr, lo=12.0, hi=40.0, clear_rects=()) -> np.ndarray` returns uint8 BGRA `(h, w, 4)`. `clear_rects` is a sequence of `(x0, y0, x1, y1)` zeroed in alpha.
  - `upscale_bgra(bgra, size: tuple[int, int], sharpen: float = 0.35) -> np.ndarray` returns uint8 BGRA at `size = (width, height)`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/test_cutout.py`:

```python
import unittest

import cv2
import numpy as np

from cutout import (
    compute_alpha,
    cutout_frame,
    decontaminate,
    fit_background,
    upscale_bgra,
)

H, W = 200, 240
HAIR_BGR = np.array([20.0, 35.0, 50.0])  # dark brown, BGR


def make_background():
    """Smooth vignette like the real studio backdrop: lighter centre,
    darker corners, all clearly blue (B well above R)."""
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    r = np.hypot((xs - W / 2) / (W / 2), (ys - H / 2) / (H / 2))
    base = np.array([233.0, 199.0, 118.0])  # BGR of a light sky blue
    falloff = np.array([10.0, 12.0, 20.0])
    return base[None, None, :] - r[..., None] * falloff[None, None, :]


def make_frame():
    """Background with an antialiased dark disc in the middle."""
    bg = make_background()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dist = np.hypot(xs - W / 2, ys - H / 2)
    coverage = np.clip((60.0 - dist) / 3.0 + 0.5, 0.0, 1.0)  # 3px soft edge
    frame = coverage[..., None] * HAIR_BGR + (1 - coverage[..., None]) * bg
    return frame.round().astype(np.uint8), coverage


class CutoutTests(unittest.TestCase):
    def test_fit_background_recovers_gradient_around_subject(self):
        frame, _ = make_frame()
        model = fit_background(frame)
        truth = make_background()
        # Compare only where the frame is background (outside the disc).
        ys, xs = np.mgrid[0:H, 0:W]
        outside = np.hypot(xs - W / 2, ys - H / 2) > 70
        error = np.abs(model - truth).max(axis=2)[outside]
        self.assertLess(error.mean(), 3.0)

    def test_alpha_ignores_smooth_background_gradient(self):
        frame, _ = make_frame()
        alpha = compute_alpha(frame, fit_background(frame))
        self.assertLess(alpha[5, 5], 0.01)
        self.assertLess(alpha[5, W - 6], 0.01)
        self.assertLess(alpha[H - 6, 5], 0.01)
        self.assertGreater(alpha[H // 2, W // 2], 0.99)

    def test_decontaminate_removes_background_blue(self):
        frame, coverage = make_frame()
        model = fit_background(frame)
        alpha = compute_alpha(frame, model)
        fg = decontaminate(frame, model, alpha)
        edge = (alpha > 0.2) & (alpha < 0.8)
        self.assertGreater(edge.sum(), 50)
        # Hair is brown (B < R). Blended edge pixels start bluish; after
        # decontamination B - R must not be strongly positive.
        blue_excess = fg[..., 0] - fg[..., 2]
        raw_excess = frame[..., 0].astype(np.float64) - frame[..., 2]
        self.assertGreater(raw_excess[edge].max(), 30.0)
        self.assertLess(blue_excess[edge].max(), 10.0)

    def test_cutout_frame_returns_bgra_and_honours_clear_rects(self):
        frame, _ = make_frame()
        out = cutout_frame(frame, clear_rects=[(100, 80, 140, 120)])
        self.assertEqual(out.shape, (H, W, 4))
        self.assertEqual(out.dtype, np.uint8)
        self.assertEqual(int(out[100, 120, 3]), 0)  # inside cleared rect
        self.assertEqual(int(out[5, 5, 3]), 0)  # background corner
        self.assertGreater(int(out[H // 2, 70, 3]), 250)  # inside the disc (radius 60 around x=120), left of the rect

    def test_upscale_bgra_changes_size_and_keeps_transparency(self):
        frame, _ = make_frame()
        out = cutout_frame(frame)
        big = upscale_bgra(out, (W * 3 // 2, H * 3 // 2))
        self.assertEqual(big.shape, (H * 3 // 2, W * 3 // 2, 4))
        self.assertEqual(big.dtype, np.uint8)
        self.assertEqual(int(big[3, 3, 3]), 0)
        self.assertGreater(int(big[H * 3 // 4, W * 3 // 4, 3]), 250)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m unittest discover -s scripts -p "test_cutout.py" -v`
Expected: FAIL / ERROR with `ModuleNotFoundError: No module named 'cutout'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/cutout.py`:

```python
"""
Matting helpers for turning the studio-blue video frames into transparent
character cutouts.

The backdrop in character.mp4 is *nearly* flat but not exactly: it is a soft
vignette (about #60bbe1 in the corners, #76c7e9 in the middle, darker toward
the table). Keying a single colour would leave a halo, so every frame gets its
own smooth background model (a quadratic surface fitted to the bluish pixels),
alpha comes from distance to that model, and edge colour is decontaminated so
semi-transparent hair pixels carry hair colour, not backdrop blue.

All frames are BGR uint8 (OpenCV order).
"""

import cv2
import numpy as np


def _design_matrix(height: int, width: int) -> np.ndarray:
    ys, xs = np.mgrid[0:height, 0:width].astype(np.float64)
    x = xs / max(width - 1, 1) * 2 - 1
    y = ys / max(height - 1, 1) * 2 - 1
    return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], axis=-1)


def fit_background(frame_bgr: np.ndarray, iterations: int = 3, tolerance: float = 14.0) -> np.ndarray:
    """Fit a per-channel quadratic surface to the pixels that are clearly
    backdrop. Bootstraps on 'bluish' pixels (blue well above red), then
    re-selects pixels that agree with the current fit, so the subject never
    drags the model. Fitted at 1/4 resolution for speed, evaluated at full."""
    height, width = frame_bgr.shape[:2]
    scale = 4
    small = cv2.resize(
        frame_bgr, (max(width // scale, 2), max(height // scale, 2)), interpolation=cv2.INTER_AREA
    ).astype(np.float64)
    small_h, small_w = small.shape[:2]
    design = _design_matrix(small_h, small_w).reshape(-1, 6)
    pixels = small.reshape(-1, 3)

    mask = (pixels[:, 0] - pixels[:, 2]) > 60.0  # B - R
    coeffs = None
    for _ in range(iterations):
        coeffs, *_ = np.linalg.lstsq(design[mask], pixels[mask], rcond=None)
        residual = np.linalg.norm(design @ coeffs - pixels, axis=1)
        mask = residual < tolerance

    full = _design_matrix(height, width).reshape(-1, 6) @ coeffs
    return full.reshape(height, width, 3)


def compute_alpha(frame_bgr: np.ndarray, background: np.ndarray, lo: float = 12.0, hi: float = 40.0) -> np.ndarray:
    """Alpha from colour distance to the fitted background: 0 at or below
    `lo`, 1 at or above `hi`, smoothstep between."""
    distance = np.linalg.norm(frame_bgr.astype(np.float64) - background, axis=2)
    t = np.clip((distance - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def decontaminate(frame_bgr: np.ndarray, background: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Estimate foreground colour under partial alpha.

    Where alpha is high, un-mix the backdrop: F = (P - (1 - a) * B) / a.
    Where alpha is low that division amplifies noise, so it fades to a
    colour bled outward from nearby solid pixels instead. Fully opaque pixels
    keep their original colour."""
    frame = frame_bgr.astype(np.float64)
    a = alpha[..., None]

    unmixed = np.clip((frame - (1.0 - a) * background) / np.maximum(a, 1e-3), 0.0, 255.0)

    solid = (alpha > 0.9).astype(np.float64)
    bled_num = cv2.GaussianBlur(frame * solid[..., None], (0, 0), 6)
    bled_den = cv2.GaussianBlur(solid, (0, 0), 6)[..., None]
    bled = np.where(bled_den > 0.02, bled_num / np.maximum(bled_den, 1e-3), frame)

    weight = np.clip((a - 0.15) / 0.45, 0.0, 1.0)
    fg = weight * unmixed + (1.0 - weight) * bled
    return np.where(a >= 0.98, frame, fg)


def cutout_frame(frame_bgr: np.ndarray, lo: float = 12.0, hi: float = 40.0, clear_rects=()) -> np.ndarray:
    """Full matte: returns uint8 BGRA. Each (x0, y0, x1, y1) in clear_rects
    is forced fully transparent (used to remove the generator watermark)."""
    background = fit_background(frame_bgr)
    alpha = compute_alpha(frame_bgr, background, lo, hi)
    for x0, y0, x1, y1 in clear_rects:
        alpha[y0:y1, x0:x1] = 0.0
    fg = decontaminate(frame_bgr, background, alpha)
    bgra = np.dstack([fg, alpha * 255.0])
    return np.clip(bgra.round(), 0, 255).astype(np.uint8)


def upscale_bgra(bgra: np.ndarray, size: tuple, sharpen: float = 0.35) -> np.ndarray:
    """Lanczos upscale colour and alpha separately, then a light unsharp mask
    on colour only. `size` is (width, height)."""
    color = cv2.resize(bgra[..., :3], size, interpolation=cv2.INTER_LANCZOS4).astype(np.float64)
    alpha = cv2.resize(bgra[..., 3], size, interpolation=cv2.INTER_LANCZOS4)
    blurred = cv2.GaussianBlur(color, (0, 0), 1.2)
    color = np.clip(color * (1.0 + sharpen) - blurred * sharpen, 0, 255)
    return np.dstack([color.round().astype(np.uint8), alpha])
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m unittest discover -s scripts -p "test_cutout.py" -v`
Expected: 5 tests, all PASS. If `test_fit_background_recovers_gradient_around_subject` or the alpha test fails, print `error.mean()` / the alpha corner values and adjust `tolerance`/`lo` only if the synthetic frame is genuinely within the documented ranges; do not weaken the assertions.

- [ ] **Step 5: Correct the spec's flat-background claim**

In `docs/superpowers/specs/2026-09-26-premium-hero-sky-summary-design.md`, section 2, replace step 2:

`2. Key the flat `#64bce2` background to a soft alpha matte (distance in a chroma-weighted space, feathered), then despill blue from semi-transparent hair edges.`

with:

`2. Build the matte from a per-frame smooth background model (the backdrop is a soft vignette, about 12-21 units away from `#64bce2` depending on position, not perfectly flat), take alpha from distance to that model, and decontaminate edge colour so semi-transparent hair edges carry hair colour, not blue.`

- [ ] **Step 6: Commit**

```bash
git add scripts/cutout.py scripts/test_cutout.py docs/superpowers/specs/2026-09-26-premium-hero-sky-summary-design.md
git commit -m "Add matting library: fitted-background alpha, decontamination, upscale

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- scripts/cutout.py scripts/test_cutout.py docs/superpowers/specs/2026-09-26-premium-hero-sky-summary-design.md
```

---

### Task 2: Wire the pipeline into `extract_frames.py` and gate on a preview

**Files:**
- Modify: `scripts/extract_frames.py` (imports/constants at top; replace `main()` and the `__main__` guard)

**Interfaces:**
- Consumes: `cutout_frame`, `upscale_bgra` from `scripts/cutout.py` (Task 1).
- Produces: `process(frame_bgr) -> np.ndarray` (uint8 BGRA 1920x1080), `composite(bgra, color_bgr) -> np.ndarray` (uint8 BGR), CLI flag `--preview`. Frames written to `public/frames/frame_XX.webp` and `center.webp` as RGBA WebP.

- [ ] **Step 1: Update imports and constants**

In `scripts/extract_frames.py`, replace:

```python
import cv2
import os

VIDEO_PATH = os.path.join(os.path.dirname(__file__), "..", "source-assets", "character.mp4")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "frames")
TOTAL_SOURCE_FRAMES = 240
NUM_OUTPUT_FRAMES = 64
CENTER_SOURCE_FRAME = 219
WEBP_QUALITY = 92
```

with:

```python
import argparse
import os

import cv2
import numpy as np

from cutout import cutout_frame, upscale_bgra

VIDEO_PATH = os.path.join(os.path.dirname(__file__), "..", "source-assets", "character.mp4")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "frames")
# Preview images live under node_modules/.cache so they are git-ignored.
PREVIEW_DIR = os.path.join(os.path.dirname(__file__), "..", "node_modules", ".cache", "hero-preview")
TOTAL_SOURCE_FRAMES = 240
NUM_OUTPUT_FRAMES = 64
CENTER_SOURCE_FRAME = 219
WEBP_QUALITY = 90
OUTPUT_SIZE = (1920, 1080)  # (width, height)
# Region (x0, y0, x1, y1) in source pixels covering the bottom-right generator
# sparkle. It sits over bare backdrop: right of the sleeve (x > ~1085) and
# above the white table strip (which starts at y ~ 692).
WATERMARK_RECT = (1110, 540, 1280, 690)
```

- [ ] **Step 2: Replace `main()` and the entry point**

Replace everything from `def main():` to the end of the file with:

```python
def read_source_frames():
    cap = cv2.VideoCapture(VIDEO_PATH)
    frames = []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frames.append(frame)
    cap.release()

    assert len(frames) == TOTAL_SOURCE_FRAMES, (
        f"expected {TOTAL_SOURCE_FRAMES} frames, got {len(frames)} -- "
        "anchor frame numbers above were derived for the original clip and "
        "must be re-derived if the source video changed"
    )
    return frames


def process(frame_bgr: np.ndarray) -> np.ndarray:
    """Source frame -> transparent, watermark-free, upscaled BGRA."""
    matte = cutout_frame(frame_bgr, clear_rects=[WATERMARK_RECT])
    return upscale_bgra(matte, OUTPUT_SIZE)


def composite(bgra: np.ndarray, color_bgr) -> np.ndarray:
    """Flatten BGRA over a solid colour (for eyeballing halos)."""
    a = bgra[..., 3:4].astype(np.float32) / 255.0
    backdrop = np.full(bgra.shape[:2] + (3,), color_bgr, np.float32)
    return (bgra[..., :3].astype(np.float32) * a + backdrop * (1.0 - a)).round().astype(np.uint8)


def write_frame(path: str, bgra: np.ndarray) -> None:
    ok = cv2.imwrite(path, bgra, [cv2.IMWRITE_WEBP_QUALITY, WEBP_QUALITY])
    assert ok, f"failed to write {path}"


def run_preview(frames) -> None:
    """Process only the center frame; write halo composites and a
    before/after face crop to PREVIEW_DIR for human sign-off."""
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    source = frames[CENTER_SOURCE_FRAME]
    result = process(source)

    for name, color_bgr in (("navy", (77, 31, 15)), ("white", (255, 255, 255)), ("pink", (230, 200, 255))):
        cv2.imwrite(os.path.join(PREVIEW_DIR, f"center-on-{name}.png"), composite(result, color_bgr))

    sky_bgr = (248, 184, 108)  # BGR of the new sky, about #6cb8f8
    before = cv2.resize(source, OUTPUT_SIZE, interpolation=cv2.INTER_LINEAR)  # what the browser does today
    after = composite(result, sky_bgr)
    face = (slice(200, 620), slice(700, 1180))  # (rows, cols) around the face at 1920x1080
    cv2.imwrite(os.path.join(PREVIEW_DIR, "before-after-face.png"), np.hstack([before[face], after[face]]))
    write_frame(os.path.join(PREVIEW_DIR, "center-test.webp"), result)
    size_kb = os.path.getsize(os.path.join(PREVIEW_DIR, "center-test.webp")) / 1024
    print(f"Preview written to {PREVIEW_DIR} (center-test.webp = {size_kb:.0f} KB)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true", help="process only the center frame into node_modules/.cache/hero-preview")
    args = parser.parse_args()

    frames = read_source_frames()
    if args.preview:
        run_preview(frames)
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    written = []
    for i in range(NUM_OUTPUT_FRAMES):
        theta = i * (360.0 / NUM_OUTPUT_FRAMES)
        src_idx = frame_for_angle(theta)
        write_frame(os.path.join(OUT_DIR, f"frame_{i:02d}.webp"), process(frames[src_idx]))
        written.append((i, theta, src_idx))

    write_frame(os.path.join(OUT_DIR, "center.webp"), process(frames[CENTER_SOURCE_FRAME]))

    print(f"Wrote {len(written)} rotation frames + center.webp to {OUT_DIR}")
    for i, theta, src_idx in written:
        print(f"  frame_{i:02d}.webp  theta={theta:6.2f}  source_frame={src_idx}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Run the existing Python tests**

Run: `python -m unittest discover -s scripts -p "test_*.py" -v`
Expected: 5 tests PASS (importing `extract_frames` is not required by any test; this just confirms nothing regressed).

- [ ] **Step 4: Run the preview**

Run: `python scripts/extract_frames.py --preview`
Expected: prints `Preview written to ...hero-preview (center-test.webp = NNN KB)`. `NNN` should be roughly 100-250; if above 300, note it (Task 3 checks the total budget).

- [ ] **Step 5: Inspect the preview and get user sign-off (STOP GATE)**

Open with the Read tool: `node_modules/.cache/hero-preview/center-on-navy.png`, `center-on-white.png`, `center-on-pink.png`, and `before-after-face.png`. Check and report:
- No blue halo or light fringe around hair on any of the three backgrounds; hair wisps are still present, not chopped off.
- The sparkle watermark is gone; the white table strip is intact along the bottom.
- The right edge of the sleeve (about x = 1085 in source) is not clipped by the watermark rectangle.
- Before/after: the "after" half is at least as sharp as "before".

If there is a halo or speckle: adjust `lo`/`hi` defaults in `cutout_frame` (raise `lo` to remove speckle; raise `hi`/lower it to move the edge) or `tolerance` in `fit_background`, re-run the unit tests, re-run `--preview`, and re-inspect. Show the user `before-after-face.png` and `center-on-navy.png`, and **wait for their approval of quality** before Task 3. If they want more sharpness than Lanczos plus unsharp, the optional upgrade is Real-ESRGAN (NCNN build, no PyTorch): download `realesrgan-ncnn-vulkan-20220424-windows.zip` from the Real-ESRGAN v0.2.5.0 GitHub release, run `realesrgan-ncnn-vulkan.exe -i <in.png> -o <out.png> -n realesrgan-x4plus -s 4` on the matted colour, then downscale to 1920x1080; only pursue it if the user asks after seeing the preview.

- [ ] **Step 6: Commit**

```bash
git add scripts/extract_frames.py
git commit -m "Extract transparent upscaled frames with a --preview mode

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- scripts/extract_frames.py
```

---

### Task 3: Generate all frames and verify them

**Files:**
- Create: `scripts/verify_frames.py`
- Modify (regenerated binaries): `public/frames/frame_00.webp` to `frame_63.webp`, `public/frames/center.webp`

**Interfaces:**
- Consumes: `python scripts/extract_frames.py` (Task 2).
- Produces: `python scripts/verify_frames.py` exits 0 when all checks pass, prints total size in MB, and writes contact sheets to `node_modules/.cache/hero-preview/`.

- [ ] **Step 1: Write the verification script**

Create `scripts/verify_frames.py`:

```python
"""
Sanity-checks the generated RGBA frames and writes contact sheets over
three backgrounds for a human halo check. Exit code 0 = all assertions hold.
"""

import os
import sys

import cv2
import numpy as np

FRAMES_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "frames")
PREVIEW_DIR = os.path.join(os.path.dirname(__file__), "..", "node_modules", ".cache", "hero-preview")
SIZE_WARN_MB = 9.0
SIZE_FAIL_MB = 12.0
EXPECTED_SHAPE = (1080, 1920, 4)

# Points in 1920x1080 output pixels.
BACKDROP_POINTS = [(300, 5), (1914, 300), (5, 300), (960, 5)]   # (x, y): must be transparent
WATERMARK_POINT = (1740, 900)                                     # source (1160, 600) x 1.5
TABLE_POINT = (1800, 1057)                                        # source (1200, 705) x 1.5
FACE_POINT = (941, 410)                                           # source face anchor (0.49, 0.38)


def composite(bgra, color_bgr):
    a = bgra[..., 3:4].astype(np.float32) / 255.0
    backdrop = np.full(bgra.shape[:2] + (3,), color_bgr, np.float32)
    return (bgra[..., :3].astype(np.float32) * a + backdrop * (1 - a)).round().astype(np.uint8)


def main() -> int:
    names = [f"frame_{i:02d}.webp" for i in range(64)] + ["center.webp"]
    failures = []
    total_bytes = 0
    loaded = {}

    for name in names:
        path = os.path.join(FRAMES_DIR, name)
        total_bytes += os.path.getsize(path)
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if img is None or img.shape != EXPECTED_SHAPE:
            failures.append(f"{name}: expected shape {EXPECTED_SHAPE}, got {None if img is None else img.shape}")
            continue
        loaded[name] = img
        alpha = img[..., 3]
        for x, y in BACKDROP_POINTS:
            if alpha[y, x] > 4:
                failures.append(f"{name}: backdrop point ({x},{y}) alpha {alpha[y, x]} > 4")
        if alpha[WATERMARK_POINT[1], WATERMARK_POINT[0]] != 0:
            failures.append(f"{name}: watermark point not transparent (alpha {alpha[WATERMARK_POINT[1], WATERMARK_POINT[0]]})")
        if alpha[TABLE_POINT[1], TABLE_POINT[0]] < 250:
            failures.append(f"{name}: table strip not opaque (alpha {alpha[TABLE_POINT[1], TABLE_POINT[0]]})")
        if alpha[FACE_POINT[1], FACE_POINT[0]] < 250:
            failures.append(f"{name}: face point not opaque (alpha {alpha[FACE_POINT[1], FACE_POINT[0]]})")

    total_mb = total_bytes / (1024 * 1024)
    print(f"Total frame size: {total_mb:.1f} MB across {len(names)} files")
    if total_mb > SIZE_FAIL_MB:
        failures.append(f"total size {total_mb:.1f} MB exceeds hard ceiling {SIZE_FAIL_MB} MB")
    elif total_mb > SIZE_WARN_MB:
        print(f"WARNING: above the {SIZE_WARN_MB} MB target; consider lowering WEBP_QUALITY")

    os.makedirs(PREVIEW_DIR, exist_ok=True)
    picks = [n for n in ("frame_00.webp", "frame_08.webp", "frame_16.webp", "frame_24.webp", "frame_32.webp", "frame_40.webp", "frame_48.webp", "frame_56.webp") if n in loaded]
    for label, color in (("navy", (77, 31, 15)), ("white", (255, 255, 255)), ("pink", (230, 200, 255))):
        tiles = [cv2.resize(composite(loaded[n], color), (480, 270), interpolation=cv2.INTER_AREA) for n in picks]
        if len(tiles) == 8:
            sheet = np.vstack([np.hstack(tiles[:4]), np.hstack(tiles[4:])])
            cv2.imwrite(os.path.join(PREVIEW_DIR, f"sheet-{label}.png"), sheet)

    if failures:
        print(f"{len(failures)} FAILURES:")
        for line in failures[:40]:
            print("  " + line)
        return 1
    print("All frame checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run verification against the OLD frames to confirm it fails**

Run: `python scripts/verify_frames.py`
Expected: exit code 1 with many failures (`expected shape (1080, 1920, 4)`), because the current frames are 1280x720 without alpha.

- [ ] **Step 3: Generate all frames**

Run: `python scripts/extract_frames.py`
Expected: prints `Wrote 64 rotation frames + center.webp to ...public/frames` and the per-frame table. Takes a minute or two.

- [ ] **Step 4: Run verification to confirm it passes**

Run: `python scripts/verify_frames.py`
Expected: `Total frame size: ~X MB across 65 files`, then `All frame checks passed.` and exit code 0. If a rotated pose fails the face or watermark check (head or sleeve entering the cleared rectangle in some frame), narrow `WATERMARK_RECT` in `scripts/extract_frames.py` (keep it over the sparkle at source (1130..1195, 570..632)), regenerate, and re-verify. If the size exceeds 12 MB, lower `WEBP_QUALITY` in steps of 5 and regenerate.

- [ ] **Step 5: Inspect the contact sheets**

Open with the Read tool: `node_modules/.cache/hero-preview/sheet-navy.png`, `sheet-white.png`, `sheet-pink.png`. Confirm across the eight poses: no blue halo, no stray blue islands, hair wisps intact, sweater and table edges clean. Note any issue and fix via Task 2's tuning knobs, then regenerate and re-verify.

- [ ] **Step 6: Commit**

```bash
git add scripts/verify_frames.py scripts/extract_frames.py public/frames
git commit -m "Regenerate all frames as transparent 1920x1080 WebP with verification script

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- scripts/verify_frames.py scripts/extract_frames.py public/frames
```

---

### Task 4: Transparent canvas and sky gradient

**Files:**
- Modify: `src/components/CharacterCanvas.tsx:38-43` (`resize`) and `:110-117` (canvas style)
- Modify: `src/index.css:1-17` (`:root` tokens and root background), `:200-206` (`.hero`)

**Interfaces:**
- Consumes: transparent 1920x1080 frames (Task 3). `FrameSet`, `loadFrameSet`, and the tracking maths are unchanged.
- Produces: CSS custom properties `--sky-top: #3d9bf5`, `--sky-mid: #6cb8f8`, `--sky-bottom: #9fd8ff`, `--ink: #0f1f4d` on `:root`; `.hero` paints the sky gradient. Later tasks use `--ink`.

- [ ] **Step 1: Make the canvas transparent and high-quality**

In `src/components/CharacterCanvas.tsx`, replace the `resize` function:

```tsx
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
```

with (assigning `canvas.width` resets context state, so smoothing must be set here):

```tsx
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = "high";
    }
```

and delete the `background: "#64bce2",` line from the canvas `style` object so it reads:

```tsx
      style={{
        position: "fixed",
        inset: 0,
        display: "block",
        width: "100vw",
        height: "100vh",
      }}
```

- [ ] **Step 2: Add sky tokens and gradient**

In `src/index.css`, replace the `:root` block and the `html, body, #root` block:

```css
:root {
  --bg: #64bce2;
  --text: #ffffff;
}
```

with:

```css
:root {
  --sky-top: #3d9bf5;
  --sky-mid: #6cb8f8;
  --sky-bottom: #9fd8ff;
  --ink: #0f1f4d;
  --bg: var(--sky-mid);
  --text: var(--ink);
}
```

(leave the `html, body, #root { ... background: var(--bg); }` rule as is), and replace the `.hero` rule at the end of the file:

```css
.hero {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
```

with:

```css
.hero {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 48%, var(--sky-bottom) 100%);
}
```

Note: `--text` becoming navy makes the still-unrestyled white-on-scrim hero text dark on a dark scrim until Task 7; that is expected for these intermediate commits.

- [ ] **Step 3: Run the existing tests and type-check**

Run: `npm test` then `npx tsc -b`
Expected: all existing tests PASS; no TypeScript errors.

- [ ] **Step 4: Verify in the browser**

The dev server should be running (`npm run dev -- --port 5173 --strictPort` from the worktree if not). With Playwright: `browser_resize` to 1440x900, `browser_navigate` to `http://localhost:5173/`, `browser_take_screenshot` (save outside the repo, e.g. the session scratchpad). Read the image. Expected: the character has no rectangular blue backdrop; she sits on a vertical blue gradient from vivid at the top to pale at the bottom; no sparkle watermark; the head still tracks (use `browser_hover` at a few positions, or `browser_evaluate` dispatching `pointermove`, then re-screenshot). Zoom check: the character edges are clean against the sky.

- [ ] **Step 5: Commit**

```bash
git add src/components/CharacterCanvas.tsx src/index.css
git commit -m "Make character canvas transparent over a sky-blue gradient

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/components/CharacterCanvas.tsx src/index.css
```

---

### Task 5: `SkyClouds` component

**Files:**
- Create: `src/components/SkyClouds.tsx`
- Test: `src/components/SkyClouds.test.tsx`
- Modify: `src/components/Hero.tsx` (mount it before the canvas)
- Modify: `src/index.css` (append cloud styles)

**Interfaces:**
- Consumes: `.hero` sky gradient (Task 4).
- Produces: `export function SkyClouds(): JSX.Element` rendering `<div class="sky-clouds" aria-hidden="true">` with three `.sky-cloud-layer` children, each holding three tiled `<svg>` copies. CSS classes `.sky-clouds`, `.sky-cloud-layer`, keyframes `cloud-drift`.

- [ ] **Step 1: Write the failing test**

Create `src/components/SkyClouds.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkyClouds } from "./SkyClouds";

describe("SkyClouds", () => {
  it("is decorative: hidden from assistive tech", () => {
    const { container } = render(<SkyClouds />);
    const root = container.querySelector(".sky-clouds");
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("aria-hidden", "true");
  });

  it("renders three drifting layers, each tiled three times for a seamless loop", () => {
    const { container } = render(<SkyClouds />);
    const layers = container.querySelectorAll(".sky-cloud-layer");
    expect(layers).toHaveLength(3);
    layers.forEach((layer) => {
      expect(layer.querySelectorAll("svg")).toHaveLength(3);
    });
  });

  it("keeps every layer at or below 0.5 opacity with a 120-200s drift", () => {
    const { container } = render(<SkyClouds />);
    container.querySelectorAll<HTMLElement>(".sky-cloud-layer").forEach((layer) => {
      expect(Number(layer.style.opacity)).toBeLessThanOrEqual(0.5);
      const seconds = parseFloat(layer.style.animationDuration);
      expect(seconds).toBeGreaterThanOrEqual(120);
      expect(seconds).toBeLessThanOrEqual(200);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/SkyClouds.test.tsx`
Expected: FAIL, `Failed to resolve import "./SkyClouds"`.

- [ ] **Step 3: Write the component**

Create `src/components/SkyClouds.tsx`:

```tsx
// src/components/SkyClouds.tsx
// Procedural cotton-candy clouds. Each layer is a filtered rect (fractal noise
// -> soft alpha -> pastel tint -> blur) tiled three times so a horizontal
// drift of exactly one tile width loops seamlessly. Only `transform` animates,
// so the filtered art is rasterised once and composited on its own layer.

const TILE_WIDTH = 1600;
const TILE_HEIGHT = 640;

type CloudLayer = {
  id: string;
  seed: number;
  frequency: string;
  tint: [number, number, number]; // 0-1 RGB; faint pink / lilac / white
  opacity: number;
  duration: number; // seconds for one full tile of drift
  top: string;
};

const LAYERS: CloudLayer[] = [
  { id: "cloud-a", seed: 3, frequency: "0.0032 0.0075", tint: [0.99, 0.93, 0.97], opacity: 0.5, duration: 190, top: "0%" },
  { id: "cloud-b", seed: 11, frequency: "0.0042 0.0095", tint: [0.94, 0.94, 1.0], opacity: 0.4, duration: 150, top: "9%" },
  { id: "cloud-c", seed: 27, frequency: "0.006 0.012", tint: [1.0, 0.97, 0.99], opacity: 0.32, duration: 120, top: "18%" },
];

export function SkyClouds() {
  return (
    <div className="sky-clouds" aria-hidden="true">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {LAYERS.map((layer) => (
            <filter
              key={layer.id}
              id={layer.id}
              filterUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={TILE_WIDTH}
              height={TILE_HEIGHT}
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={layer.frequency}
                numOctaves={5}
                seed={layer.seed}
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values={`0 0 0 0 ${layer.tint[0]}  0 0 0 0 ${layer.tint[1]}  0 0 0 0 ${layer.tint[2]}  8 0 0 0 -4.6`}
              />
              <feGaussianBlur stdDeviation="6" />
            </filter>
          ))}
        </defs>
      </svg>
      {LAYERS.map((layer) => (
        <div
          key={layer.id}
          className="sky-cloud-layer"
          style={{ top: layer.top, opacity: layer.opacity, animationDuration: `${layer.duration}s` }}
        >
          {[0, 1, 2].map((copy) => (
            <svg key={copy} width={TILE_WIDTH} height={TILE_HEIGHT} viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`}>
              <rect width={TILE_WIDTH} height={TILE_HEIGHT} fill="#ffffff" filter={`url(#${layer.id})`} />
            </svg>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/SkyClouds.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 5: Add styles and mount the component**

Append to `src/index.css`:

```css
/* --- Sky clouds --- */
.sky-clouds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 58vh;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  /* Confine the clouds to a soft pool behind the character's head: top
     half only, fading out toward the edges and downward. */
  -webkit-mask-image: radial-gradient(ellipse 70% 100% at 50% 0%, #000 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 70% 100% at 50% 0%, #000 35%, transparent 100%);
}

.sky-cloud-layer {
  position: absolute;
  left: 0;
  display: flex;
  width: max-content;
  will-change: transform;
  animation: cloud-drift linear infinite;
}

.sky-cloud-layer svg {
  display: block;
  flex: none;
}

@keyframes cloud-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-1600px);
  }
}
```

In `src/components/Hero.tsx`, import and mount it as the first child (before `CharacterCanvas`, so DOM order puts clouds behind the canvas):

```tsx
import { SkyClouds } from "./SkyClouds";
```

```tsx
    <section className="hero" aria-label="Introduction">
      <SkyClouds />
      <CharacterCanvas />
```

- [ ] **Step 6: Verify in the browser and tune**

Screenshot at 1440x900 (Playwright, saved outside the repo). Expected: soft, wispy, slightly pink-white clouds in the upper half only, faint (never bright white blobs), behind the character, fading out before the shoulders. Take a second screenshot about 20 seconds later and confirm the clouds moved slightly to the left. Tuning knobs if needed, all in `SkyClouds.tsx` / `index.css`: too many/too heavy clouds, change the alpha row `8 0 0 0 -4.6` to a more negative offset (e.g. `-5.0`); too sparse, less negative (e.g. `-4.3`); too blurry/fluffy vs too sharp, `stdDeviation` 4-9; wrong region, the mask ellipse and `height: 58vh`. If, after tuning, the procedural clouds still do not read as realistic, stop and tell the user before building an image-based fallback.

- [ ] **Step 7: Run everything and commit**

Run: `npm test` then `npx tsc -b`
Expected: PASS, no type errors.

```bash
git add src/components/SkyClouds.tsx src/components/SkyClouds.test.tsx src/components/Hero.tsx src/index.css
git commit -m "Add procedural cotton-candy SkyClouds layer behind the character

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/components/SkyClouds.tsx src/components/SkyClouds.test.tsx src/components/Hero.tsx src/index.css
```

---

### Task 6: `SummaryCards` component

**Files:**
- Create: `src/components/SummaryCards.tsx`
- Test: `src/components/SummaryCards.test.tsx`
- Modify: `src/components/Hero.tsx` (mount it)
- Modify: `src/index.css` (append card styles)

**Interfaces:**
- Consumes: `--ink` token (Task 4).
- Produces: `export function SummaryCards(): JSX.Element` rendering `<ul class="summary-cards" aria-label="Summary">` with four `<li class="summary-card summary-card-{focus|location|experience|craft}">`. Positioning classes `.summary-card-focus`, `.summary-card-location`, `.summary-card-experience`, `.summary-card-craft` (tuned in Task 8).

- [ ] **Step 1: Write the failing test**

Create `src/components/SummaryCards.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCards } from "./SummaryCards";

describe("SummaryCards", () => {
  it("renders the summary as a labelled list of four cards", () => {
    render(<SummaryCards />);
    const list = screen.getByRole("list", { name: "Summary" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("shows the confirmed summary copy", () => {
    render(<SummaryCards />);
    expect(screen.getByText("Currently focused on")).toBeInTheDocument();
    expect(screen.getByText("AI-powered experiences")).toBeInTheDocument();
    expect(screen.getByText("Based in")).toBeInTheDocument();
    expect(screen.getByText("Pune, India")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("3+ Years")).toBeInTheDocument();
    expect(screen.getByText("AI products, SaaS and digital platforms")).toBeInTheDocument();
    expect(screen.getByText("What I do")).toBeInTheDocument();
    expect(screen.getByText("Simplify complex workflows")).toBeInTheDocument();
  });

  it("hides decorative icons from assistive tech", () => {
    const { container } = render(<SummaryCards />);
    const icons = container.querySelectorAll(".summary-card-icon");
    expect(icons).toHaveLength(4);
    icons.forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/SummaryCards.test.tsx`
Expected: FAIL, `Failed to resolve import "./SummaryCards"`.

- [ ] **Step 3: Write the component**

Create `src/components/SummaryCards.tsx`:

```tsx
// src/components/SummaryCards.tsx
import type { ReactElement } from "react";

type Card = {
  id: "focus" | "location" | "experience" | "craft";
  label: string;
  value: string;
  detail?: string;
  icon: ReactElement;
};

const iconProps = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const CARDS: Card[] = [
  {
    id: "focus",
    label: "Currently focused on",
    value: "AI-powered experiences",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2 19h20" />
      </svg>
    ),
  },
  {
    id: "location",
    label: "Based in",
    value: "Pune, India",
    icon: (
      <svg {...iconProps}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    ),
  },
  {
    id: "experience",
    label: "Experience",
    value: "3+ Years",
    detail: "AI products, SaaS and digital platforms",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
      </svg>
    ),
  },
  {
    id: "craft",
    label: "What I do",
    value: "Simplify complex workflows",
    icon: (
      <svg {...iconProps}>
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
      </svg>
    ),
  },
];

export function SummaryCards() {
  return (
    <ul className="summary-cards" aria-label="Summary">
      {CARDS.map((card) => (
        <li key={card.id} className={`summary-card summary-card-${card.id}`}>
          <span className="summary-card-icon" aria-hidden="true">
            {card.icon}
          </span>
          <div className="summary-card-text">
            <p className="summary-card-label">{card.label}</p>
            <p className="summary-card-value">{card.value}</p>
            {card.detail ? <p className="summary-card-detail">{card.detail}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/SummaryCards.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 5: Add styles**

Append to `src/index.css`:

```css
/* --- Summary cards --- */
.summary-cards {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  pointer-events: none;
  z-index: 15;
}

.summary-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  width: clamp(190px, 17vw, 250px);
  padding: 14px 18px;
  border-radius: 20px;
  color: var(--ink);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 18px 40px rgba(20, 60, 140, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  transform: rotate(var(--tilt, 0deg));
  animation: card-float var(--float-duration, 8s) ease-in-out infinite;
  animation-delay: var(--float-delay, 0s);
}

.summary-card-icon {
  flex: none;
  display: grid;
  place-items: center;
}

.summary-card-text p {
  margin: 0;
}

.summary-card-label {
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  opacity: 0.72;
}

.summary-card-value {
  margin-top: 2px;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
}

.summary-card-detail {
  margin-top: 3px;
  font-size: 0.7rem;
  line-height: 1.3;
  opacity: 0.72;
}

/* Initial placements (tuned against the face and text column in Task 8). */
.summary-card-focus {
  left: 19%;
  top: 12%;
  --tilt: -5deg;
  --float-duration: 8s;
  --float-delay: 0s;
}
.summary-card-location {
  right: 12%;
  top: 17%;
  --tilt: 4deg;
  --float-duration: 9s;
  --float-delay: -2s;
}
.summary-card-experience {
  left: 24%;
  bottom: 17%;
  --tilt: -4deg;
  --float-duration: 7.5s;
  --float-delay: -4s;
}
.summary-card-craft {
  right: 8%;
  bottom: 22%;
  --tilt: 5deg;
  --float-duration: 8.5s;
  --float-delay: -1s;
}

@keyframes card-float {
  0%,
  100% {
    transform: rotate(var(--tilt, 0deg)) translateY(0);
  }
  50% {
    transform: rotate(var(--tilt, 0deg)) translateY(-6px);
  }
}
```

- [ ] **Step 6: Mount in `Hero`, run everything, commit**

In `src/components/Hero.tsx` add `import { SummaryCards } from "./SummaryCards";` and mount `<SummaryCards />` after `<Nav />` and before `<HeroContent />`.

Run: `npm test` then `npx tsc -b`
Expected: PASS, no type errors. (Visual check happens with the restyled layout in Task 8.)

```bash
git add src/components/SummaryCards.tsx src/components/SummaryCards.test.tsx src/components/Hero.tsx src/index.css
git commit -m "Add glass SummaryCards with tilted floating layout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/components/SummaryCards.tsx src/components/SummaryCards.test.tsx src/components/Hero.tsx src/index.css
```

---

### Task 7: Restyle the left column, nav, buttons and cursor

**Files:**
- Modify: `index.html:8-11` (fonts)
- Modify: `src/components/HeroContent.tsx`
- Modify: `src/components/HeroContent.test.tsx`
- Modify: `src/index.css` (hero-content, nav, pill, focus, cursor rules)

**Interfaces:**
- Consumes: `--ink` (Task 4).
- Produces: `HeroContent` markup with classes `.hero-greeting`, `.hero-name`, `.hero-role`, `.hero-bio`, `.hero-actions` (name string stays exactly `Sakshi Haste` in one `<h1>`).

- [ ] **Step 1: Update the tests first**

In `src/components/HeroContent.test.tsx`, add a test inside the `describe` block (leave the three existing tests untouched):

```tsx
  it("shows the greeting, role tagline and a one-sentence bio", () => {
    render(<HeroContent />);
    expect(screen.getByText("Hi, I'm")).toBeInTheDocument();
    expect(screen.getByText("UI/UX & Product Designer")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Designing clear, thoughtful digital experiences across product, UX and visual design."
      )
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run to verify the new test fails**

Run: `npx vitest run src/components/HeroContent.test.tsx`
Expected: the new test FAILS (role tagline text not found); the other three PASS.

- [ ] **Step 3: Update the component**

Replace `src/components/HeroContent.tsx` with:

```tsx
// src/components/HeroContent.tsx
export function HeroContent() {
  return (
    <div className="hero-content">
      <p className="hero-greeting">Hi, I&apos;m</p>
      <h1 className="hero-name">Sakshi Haste</h1>
      <p className="hero-role">UI/UX &amp; Product Designer</p>
      <p className="hero-bio">
        Designing clear, thoughtful digital experiences across product, UX and visual design.
      </p>
      <div className="hero-actions">
        <a className="pill pill-solid" href="/resume.pdf" target="_blank" rel="noreferrer" data-cursor-hover>
          Resume <span aria-hidden="true">→</span>
        </a>
        <a className="pill pill-outline" href="mailto:sakshihaste1008@gmail.com" data-cursor-hover>
          Let&apos;s Talk
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify all four tests pass**

Run: `npx vitest run src/components/HeroContent.test.tsx`
Expected: 4 tests PASS.

- [ ] **Step 5: Load the serif font**

In `index.html`, change the Google Fonts `href` to:

```
https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap
```

- [ ] **Step 6: Restyle in `src/index.css`**

Replace the whole `/* --- Hero content --- */` block (`.hero-content`, `.hero-greeting`, `.hero-name`, `.hero-bio`, `.hero-actions`) with:

```css
/* --- Hero content --- */
.hero-content {
  position: fixed;
  left: 5vw;
  top: 24vh;
  z-index: 20;
  max-width: 340px;
}

.hero-greeting {
  margin: 0;
  font-family: "Dancing Script", cursive;
  font-weight: 600;
  font-size: 1.7rem;
  color: var(--ink);
}

.hero-name {
  margin: 0 0 14px;
  width: min-content; /* one word per line, like the reference */
  font-family: "Playfair Display", Georgia, serif;
  font-weight: 700;
  font-size: clamp(3.2rem, 7vw, 6.2rem);
  line-height: 0.95;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.hero-role {
  margin: 0 0 14px;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink);
}

.hero-bio {
  margin: 0 0 26px;
  max-width: 300px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(15, 31, 77, 0.8);
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
```

Replace the `.site-nav` and `.site-nav a` rules with:

```css
.site-nav {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 28px;
  padding: 14px 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 24px rgba(20, 60, 140, 0.12);
  z-index: 20;
}

.site-nav a {
  color: var(--ink);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Replace the `.pill:focus-visible, .site-nav a:focus-visible` rule, `.pill-solid` and `.pill-outline`:

```css
.pill:focus-visible,
.site-nav a:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.75);
  border-radius: 999px;
}

.pill-solid {
  background: var(--ink);
  color: #ffffff;
}

.pill-outline {
  background: rgba(255, 255, 255, 0.28);
  color: var(--ink);
  border: 1px solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

Replace the `.magnetic-cursor-dot` and `.magnetic-cursor-ring` colour rules so they read over light sky:

```css
.magnetic-cursor-dot {
  width: 8px;
  height: 8px;
  background: var(--ink);
  box-shadow: 0 0 12px 4px rgba(255, 255, 255, 0.7);
}

.magnetic-cursor-ring {
  width: 36px;
  height: 36px;
  border: 1.5px solid rgba(15, 31, 77, 0.55);
}
```

Delete the old `@media (max-width: 640px)` block's `.hero-content` and `.hero-name` overrides (they referenced the scrim); the mobile layout is rewritten in Task 8. Keep the `.site-nav` overrides inside it.

- [ ] **Step 7: Run tests and commit**

Run: `npm test` then `npx tsc -b`
Expected: PASS, no type errors.

```bash
git add index.html src/components/HeroContent.tsx src/components/HeroContent.test.tsx src/index.css
git commit -m "Restyle hero text column, nav, buttons and cursor for the sky scene

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- index.html src/components/HeroContent.tsx src/components/HeroContent.test.tsx src/index.css
```

---

### Task 8: Layout tuning, mobile, reduced motion, final verification

**Files:**
- Modify: `src/components/Hero.tsx` (add mist element)
- Modify: `src/index.css` (mist, mobile layout, reduced-motion, final card positions)
- Test: `src/index.css.test.ts` (reduced-motion rule is present)

**Interfaces:**
- Consumes: everything above.
- Produces: `.hero-mist` element; a `@media (max-width: 640px)` layout; a `@media (prefers-reduced-motion: reduce)` rule disabling `.sky-cloud-layer` and `.summary-card` animation.

- [ ] **Step 1: Write the failing reduced-motion test**

Create `src/index.css.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "index.css"), "utf8");

function reducedMotionBlock(): string {
  const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("\n}\n", start));
}

describe("index.css reduced motion", () => {
  it("stops cloud drift and card bobbing", () => {
    const block = reducedMotionBlock();
    expect(block).toContain(".sky-cloud-layer");
    expect(block).toContain(".summary-card");
    expect(block).toMatch(/animation:\s*none/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/index.css.test.ts`
Expected: FAIL (`expected -1 to be greater than or equal to 0`).

- [ ] **Step 3: Add mist, mobile layout and reduced motion**

In `src/components/Hero.tsx`, add the mist between the canvas and the nav:

```tsx
      <CharacterCanvas />
      <div className="hero-mist" aria-hidden="true" />
      <Nav />
```

Append to `src/index.css`:

```css
/* --- Bottom mist: melts the white table strip into the scene --- */
.hero-mist {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 12vh;
  pointer-events: none;
  z-index: 5;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.28) 45%, rgba(255, 255, 255, 0));
}

/* --- Mobile layout: name block on top, cards as a 2x2 grid at the bottom --- */
@media (max-width: 640px) {
  .hero-content {
    top: 76px;
    left: 6vw;
    right: 6vw;
    max-width: none;
  }
  .hero-name {
    font-size: clamp(2.8rem, 15vw, 3.8rem);
  }
  .hero-bio {
    display: none;
  }
  .hero-actions {
    position: fixed;
    left: 6vw;
    right: 6vw;
    bottom: calc(4vh + 168px);
  }
  .summary-cards {
    inset: auto 6vw 4vh 6vw;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .summary-card {
    position: static;
    width: auto;
    padding: 10px 12px;
    gap: 8px;
    --tilt: 0deg;
  }
  .summary-card-detail {
    display: none;
  }
  .summary-card-icon svg {
    width: 20px;
    height: 20px;
  }
}

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  .sky-cloud-layer,
  .summary-card {
    animation: none;
  }
}
```

- [ ] **Step 4: Run to verify the test passes**

Run: `npx vitest run src/index.css.test.ts`
Expected: PASS.

- [ ] **Step 5: Desktop collision check (Playwright)**

For each of 1440x900, 1280x720 and 1920x1080: `browser_resize`, `browser_navigate` to `http://localhost:5173/`, wait 1 s, then `browser_evaluate` this function and expect `[]`:

```js
() => {
  const vw = innerWidth, vh = innerHeight;
  const s = Math.max(vw / 1280, vh / 720);
  const ox = (vw - 1280 * s) / 2, oy = (vh - 720 * s) / 2;
  const fx = ox + 0.49 * 1280 * s, fy = oy + 0.38 * 720 * s;
  const face = { left: fx - 170 * s, right: fx + 170 * s, top: fy - 190 * s, bottom: fy + 150 * s };
  const box = (el) => { const r = el.getBoundingClientRect(); return { name: el.className.split(" ").pop() || el.tagName, left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
  const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const cards = [...document.querySelectorAll(".summary-card")].map(box);
  const others = [
    { ...face, name: "face" },
    box(document.querySelector(".hero-content")),
    box(document.querySelector(".site-nav")),
  ];
  const problems = [];
  cards.forEach((c, i) => {
    others.forEach((o) => hit(c, o) && problems.push(`${c.name} overlaps ${o.name}`));
    cards.slice(i + 1).forEach((d) => hit(c, d) && problems.push(`${c.name} overlaps ${d.name}`));
    if (c.left < 0 || c.right > vw || c.top < 0 || c.bottom > vh) problems.push(`${c.name} outside viewport`);
  });
  return problems;
}
```

If it reports overlaps, adjust the `left`/`right`/`top`/`bottom` percentages of `.summary-card-focus|location|experience|craft` in `src/index.css` (move cards outward or toward the shoulders) and re-run all three sizes until each returns `[]`.

- [ ] **Step 6: Screenshot review at all target sizes**

Screenshot and Read the image at 1440x900, 1024x768 and 390x844 (save outside the repo). Check against the spec: character sharp and unboxed on the sky; clouds subtle, top half, behind her, light; four glass cards tilted, legible, not covering her face; navy serif name with tagline, one-line bio and two buttons on the left with no dark panel; bottom mist blends the table; at 390x844 name block on top, buttons above a 2x2 grid of cards, nothing overlapping her face. Fix any spacing issue in `src/index.css`, re-screenshot. Also confirm the cursor dot is visible over both sky and clouds (`browser_hover`).

- [ ] **Step 7: Overflow check at 320px**

`browser_resize` to 320x568, reload, then `browser_evaluate`: `() => document.documentElement.scrollWidth <= innerWidth`. Expected: `true`. If `false`, find the offender (`[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth)`) and constrain it (`overflow: hidden` on `.sky-clouds` is already set; check `.hero-actions` and `.summary-cards`).

- [ ] **Step 8: Reduced-motion check**

`browser_evaluate`: `() => matchMedia('(prefers-reduced-motion: reduce)').matches`; then use `browser_emulate_media` with `reducedMotion: "reduce"`, reload, and `browser_evaluate` `() => getComputedStyle(document.querySelector('.summary-card')).animationName` expecting `none`, and the same for `.sky-cloud-layer`. Confirm the character holds the centre frame while the pointer moves.

- [ ] **Step 9: Full test, type-check, build**

Run: `npm test`, `npx tsc -b`, `npm run build`, and `python -m unittest discover -s scripts -p "test_*.py"` and `python scripts/verify_frames.py`.
Expected: all PASS; build succeeds; frames still verified.

- [ ] **Step 10: Commit**

```bash
git add src/components/Hero.tsx src/index.css src/index.css.test.ts
git commit -m "Tune hero layout: bottom mist, mobile grid, reduced motion, card placement

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>" -- src/components/Hero.tsx src/index.css src/index.css.test.ts
```

---

## Self-Review Notes

- **Spec coverage:** section 2 (pipeline) -> Tasks 1-3; section 3 (renderer) -> Task 4; section 4 (sky and clouds, incl. mist, fallback) -> Tasks 4, 5, 8; section 5 (layout, cards, nav/buttons, cursor, mobile) -> Tasks 6, 7, 8; section 6 (a11y, reduced motion) -> Tasks 5-8; section 7 (verification) -> Tasks 1, 3, 8; section 8 (build order) matches Task order; section 9 out-of-scope items are not planned.
- **Deviation from the spec found during planning:** the source backdrop is a soft vignette, not perfectly flat, so the pipeline fits a background model rather than keying one colour; Task 1 Step 5 corrects the spec sentence.
- **Type/name consistency:** `cutout_frame`/`upscale_bgra` signatures match between Tasks 1 and 2; `--ink`, `--sky-*` tokens defined in Task 4 are the only ones used later; card classes `summary-card-{focus,location,experience,craft}` in Task 6 CSS match the component ids; `.sky-cloud-layer`/`.summary-card` names match across Tasks 5, 6 and 8.
- **Known judgement calls executors may need to tune with screenshots:** cloud alpha matrix constants (Task 5 Step 6), card percentages (Task 8 Step 5), mist height, and matting `lo`/`hi` (Task 2 Step 5).
