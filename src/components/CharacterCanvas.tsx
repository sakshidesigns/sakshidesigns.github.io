import { useEffect, useRef } from "react";
import {
  bitmapPixelSize,
  computeStageTransform,
  mapSourcePointToContainer,
  offsetByRect,
  visibleSourceRect,
  type SourceRect,
} from "../lib/coverTransform";
import { disposeFrames, loadFrameBlobs, prepareFrames, type FrameBlobs, type PreparedFrames } from "../lib/frameAssets";
import { resolveFrame } from "../lib/frameBlend";
import { interactionState } from "../lib/interactionState";
import { subscribeTick } from "../lib/ticker";
import { computeTrackingStep } from "../lib/trackingStep";
import { useReducedMotion } from "../hooks/useReducedMotion";

const SOURCE_WIDTH = 1280;
const SOURCE_HEIGHT = 720;
const FACE_ANCHOR_NORM = { x: 0.49, y: 0.38 };
/** Share of the loader bar that stands for downloading; the rest is decoding. */
const DOWNLOAD_SHARE = 0.85;
const RESIZE_DEBOUNCE_MS = 250;
/** Re-decode the frames when the bitmap size they need drifts by more than this fraction. */
const REPREPARE_SIZE_TOLERANCE = 0.12;
/** ...or when the visible part of the frame moves by more than this many source units. */
const REPREPARE_RECT_TOLERANCE = 2;

interface CharacterCanvasProps {
  /** 0-1 loading progress (download + decode), for the page loader. */
  onProgress?: (fraction: number) => void;
  /** Called once when the frames are ready to draw (or loading failed, so the loader never sticks). */
  onReady?: () => void;
}

// Measured from the canvas element itself (not window.innerWidth, which includes
// the page scrollbar) so the maths always matches what is on screen.
function currentLayout(canvas: HTMLCanvasElement) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const transform = computeStageTransform(width, height, SOURCE_WIDTH, SOURCE_HEIGHT);
  const rect = visibleSourceRect(width, height, SOURCE_WIDTH, SOURCE_HEIGHT, transform);
  return { width, height, transform, rect };
}

function rectDiffers(a: SourceRect, b: SourceRect): boolean {
  return (["sx", "sy", "sw", "sh"] as const).some((key) => Math.abs(a[key] - b[key]) > REPREPARE_RECT_TOLERANCE);
}

