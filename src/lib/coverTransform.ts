export interface CoverTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Replicates CSS `object-fit: cover` math: the source is scaled up by
 * whichever axis needs more growth to fill the container, then centered,
 * so the container is always fully covered with the excess cropped evenly.
 */
export function computeCoverTransform(
  containerWidth: number,
  containerHeight: number,
  sourceWidth: number,
  sourceHeight: number
): CoverTransform {
  const scale = Math.max(containerWidth / sourceWidth, containerHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  return {
    scale,
    offsetX: (containerWidth - drawWidth) / 2,
    offsetY: (containerHeight - drawHeight) / 2,
  };
}

/**
 * Aspect-ratio bands (width / height). Every threshold is a ramp rather than
 * a step, so resizing a window never makes her pop in size.
 *   below PHONE_BAND_LOW  : phones in portrait, central 60% of the frame
 *   PHONE_BAND_*          : blend from the phone framing to whole-frame width-fit
 *   up to DESKTOP_BAND_LOW: tablet, whole frame fitted by width
 *   DESKTOP_BAND_*        : blend from width-fit to the cover fit
 *   above DESKTOP_BAND_HIGH: cover fit, crop biased toward the top past 16:9
 */
const PHONE_BAND_LOW = 0.9;
const PHONE_BAND_HIGH = 1.1;
const PHONE_VISIBLE_FRACTION = 0.6;
const DESKTOP_BAND_LOW = 1.4;
const DESKTOP_BAND_HIGH = 1.6;
const TOP_ANCHOR_START = 16 / 9;
const TOP_ANCHOR_END = 2.18;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/**
 * Placement of the character frame for the transparent sky scene.
 *
 * Wide screens use the plain cover fit; on very wide, short windows the crop
 * moves from centered to top-anchored so her crown is never cut off. On
 * narrower screens a cover fit would blow her up until her face fills the
 * viewport, so the frame is instead fitted by width and anchored to the bottom
 * (table edge on the viewport bottom); the frame is transparent, so the space
 * above is just sky for the name, cards and clouds. Phones in portrait show
 * only the central 60% of the frame width (her head and shoulders) so she
 * stays a sensible size. The face anchor is mapped through this same
 * transform, so tracking is unaffected.
 */
export function computeStageTransform(
  containerWidth: number,
  containerHeight: number,
  sourceWidth: number,
  sourceHeight: number
): CoverTransform {
  const aspect = containerWidth / containerHeight;
  const cover = computeCoverTransform(containerWidth, containerHeight, sourceWidth, sourceHeight);

  if (aspect >= DESKTOP_BAND_HIGH) {
    const topAnchor = clamp01((aspect - TOP_ANCHOR_START) / (TOP_ANCHOR_END - TOP_ANCHOR_START));
    return { ...cover, offsetY: cover.offsetY * (1 - topAnchor) };
  }

  const visibleFraction = lerp(
    PHONE_VISIBLE_FRACTION,
    1,
    clamp01((aspect - PHONE_BAND_LOW) / (PHONE_BAND_HIGH - PHONE_BAND_LOW))
  );
  const scale = containerWidth / (sourceWidth * visibleFraction);
  const widthFit: CoverTransform = {
    scale,
    offsetX: (containerWidth - sourceWidth * scale) / 2,
    offsetY: containerHeight - sourceHeight * scale,
  };
  if (aspect <= DESKTOP_BAND_LOW) return widthFit;

  const t = (aspect - DESKTOP_BAND_LOW) / (DESKTOP_BAND_HIGH - DESKTOP_BAND_LOW);
  return {
    scale: lerp(widthFit.scale, cover.scale, t),
    offsetX: lerp(widthFit.offsetX, cover.offsetX, t),
    offsetY: lerp(widthFit.offsetY, cover.offsetY, t),
  };
}

/**
 * Maps a point given as normalized source-space coordinates (0-1, 0-1)
 * through a cover transform into live container/viewport pixel coordinates.
 */
export function mapSourcePointToContainer(
  normX: number,
  normY: number,
  sourceWidth: number,
  sourceHeight: number,
  transform: CoverTransform
): { x: number; y: number } {
  const sourceX = normX * sourceWidth;
  const sourceY = normY * sourceHeight;
  return {
    x: sourceX * transform.scale + transform.offsetX,
    y: sourceY * transform.scale + transform.offsetY,
  };
}

/** A rectangle in source-frame units (the 1280x720 logical space). */
export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Real pixels per source unit in the shipped frames (1920 px wide for 1280 units). */
export const FRAME_PIXELS_PER_UNIT = 1.5;
/** Highest device pixel ratio worth decoding for; beyond this the extra memory buys nothing visible. */
const MAX_BITMAP_DENSITY = 2;

/**
 * The part of the source frame that is actually on screen under `transform`.
 * Everything outside it is cropped away by the viewport, so it need not be
 * decoded or kept in memory.
 */
export function visibleSourceRect(
  containerWidth: number,
  containerHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  transform: CoverTransform
): SourceRect {
  const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));
  const left = clamp(-transform.offsetX / transform.scale, sourceWidth);
  const top = clamp(-transform.offsetY / transform.scale, sourceHeight);
  const right = clamp((containerWidth - transform.offsetX) / transform.scale, sourceWidth);
  const bottom = clamp((containerHeight - transform.offsetY) / transform.scale, sourceHeight);
  return { sx: left, sy: top, sw: right - left, sh: bottom - top };
}

/**
 * Pixel size to decode a frame at so it can be blitted 1:1: its on-screen
 * size at the current device pixel ratio (capped at 2x), but never more than
 * the frame's own resolution.
 */
export function bitmapPixelSize(rect: SourceRect, scale: number, devicePixelRatio: number): { width: number; height: number } {
  const density = Math.min(devicePixelRatio, MAX_BITMAP_DENSITY);
  const width = Math.max(1, Math.min(Math.round(rect.sw * scale * density), Math.round(rect.sw * FRAME_PIXELS_PER_UNIT)));
  return { width, height: Math.max(1, Math.round((width * rect.sh) / rect.sw)) };
}

/** Moves a point from canvas space into viewport space, given the canvas's on-screen rectangle. */
export function offsetByRect(point: { x: number; y: number }, rect: { left: number; top: number }): { x: number; y: number } {
  return { x: point.x + rect.left, y: point.y + rect.top };
}
