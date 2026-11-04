import { angleTo, angleToFrameIndex, lerpAngle } from "./angle";

export const LERP_FACTOR = 0.26;
export const DEADZONE_FRACTION = 0.12;

export interface TrackingStepInput {
  cursorX: number;
  cursorY: number;
  faceX: number;
  faceY: number;
  currentSmoothedAngle: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface TrackingStepResult {
  smoothedAngle: number;
  frameIndex: number;
  isCenter: boolean;
}

export function computeTrackingStep(input: TrackingStepInput): TrackingStepResult {
  const {
    cursorX,
    cursorY,
    faceX,
    faceY,
    currentSmoothedAngle,
    viewportWidth,
    viewportHeight,
  } = input;

  const dx = cursorX - faceX;
  const dy = cursorY - faceY;
  const distance = Math.hypot(dx, dy);
  const deadzoneRadius = DEADZONE_FRACTION * Math.min(viewportWidth, viewportHeight);
  const isCenter = distance < deadzoneRadius;

  const targetAngle = angleTo(faceX, faceY, cursorX, cursorY);
  const smoothedAngle = lerpAngle(currentSmoothedAngle, targetAngle, LERP_FACTOR);
  const frameIndex = angleToFrameIndex(smoothedAngle);

  return { smoothedAngle, frameIndex, isCenter };
}
