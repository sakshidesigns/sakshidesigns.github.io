/** Wraps any degree value into the range [0, 360). */
export function normalizeAngle(deg: number): number {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Angle in degrees from (originX, originY) to (pointX, pointY), using
 * atan2(dy, dx) in y-down screen space: 0=RIGHT, 90=DOWN, 180=LEFT, 270=UP.
 */
export function angleTo(
  originX: number,
  originY: number,
  pointX: number,
  pointY: number
): number {
  const dx = pointX - originX;
  const dy = pointY - originY;
  const rad = Math.atan2(dy, dx);
  return normalizeAngle((rad * 180) / Math.PI);
}

/** Shortest-path circular interpolation from `current` toward `target`. */
export function lerpAngle(current: number, target: number, factor: number): number {
  let delta = normalizeAngle(target - current);
  if (delta > 180) delta -= 360;
  return normalizeAngle(current + delta * factor);
}

export const FRAME_COUNT = 64;
export const DEGREES_PER_FRAME = 360 / FRAME_COUNT;

/** Nearest of the 64 pre-extracted rotation frames for a given angle. */
export function angleToFrameIndex(angleDeg: number): number {
  const normalized = normalizeAngle(angleDeg);
  return Math.round(normalized / DEGREES_PER_FRAME) % FRAME_COUNT;
}
