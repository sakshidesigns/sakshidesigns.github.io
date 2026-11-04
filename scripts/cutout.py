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

# Minimum colour distance from the backdrop for an interior alpha gap to be filled.
INTERIOR_FILL_DISTANCE = 140.0


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


def _blueness(bgr: np.ndarray) -> np.ndarray:
    """B - R. The backdrop is strongly blue (about +115..+130); hair, skin,
    the navy sweater and the white table are all far below that. Unlike raw
    colour distance it is blind to brightness, so the lighter 'glow' the
    video generator leaves around the subject still reads as backdrop."""
    return bgr[..., 0].astype(np.float64) - bgr[..., 2].astype(np.float64)


def compute_alpha(frame_bgr: np.ndarray, background: np.ndarray, lo: float = 22.0, hi: float = 80.0) -> np.ndarray:
    """Alpha proportional to how much of each pixel is subject vs backdrop,
    measured on the blueness axis (B - R) rather than raw colour distance.

    Stage 1 (coarse): smoothstep of how far the pixel's blueness has dropped
    below the fitted backdrop's, 0 at or below `lo`, 1 at or above `hi`.
    Blueness drops with coverage, but a lighter-blue generator halo barely
    moves it, so the halo stays transparent.

    Stage 2 (refine): erode the coarse mask to a truly solid core, estimate
    the local subject blueness from that core, and interpolate linearly:
    alpha = (blue_bg - blue_pixel) / (blue_bg - blue_subject). That is
    coverage-proportional, which is what decontamination needs."""
    frame = frame_bgr.astype(np.float64)
    blue_bg = _blueness(background)
    blue_px = _blueness(frame)
    drop = blue_bg - blue_px

    t = np.clip((drop - lo) / (hi - lo), 0.0, 1.0)
    coarse = t * t * (3.0 - 2.0 * t)

    core = cv2.erode((coarse > 0.98).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    solid = core.astype(np.float64)
    support = cv2.GaussianBlur(solid, (0, 0), 6)
    blue_subject = cv2.GaussianBlur(blue_px * solid, (0, 0), 6) / np.maximum(support, 1e-6)

    contrast = blue_bg - blue_subject
    projected = np.clip(drop / np.maximum(contrast, 1.0), 0.0, 1.0)

    usable = (support > 0.02) & (contrast > 40.0)  # need a nearby solid subject clearly less blue than the backdrop

    # Isolated wisps have no solid neighbour to measure against. Rather than
    # trusting the coarse smoothstep (which over-reports coverage and leaves a
    # blue tint), project onto the subject's overall mean blueness.
    fallback = coarse
    if core.any():
        contrast_global = float(blue_bg[core > 0].mean() - blue_px[core > 0].mean())
        if contrast_global > 40.0:
            fallback = np.clip(drop / contrast_global, 0.0, 1.0)
    refined = np.where(usable, projected, fallback)
    alpha = np.where(coarse <= 0.0, 0.0, np.where(core > 0, 1.0, refined))

    # The local subject-blueness estimate can come from a different material
    # (e.g. skin next to a shadowed navy cuff), which reads a genuinely
    # opaque pixel as partly transparent. Close small interior gaps in alpha,
    # but only where the pixel is far from the backdrop colour, so backdrop
    # pockets between hair curls stay transparent.
    closed = cv2.morphologyEx(alpha.astype(np.float32), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    distance = np.linalg.norm(frame - background, axis=2)
    fill = (closed > alpha) & (distance > INTERIOR_FILL_DISTANCE)
    return np.where(fill, closed, alpha)


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
    # Colour bled outward from nearby solid pixels, at two reaches. Isolated
    # wisps can sit far from any solid pixel; they fall back to the wider
    # reach, and finally to the subject's mean colour, never to the raw
    # (backdrop-blue) frame.
    bled = None
    if solid.any():
        global_mean = (frame * solid[..., None]).sum(axis=(0, 1)) / solid.sum()
        bled = np.broadcast_to(global_mean, frame.shape).copy()
        for sigma in (24, 6):  # narrow reach last so it wins where it has support
            num = cv2.GaussianBlur(frame * solid[..., None], (0, 0), sigma)
            den = cv2.GaussianBlur(solid, (0, 0), sigma)[..., None]
            bled = np.where(den > 0.02, num / np.maximum(den, 1e-3), bled)
    else:
        bled = frame

    weight = np.clip((a - 0.15) / 0.45, 0.0, 1.0)
    fg = weight * unmixed + (1.0 - weight) * bled
    return np.where(a >= 0.98, frame, fg)


def extend_foreground(fg: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Replace every non-solid pixel's colour with the colour of the nearest
    solid subject pixel (alpha > 0.5). The backdrop colour under transparent
    areas is meaningless, but an upscaler looks at neighbouring pixels, so
    leaving it blue would bleed blue into hair edges. Solid pixels are
    returned unchanged."""
    solid = alpha > 0.5
    if not solid.any():
        return fg
    not_solid = (~solid).astype(np.uint8)  # zeros mark solid pixels
    _, labels = cv2.distanceTransformWithLabels(not_solid, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    colors = fg[solid]  # raster order matches the labels given to the zero pixels
    nearest = colors[np.clip(labels - 1, 0, len(colors) - 1)]
    return np.where(solid[..., None], fg, nearest)


def upscale_alpha(alpha_u8: np.ndarray, size: tuple) -> np.ndarray:
    """Smoothly upscale an 8-bit alpha matte. Cubic resize plus a light blur
    removes the stair-stepping a 1.5x resize of a 1-pixel-aliased edge has;
    values under 3/255 are snapped to 0 so transparent areas are exactly
    transparent (no faint resize ringing). `size` is (width, height)."""
    big = cv2.resize(alpha_u8, size, interpolation=cv2.INTER_CUBIC).astype(np.float32)
    big = cv2.GaussianBlur(big, (0, 0), 0.9)
    big[big < 3.0] = 0.0
    return np.clip(big.round(), 0, 255).astype(np.uint8)


def matte_frame(frame_bgr: np.ndarray, lo: float = 22.0, hi: float = 80.0, clear_rects=()):
    """Alpha matte plus decontaminated foreground colour, both float64:
    returns (fg, alpha) with fg (h, w, 3) BGR and alpha (h, w) in [0, 1].
    Each (x0, y0, x1, y1) in clear_rects is forced fully transparent (used to
    remove the generator watermark)."""
    background = fit_background(frame_bgr)
    alpha = compute_alpha(frame_bgr, background, lo, hi)
    for x0, y0, x1, y1 in clear_rects:
        alpha[y0:y1, x0:x1] = 0.0
    return decontaminate(frame_bgr, background, alpha), alpha


def cutout_frame(frame_bgr: np.ndarray, lo: float = 22.0, hi: float = 80.0, clear_rects=()) -> np.ndarray:
    """Full matte packed as uint8 BGRA."""
    fg, alpha = matte_frame(frame_bgr, lo, hi, clear_rects)
    bgra = np.dstack([fg, alpha * 255.0])
    return np.clip(bgra.round(), 0, 255).astype(np.uint8)


def upscale_bgra(bgra: np.ndarray, size: tuple, sharpen: float = 0.35) -> np.ndarray:
    """Lanczos upscale colour and alpha separately, then a light unsharp mask
    on colour only. `size` is (width, height)."""
    color = cv2.resize(bgra[..., :3], size, interpolation=cv2.INTER_LANCZOS4).astype(np.float64)
    alpha = upscale_alpha(bgra[..., 3], size)
    blurred = cv2.GaussianBlur(color, (0, 0), 1.2)
    color = np.clip(color * (1.0 + sharpen) - blurred * sharpen, 0, 255)
    return np.dstack([color.round().astype(np.uint8), alpha])
