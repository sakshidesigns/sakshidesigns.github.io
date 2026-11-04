import { describe, expect, it } from "vitest";
import {
  angleTo,
  angleToFrameIndex,
  DEGREES_PER_FRAME,
  FRAME_COUNT,
  lerpAngle,
  normalizeAngle,
} from "./angle";

describe("normalizeAngle", () => {
  it("wraps negative angles into 0-360", () => {
    expect(normalizeAngle(-30)).toBeCloseTo(330);
  });
  it("wraps angles above 360 back into range", () => {
    expect(normalizeAngle(370)).toBeCloseTo(10);
  });
  it("leaves in-range angles unchanged", () => {
    expect(normalizeAngle(90)).toBeCloseTo(90);
  });
});

describe("angleTo", () => {
  it("is 0 degrees for a point directly to the right", () => {
    expect(angleTo(0, 0, 10, 0)).toBeCloseTo(0);
  });
  it("is 90 degrees for a point directly below (y-down screen space)", () => {
    expect(angleTo(0, 0, 0, 10)).toBeCloseTo(90);
  });
  it("is 180 degrees for a point directly to the left", () => {
    expect(angleTo(0, 0, -10, 0)).toBeCloseTo(180);
  });
  it("is 270 degrees for a point directly above", () => {
    expect(angleTo(0, 0, 0, -10)).toBeCloseTo(270);
  });
});

describe("lerpAngle", () => {
  it("takes the short way across the 0/360 wrap", () => {
    // 350 -> 10 the short way is +20 (through 0), not -340 the long way
    expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(0);
  });
  it("takes the short way in the other direction across the wrap", () => {
    expect(lerpAngle(10, 350, 0.5)).toBeCloseTo(0);
  });
  it("moves toward the target by the given factor when no wrap is involved", () => {
    expect(lerpAngle(0, 90, 0.26)).toBeCloseTo(23.4);
  });
  it("returns the current angle unchanged when factor is 0", () => {
    expect(lerpAngle(45, 200, 0)).toBeCloseTo(45);
  });
});

describe("angleToFrameIndex", () => {
  it("maps 0 degrees to frame 0", () => {
    expect(angleToFrameIndex(0)).toBe(0);
  });
  it("maps exactly one frame-step to frame 1", () => {
    expect(angleToFrameIndex(DEGREES_PER_FRAME)).toBe(1);
  });
  it("wraps angles just under 360 back to frame 0", () => {
    expect(angleToFrameIndex(358.5)).toBe(0);
  });
  it("never returns an index outside the valid frame range", () => {
    for (let deg = 0; deg < 360; deg += 3) {
      const index = angleToFrameIndex(deg);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(FRAME_COUNT);
    }
  });
});
