import unittest

import cv2
import numpy as np

import os

from cutout import (
    compute_alpha,
    cutout_frame,
    decontaminate,
    extend_foreground,
    fit_background,
    upscale_alpha,
    upscale_bgra,
)

VIDEO_PATH = os.path.join(os.path.dirname(__file__), "..", "source-assets", "character.mp4")

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


def make_frame_with_glow():
    """Like make_frame, but a 6px band of *lighter* blue (a generator halo)
    hugs the disc. It is still backdrop and must not become subject."""
    frame, _ = make_frame()
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    dist = np.hypot(xs - W / 2, ys - H / 2)
    band = (dist > 63.0) & (dist < 69.0)
    frame = frame.copy()
    frame[band] = np.array([245, 215, 150], np.uint8)  # BGR, lighter cyan-blue
    return frame, dist


class CutoutTests(unittest.TestCase):
    def test_isolated_wisp_edge_carries_no_backdrop_blue(self):
        """A thin, semi-transparent wisp far from any solid hair has no solid
        neighbour to borrow colour from; it must still not keep backdrop blue."""
        frame, _ = make_frame()
        bg = make_background()
        wisp = np.zeros((H, W), bool)
        wisp[40:100, W - 17 : W - 14] = True  # 3px wide, ~50px from the disc
        blended = (0.45 * HAIR_BGR + 0.55 * bg).round().astype(np.uint8)
        frame = frame.copy()
        frame[wisp] = blended[wisp]
        model = fit_background(frame)
        alpha = compute_alpha(frame, model)
        fg = decontaminate(frame, model, alpha)
        edge = wisp & (alpha > 0.2)
        self.assertGreater(edge.sum(), 20)
        self.assertLess((fg[..., 0] - fg[..., 2])[edge].max(), 10.0)

    def test_extend_foreground_replaces_backdrop_colour_only_outside_the_subject(self):
        frame, _ = make_frame()
        model = fit_background(frame)
        alpha = compute_alpha(frame, model)
        fg = decontaminate(frame, model, alpha)
        extended = extend_foreground(fg, alpha)
        solid = alpha > 0.5
        self.assertTrue(np.allclose(extended[solid], fg[solid]))
        outside = alpha < 0.01
        self.assertLess((extended[..., 0] - extended[..., 2])[outside].max(), 10.0)  # no blue left

    def test_upscale_alpha_keeps_transparent_transparent_and_solid_solid(self):
        small = np.zeros((40, 60), np.uint8)
        small[10:30, 15:45] = 255
        big = upscale_alpha(small, (90, 60))
        self.assertEqual(big.shape, (60, 90))
        self.assertEqual(int(big[2, 2]), 0)
        self.assertEqual(int(big[30, 45]), 255)
        self.assertEqual(int(big[np.where(big > 0)[0].min() - 1, 45]), 0)  # no faint ringing outside the shape

    @unittest.skipUnless(os.path.exists(VIDEO_PATH), "source video not present")
    def test_lit_shoulder_tip_of_the_sweater_stays_opaque_on_real_frames(self):
        """Regression: a lit navy highlight near the shoulder tip is nearly as
        blue as the backdrop, so it came out ~50% transparent and showed as a
        faint teal patch over the sky. The defect left 110-300 of the 308
        pixels in this box below 0.9 alpha; the fix leaves 0-1."""
        cap = cv2.VideoCapture(VIDEO_PATH)
        try:
            for index in (219, 111, 165):
                cap.set(cv2.CAP_PROP_POS_FRAMES, index)
                ok, real = cap.read()
                self.assertTrue(ok)
                alpha = compute_alpha(real, fit_background(real))
                self.assertLessEqual(int((alpha[500:522, 934:948] < 0.9).sum()), 5, f"frame {index}")
        finally:
            cap.release()

    @unittest.skipUnless(os.path.exists(VIDEO_PATH), "source video not present")
    def test_sweater_cuff_patch_stays_opaque_on_real_frames(self):
        """Regression: navy shadows next to skin came out ~50% transparent
        (a grey blotch where the cuff meets the knuckles). The defect left
        160-230 of the 1800 pixels in this patch below 0.9 alpha; the fix
        leaves 0-1."""
        cap = cv2.VideoCapture(VIDEO_PATH)
        try:
            for index in (219, 60, 111, 165):
                cap.set(cv2.CAP_PROP_POS_FRAMES, index)
                ok, real = cap.read()
                self.assertTrue(ok)
                alpha = compute_alpha(real, fit_background(real))
                self.assertLessEqual(int((alpha[595:625, 740:800] < 0.9).sum()), 5, f"frame {index}")
        finally:
            cap.release()

    def test_lighter_backdrop_glow_next_to_subject_stays_transparent(self):
        frame, dist = make_frame_with_glow()
        alpha = compute_alpha(frame, fit_background(frame))
        band = (dist > 64.0) & (dist < 68.0)
        self.assertGreater(band.sum(), 100)
        self.assertLess(alpha[band].max(), 0.2)
        self.assertGreater(alpha[H // 2, W // 2], 0.99)  # subject still solid

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
