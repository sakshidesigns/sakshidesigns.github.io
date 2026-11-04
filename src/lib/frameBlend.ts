// src/lib/frameBlend.ts
// The 64-frame rotation set was extracted from a limited reference shoot,
// and one short arc of it (indices 41-47, between "looking up-left" and
// "looking up") came out as near-duplicates of a neutral, centered pose
// instead of a continuing turn. Snapping straight to those frames makes
// the portrait look like it stopped tracking whenever the cursor crosses
// that arc (e.g. moving between the hero's top-left summary card and the
// nav bar).
//
// Crossfading the two good frames was tried twice: first driven by cursor
// position (stayed half-ghosted for as long as the cursor dwelled in the
// arc), then on a short fixed real-time clock instead (~130ms, regardless of
// how long the cursor lingered). Both still ghosted, because frames 40 and
// 48 are two different photographs - the hair falls in a visibly different
// place in each - so blending them at any duration shows as a second set of
// hair popping in and fading out, not a clean tween. Holding the nearer of
// the two good frames for the whole gap, switching once at the midpoint with
// a straight cut (no blend), has no ghosting; the cost is a hard pop at that
// midpoint instead of continuous motion across a ~7-frame arc (about 40
// degrees of a 360-degree sweep) - a real limitation of the source shoot,
// not something resolvable in code.
export interface DeadZone {
  start: number;
  end: number;
  before: number;
  after: number;
}

export const DEAD_FRAME_RANGES: DeadZone[] = [{ start: 41, end: 47, before: 40, after: 48 }];

// How far past the midpoint the raw frame has to move before resolveFrame
// switches sides, once it has already committed to one. Without this, a
// cursor that settles within ~1 frame-unit of the midpoint (as Work's nav
// link does - its resting angle lands at raw frame ~43.3, only 0.7 of a
// frame short of the 44 cutoff) can flip-flop between the two substitute
// frames from nothing more than ordinary cursor jitter or small per-tick
// rounding noise while the angle is still converging. A plain midpoint
// split has no memory, so each tick re-decides independently and can land
// on either side of a boundary that close. Hysteresis makes resolveFrame
// stick to whichever side it last resolved to until the raw frame moves
// convincingly past the midpoint toward the other one.
const HYSTERESIS_FRAMES = 1;

export function resolveFrame(frameIndex: number, previousResolved: number | null = null): number {
  for (const zone of DEAD_FRAME_RANGES) {
    if (frameIndex >= zone.start && frameIndex <= zone.end) {
      const midpoint = (zone.start + zone.end) / 2;
      if (previousResolved === zone.after) {
        return frameIndex < midpoint - HYSTERESIS_FRAMES ? zone.before : zone.after;
      }
      if (previousResolved === zone.before) {
        return frameIndex > midpoint + HYSTERESIS_FRAMES ? zone.after : zone.before;
      }
      return frameIndex <= midpoint ? zone.before : zone.after;
    }
  }
  return frameIndex;
}
