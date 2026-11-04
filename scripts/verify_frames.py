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
