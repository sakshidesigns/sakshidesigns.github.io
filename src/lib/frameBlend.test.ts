import { describe, expect, it } from "vitest";
import { DEAD_FRAME_RANGES, resolveFrame } from "./frameBlend";

describe("resolveFrame", () => {
  it("passes through frames outside any dead zone unchanged", () => {
    expect(resolveFrame(10)).toBe(10);
    expect(resolveFrame(40)).toBe(40);
    expect(resolveFrame(48)).toBe(48);
  });

  it("with no prior frame, snaps to the nearer side of the zone's midpoint", () => {
    const { start, end, before, after } = DEAD_FRAME_RANGES[0];
    const midpoint = (start + end) / 2; // 44
    expect(resolveFrame(start)).toBe(before);
    expect(resolveFrame(midpoint)).toBe(before); // ties go to "before"
    expect(resolveFrame(midpoint + 1)).toBe(after);
    expect(resolveFrame(end)).toBe(after);
  });

  it("sticks to 'before' until the raw frame clears the midpoint by more than the hysteresis margin", () => {
    const { before, after } = DEAD_FRAME_RANGES[0];
    // Work's nav link settles at raw frame ~43.3, well inside the zone but
    // short of the plain midpoint (44) - this is the case the hysteresis
    // exists for: repeated resolves at frames right around the boundary
    // must not flicker just because a previous call already landed here.
    expect(resolveFrame(43, before)).toBe(before);
    expect(resolveFrame(44, before)).toBe(before);
    expect(resolveFrame(45, before)).toBe(before); // within the margin, stays put
    expect(resolveFrame(46, before)).toBe(after); // past the margin, commits to the flip
  });

  it("sticks to 'after' until the raw frame clears the midpoint by more than the hysteresis margin", () => {
    const { before, after } = DEAD_FRAME_RANGES[0];
    expect(resolveFrame(45, after)).toBe(after);
    expect(resolveFrame(44, after)).toBe(after);
    expect(resolveFrame(43, after)).toBe(after); // within the margin, stays put
    expect(resolveFrame(42, after)).toBe(before); // past the margin, commits to the flip
  });

  it("never flickers across repeated calls at a single frame near the boundary", () => {
    const { before } = DEAD_FRAME_RANGES[0];
    // Simulate many ticks resolving the exact same raw frame in a row -
    // the output must be stable once it has picked a side.
    let resolved: number | null = null;
    for (let i = 0; i < 50; i++) {
      resolved = resolveFrame(43, resolved);
    }
    expect(resolved).toBe(before);
  });

  it("still ends up on the correct, nearer side once the cursor clearly commits to it", () => {
    const { before, after } = DEAD_FRAME_RANGES[0];
    // Starting fresh (no prior resolve) and moving straight to a frame
    // solidly on the "after" side must land on "after", not get stuck.
    expect(resolveFrame(47, null)).toBe(after);
    expect(resolveFrame(41, null)).toBe(before);
  });
});
