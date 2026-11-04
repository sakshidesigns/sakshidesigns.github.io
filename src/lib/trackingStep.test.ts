import { describe, expect, it } from "vitest";
import { computeTrackingStep, DEADZONE_FRACTION, LERP_FACTOR } from "./trackingStep";

describe("computeTrackingStep", () => {
  it("reports isCenter true when the cursor is at the face anchor", () => {
    const result = computeTrackingStep({
      cursorX: 500,
      cursorY: 300,
      faceX: 500,
      faceY: 300,
      currentSmoothedAngle: 0,
      viewportWidth: 1000,
      viewportHeight: 800,
    });
    expect(result.isCenter).toBe(true);
  });

  it("reports isCenter false once the cursor clears the deadzone radius", () => {
    const viewportWidth = 1000;
    const viewportHeight = 800;
    const deadzoneRadius = DEADZONE_FRACTION * Math.min(viewportWidth, viewportHeight);
    const result = computeTrackingStep({
      cursorX: 500 + deadzoneRadius + 10,
      cursorY: 300,
      faceX: 500,
      faceY: 300,
      currentSmoothedAngle: 0,
      viewportWidth,
      viewportHeight,
    });
    expect(result.isCenter).toBe(false);
  });

  it("smooths the angle toward the cursor by LERP_FACTOR per tick", () => {
    const result = computeTrackingStep({
      cursorX: 500,
      cursorY: 1000, // straight below the face anchor -> target angle 90
      faceX: 500,
      faceY: 300,
      currentSmoothedAngle: 0,
      viewportWidth: 1000,
      viewportHeight: 800,
    });
    expect(result.smoothedAngle).toBeCloseTo(90 * LERP_FACTOR);
  });

  it("derives frameIndex from the smoothed angle, not the raw target angle", () => {
    const result = computeTrackingStep({
      cursorX: 500,
      cursorY: 1000,
      faceX: 500,
      faceY: 300,
      currentSmoothedAngle: 0,
      viewportWidth: 1000,
      viewportHeight: 800,
    });
    expect(result.frameIndex).toBe(Math.round(result.smoothedAngle / (360 / 64)) % 64);
  });
});
