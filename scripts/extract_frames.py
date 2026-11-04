"""
Pre-extracts 64 crisp WebP frames tracing the character's 360-degree head
rotation, plus a dedicated center/eye-contact frame, from
source-assets/character.mp4.

Why this exists: the source MP4 has a single keyframe (typical of generated
video), so seeking/playing it in-browser at runtime causes severe stutter and
uncontrolled playback. Instead we walk the real, already-recorded rotation
once here and bake out discrete frames the browser can blit instantly.

The video (240 frames @ 24fps) is one continuous, real animation: it starts
at a neutral center pose, sweeps clockwise through all 8 compass directions
in viewer/screen space, and settles back to a neutral center hold. That means
frame 0 and the tail of the video (~frame 219-239) are visually the same
"center" pose, so the whole clip is already a seamless 360-degree loop -- no
synthetic interpolation or frame morphing is needed. We only choose, for each
of 64 evenly spaced angles around the circle, which *real* recorded frame
lies at that proportional position between the two nearest hand-identified
compass anchors, and copy that exact frame out as a WebP.

Anchor frames are labeled in VIEWER/SCREEN space (not the character's own
left/right). Hand-identified by inspecting a labeled contact sheet of every
3rd frame -- see docs/superpowers/specs/2026-09-25-cursor-tracking-hero-design.md
for the full derivation -- they trace out the rotation in this time order:

    frame  18 -> UP          (270 deg)
    frame  39 -> UP-RIGHT    (315 deg)
    frame  60 -> RIGHT       (0 deg)
    frame  93 -> DOWN-RIGHT  (45 deg)
    frame 111 -> DOWN        (90 deg)
    frame 126 -> DOWN-LEFT   (135 deg)
    frame 165 -> LEFT        (180 deg)
    frame 189 -> UP-LEFT     (225 deg)
    frame 258 -> UP (wrap)   (270 deg)  [= frame 18 of the next loop,
                                            reached by wrapping through the
                                            real center hold at the tail
                                            of the clip and back to frame 0]

Angle convention matches atan2(dy, dx) in screen space (y grows downward):
0 deg = RIGHT, 90 deg = DOWN, 180 deg = LEFT, 270 deg = UP, increasing
clockwise. This lets the renderer map a cursor angle straight to a frame
index with no further conversion.
"""

import argparse
import os
import shutil
import subprocess

import cv2
import numpy as np

from cutout import cutout_frame, extend_foreground, matte_frame, upscale_alpha, upscale_bgra

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

# Optional AI upscaler: the standalone Real-ESRGAN (ncnn/Vulkan) build. The
# general-purpose x4plus model was chosen over the anime models because the
# anime ones redraw eyes and outlines (they change the character); x4plus
# keeps her look and only adds real detail. Point at the executable with
# --esrgan-exe or the REALESRGAN_EXE environment variable; without it the
# script falls back to a plain Lanczos upscale.
ESRGAN_MODEL = "realesrgan-x4plus"
ESRGAN_BATCH = 13  # frames per exe run; bounds temp disk use (each 4x PNG is ~12 MB)
# Mean absolute per-channel difference (0-255) allowed between an upscaled
# frame shrunk back to source size and the source. A faithful upscale sits
# well under this; a model that redraws features does not.
FIDELITY_LIMIT = 5.0

# (time-order index k, source frame index, screen-space angle in degrees)
# Sweep is clockwise in viewer space: UP → RIGHT → DOWN → LEFT → UP.
ANCHORS = [
    (0, 18, 270),   # UP
    (1, 39, 315),   # UP-RIGHT
    (2, 60, 0),     # RIGHT
    (3, 93, 45),    # DOWN-RIGHT
    (4, 111, 90),   # DOWN
    (5, 126, 135),  # DOWN-LEFT
    (6, 165, 180),  # LEFT
    (7, 189, 225),  # UP-LEFT
    (8, 258, 270),  # wrap: 258 % 240 == 18, closing the loop back to UP
]


