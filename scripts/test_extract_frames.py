import unittest

import numpy as np

from extract_frames import compose_upscaled, fidelity_error


class ExtractFramesHelpers(unittest.TestCase):
    def test_compose_upscaled_returns_bgra_at_output_size_with_smooth_alpha(self):
        color_big = np.full((160, 240, 3), (30, 40, 50), np.uint8)  # 4x of a 40x60 source
        alpha = np.zeros((40, 60), np.uint8)
        alpha[10:30, 15:45] = 255
        out = compose_upscaled(color_big, alpha, (90, 60))
        self.assertEqual(out.shape, (60, 90, 4))
        self.assertEqual(out.dtype, np.uint8)
        self.assertEqual(int(out[2, 2, 3]), 0)
        self.assertEqual(int(out[30, 45, 3]), 255)
        self.assertEqual(out[30, 45, :3].tolist(), [30, 40, 50])

    def test_fidelity_error_is_zero_for_a_faithful_upscale_and_positive_for_a_drifted_one(self):
        reference = np.random.default_rng(1).integers(0, 255, (40, 60, 3), dtype=np.uint8)
        alpha = np.full((40, 60), 255, np.uint8)
        faithful = np.dstack([np.repeat(np.repeat(reference, 2, axis=0), 2, axis=1), np.full((80, 120), 255, np.uint8)])
        self.assertAlmostEqual(fidelity_error(faithful, reference, alpha), 0.0, places=3)
        drifted = faithful.copy()
        drifted[..., :3] = np.clip(drifted[..., :3].astype(int) + 20, 0, 255).astype(np.uint8)
        self.assertGreater(fidelity_error(drifted, reference, alpha), 10.0)

    def test_fidelity_error_ignores_transparent_pixels(self):
        reference = np.zeros((40, 60, 3), np.uint8)
        alpha = np.zeros((40, 60), np.uint8)
        alpha[:, :30] = 255
        result = np.zeros((80, 120, 4), np.uint8)
        result[:, 60:, :3] = 255  # wildly wrong, but only where alpha is 0
        self.assertAlmostEqual(fidelity_error(result, reference, alpha), 0.0, places=3)


if __name__ == "__main__":
    unittest.main()