export function CharacterCanvas({ onProgress, onReady }: CharacterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedAngleRef = useRef(0);
  const blobsRef = useRef<FrameBlobs | null>(null);
  const preparedRef = useRef<PreparedFrames | null>(null);
  const preparedWidthRef = useRef(0);
  const lastDrawnRef = useRef<{ image: ImageBitmap; key: string } | null>(null);
  const lastResolvedIndexRef = useRef<number | null>(null);
  const onProgressRef = useRef(onProgress);
  const onReadyRef = useRef(onReady);
  const visibleRef = useRef(true);
  onProgressRef.current = onProgress;
  onReadyRef.current = onReady;
  const reducedMotion = useReducedMotion();

  // Download every frame, then decode them all (cropped and resized for this
  // screen) before anything draws, so no frame is ever decoded mid-animation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const blobs = await loadFrameBlobs((loaded, total) => onProgressRef.current?.((DOWNLOAD_SHARE * loaded) / total));
        if (cancelled) return;
        blobsRef.current = blobs;
        const { transform, rect } = currentLayout(canvasRef.current!);
        const dpr = window.devicePixelRatio || 1;
        const prepared = await prepareFrames(blobs, rect, transform.scale, dpr);
        if (cancelled) {
          disposeFrames(prepared);
          return;
        }
        preparedRef.current = prepared;
        preparedWidthRef.current = bitmapPixelSize(rect, transform.scale, dpr).width;
        onProgressRef.current?.(1);
      } catch (error) {
        console.error("Failed to load character frames:", error);
      } finally {
        if (!cancelled) onReadyRef.current?.();
      }
    })();
    return () => {
      cancelled = true;
      if (preparedRef.current) disposeFrames(preparedRef.current);
      preparedRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let resizeTimer: number | undefined;
    let prepareToken = 0;
    let disposed = false;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); // resizing clears the canvas...
      lastDrawnRef.current = null; // ...so the next tick must redraw
    }

    // After a resize settles, re-decode the frames at the new size in the
    // background; the old set keeps drawing (slightly rescaled) meanwhile.
    async function reprepare() {
      const blobs = blobsRef.current;
      const current = preparedRef.current;
      if (!blobs || !current) return;
      const { transform, rect } = currentLayout(canvas!);
      const dpr = window.devicePixelRatio || 1;
      const neededWidth = bitmapPixelSize(rect, transform.scale, dpr).width;
      const sizeDrift = Math.abs(neededWidth - preparedWidthRef.current) / preparedWidthRef.current;
      if (sizeDrift < REPREPARE_SIZE_TOLERANCE && !rectDiffers(current.rect, rect)) return;

      const token = ++prepareToken;
      const next = await prepareFrames(blobs, rect, transform.scale, dpr);
      if (disposed || token !== prepareToken) {
        disposeFrames(next);
        return;
      }
      preparedRef.current = next;
      preparedWidthRef.current = neededWidth;
      lastDrawnRef.current = null;
      disposeFrames(current);
    }

    function onResize() {
      resize();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => void reprepare(), RESIZE_DEBOUNCE_MS);
    }
    resize();
    window.addEventListener("resize", onResize);
    // The canvas can change size without a window resize (e.g. the page
    // scrollbar appearing or disappearing), so watch the element itself too.
    const sizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => onResize());
    sizeObserver?.observe(canvas);

    // The hero scrolls away with the page: stop drawing while it is off-screen,
    // and redraw straight away when it comes back.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            visibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting) lastDrawnRef.current = null;
          });
    observer?.observe(canvas);

    const unsubscribe = subscribeTick(() => {
      const frames = preparedRef.current;
      if (!frames || !visibleRef.current) return;

      const { width, height, transform } = currentLayout(canvas!);
      // The face anchor is in canvas space but the pointer is in viewport
      // space; shift by the canvas's on-screen position so tracking stays
      // correct while the hero is partly scrolled.
      const faceAnchor = offsetByRect(
        mapSourcePointToContainer(FACE_ANCHOR_NORM.x, FACE_ANCHOR_NORM.y, SOURCE_WIDTH, SOURCE_HEIGHT, transform),
        canvas.getBoundingClientRect()
      );

      let image: ImageBitmap;
      // Hold eye contact both when motion is reduced and before any real
      // pointer position exists (initial paint, and permanently on
      // touch/coarse-pointer devices where pointermove never fires).
      // smoothedAngleRef is deliberately left untouched so tracking resumes
      // smoothly from wherever it was once a real pointer event arrives.
      if (reducedMotion || !interactionState.hasPointer) {
        image = frames.center;
        lastResolvedIndexRef.current = null;
      } else {
        const step = computeTrackingStep({
          cursorX: interactionState.x,
          cursorY: interactionState.y,
          faceX: faceAnchor.x,
          faceY: faceAnchor.y,
          currentSmoothedAngle: smoothedAngleRef.current,
          viewportWidth: width,
          viewportHeight: height,
        });
        smoothedAngleRef.current = step.smoothedAngle;
        if (step.isCenter) {
          image = frames.center;
          lastResolvedIndexRef.current = null;
        } else {
          // resolveFrame reroutes a known-bad arc of the rotation set (see
          // frameBlend.ts) to the nearest good frame instead of using it
          // as-is, with hysteresis so it can't flip-flop between the two
          // substitutes from ordinary cursor jitter near the midpoint.
          //
          // A short crossfade across that remap was tried, but frames 40
          // and 48 are two different photos - the hair sits in a visibly
          // different place in each - so even a ~130ms alpha blend between
          // them read as a second set of hair popping in and fading out,
          // not a smooth tween. A straight cut has no ghosting, so that's
          // what this draws.
          const resolvedIndex = resolveFrame(step.frameIndex, lastResolvedIndexRef.current);
          image = frames.rotation[resolvedIndex];
          lastResolvedIndexRef.current = resolvedIndex;
        }
      }

      // Nothing changed since the last draw: skip the clear + blit entirely.
      // Idle frames then cost nothing and don't force the frosted-glass cards
      // above the canvas to re-blur.
      const key = `${transform.scale}|${transform.offsetX}|${transform.offsetY}|${width}x${height}`;
      const last = lastDrawnRef.current;
      if (last && last.image === image && last.key === key) return;

      const { sx, sy, sw, sh } = frames.rect;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(
        image,
        transform.offsetX + sx * transform.scale,
        transform.offsetY + sy * transform.scale,
        sw * transform.scale,
        sh * transform.scale
      );
      lastDrawnRef.current = { image, key };
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      sizeObserver?.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      unsubscribe();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="hero-canvas"
      role="img"
      aria-label="Portrait of Sakshi Haste, whose gaze follows your cursor"
    />
  );
}