def frame_for_angle(theta_deg: float) -> int:
    """Real source-video frame index at a given TRUE screen angle (0-360,
    clockwise, 0=RIGHT/90=DOWN/180=LEFT/270=UP -- matches atan2(dy,dx) in
    y-down screen space). Anchors advance clockwise from UP, so progress is
    degrees clockwise from 270 before locating the bracketing segment."""
    theta = theta_deg % 360
    progress = (theta - 270) % 360  # 0 at UP, increases clockwise
    k = min(int(progress // 45), len(ANCHORS) - 2)
    _, f0, _ = ANCHORS[k]
    _, f1, _ = ANCHORS[k + 1]
    fraction = (progress - k * 45) / 45.0
    frame = round(f0 + fraction * (f1 - f0))
    return frame % TOTAL_SOURCE_FRAMES


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


def compose_upscaled(color_big_bgr: np.ndarray, alpha_u8: np.ndarray, size) -> np.ndarray:
    """AI-upscaled colour (any larger size) + source-resolution alpha ->
    BGRA at `size` = (width, height). Colour is shrunk with area averaging;
    alpha gets the smooth alpha upscale."""
    color = cv2.resize(color_big_bgr, size, interpolation=cv2.INTER_AREA)
    return np.dstack([color, upscale_alpha(alpha_u8, size)])


def fidelity_error(result_bgra: np.ndarray, reference_bgr: np.ndarray, alpha_u8: np.ndarray) -> float:
    """Mean absolute per-channel difference (0-255) between the result shrunk
    back to the reference's size and the reference, over solid pixels only."""
    height, width = reference_bgr.shape[:2]
    shrunk = cv2.resize(result_bgra[..., :3], (width, height), interpolation=cv2.INTER_AREA).astype(np.float32)
    solid = alpha_u8 > 230
    return float(np.abs(shrunk - reference_bgr.astype(np.float32))[solid].mean())


def esrgan_upscale(exe: str, named_inputs: dict, work_dir: str) -> dict:
    """Run the Real-ESRGAN executable over uint8 BGR images; returns the 4x
    outputs by the same names. Temp files are removed afterwards."""
    in_dir = os.path.join(work_dir, "in")
    out_dir = os.path.join(work_dir, "out")
    shutil.rmtree(work_dir, ignore_errors=True)
    os.makedirs(in_dir)
    os.makedirs(out_dir)
    try:
        for name, image in named_inputs.items():
            cv2.imwrite(os.path.join(in_dir, name + ".png"), image)
        subprocess.run(
            [exe, "-i", in_dir, "-o", out_dir, "-n", ESRGAN_MODEL, "-s", "4", "-f", "png"],
            check=True,
            cwd=os.path.dirname(os.path.abspath(exe)),  # the exe finds ./models relative to here
            capture_output=True,
        )
        result = {}
        for name in named_inputs:
            image = cv2.imread(os.path.join(out_dir, name + ".png"))
            assert image is not None, f"Real-ESRGAN produced no output for {name}"
            result[name] = image
        return result
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def render(frames, jobs, out_dir: str, esrgan_exe=None) -> None:
    """Write RGBA WebP frames for `jobs` = [(name, source_frame_index)] into
    out_dir, upscaling with Real-ESRGAN when an executable is given, with
    Lanczos otherwise."""
    os.makedirs(out_dir, exist_ok=True)
    work_dir = os.path.join(PREVIEW_DIR, "esrgan-work")
    worst = 0.0
    step = ESRGAN_BATCH if esrgan_exe else len(jobs)
    for start in range(0, len(jobs), step):
        chunk = jobs[start : start + step]
        if esrgan_exe:
            mattes = {name: matte_frame(frames[index], clear_rects=[WATERMARK_RECT]) for name, index in chunk}
            # Fill the backdrop area with her own colours so no blue bleeds into hair edges.
            inputs = {
                name: np.clip(extend_foreground(fg, alpha), 0, 255).astype(np.uint8)
                for name, (fg, alpha) in mattes.items()
            }
            big = esrgan_upscale(esrgan_exe, inputs, work_dir)
            for name, (fg, alpha) in mattes.items():
                alpha_u8 = np.clip((alpha * 255.0).round(), 0, 255).astype(np.uint8)
                result = compose_upscaled(big[name], alpha_u8, OUTPUT_SIZE)
                worst = max(worst, fidelity_error(result, inputs[name], alpha_u8))
                write_frame(os.path.join(out_dir, name + ".webp"), result)
        else:
            for name, index in chunk:
                write_frame(os.path.join(out_dir, name + ".webp"), process(frames[index]))
        print(f"  rendered {min(start + step, len(jobs))}/{len(jobs)}", flush=True)
    if esrgan_exe:
        print(f"Worst fidelity error vs source: {worst:.2f}/255 (limit {FIDELITY_LIMIT})")
        assert worst < FIDELITY_LIMIT, "upscaler drifted from the source; refusing to keep these frames"


def run_preview(frames, esrgan_exe=None) -> None:
    """Render only the center frame into PREVIEW_DIR; write halo composites
    and a before/after face crop for human sign-off."""
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    render(frames, [("center", CENTER_SOURCE_FRAME)], PREVIEW_DIR, esrgan_exe)
    result = cv2.imread(os.path.join(PREVIEW_DIR, "center.webp"), cv2.IMREAD_UNCHANGED)

    for name, color_bgr in (("navy", (77, 31, 15)), ("white", (255, 255, 255)), ("pink", (230, 200, 255))):
        cv2.imwrite(os.path.join(PREVIEW_DIR, f"center-on-{name}.png"), composite(result, color_bgr))

    sky_bgr = (248, 184, 108)  # BGR of the new sky, about #6cb8f8
    before = cv2.resize(frames[CENTER_SOURCE_FRAME], OUTPUT_SIZE, interpolation=cv2.INTER_LINEAR)  # what the browser did originally
    after = composite(result, sky_bgr)
    face = (slice(200, 620), slice(700, 1180))  # (rows, cols) around the face at 1920x1080
    cv2.imwrite(os.path.join(PREVIEW_DIR, "before-after-face.png"), np.hstack([before[face], after[face]]))
    size_kb = os.path.getsize(os.path.join(PREVIEW_DIR, "center.webp")) / 1024
    print(f"Preview written to {PREVIEW_DIR} (center.webp = {size_kb:.0f} KB)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true", help="process only the center frame into node_modules/.cache/hero-preview")
    parser.add_argument(
        "--esrgan-exe",
        default=os.environ.get("REALESRGAN_EXE"),
        help="path to realesrgan-ncnn-vulkan(.exe); default: $REALESRGAN_EXE, else Lanczos",
    )
    args = parser.parse_args()

    frames = read_source_frames()
    if args.preview:
        run_preview(frames, args.esrgan_exe)
        return

    jobs = [(f"frame_{i:02d}", frame_for_angle(i * (360.0 / NUM_OUTPUT_FRAMES))) for i in range(NUM_OUTPUT_FRAMES)]
    jobs.append(("center", CENTER_SOURCE_FRAME))
    render(frames, jobs, OUT_DIR, args.esrgan_exe)
    print(f"Wrote {len(jobs)} frames to {OUT_DIR}")
    for name, index in jobs:
        print(f"  {name}.webp  source_frame={index}")


if __name__ == "__main__":
    main()
