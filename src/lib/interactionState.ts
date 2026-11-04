// src/lib/interactionState.ts

export interface InteractionState {
  x: number;
  y: number;
  hovering: boolean;
  /**
   * False until a real pointermove has been observed. Distinguishes "no real
   * pointer position yet" from "the pointer really is at (x, y)", so the
   * character can hold eye contact instead of gazing at the (-9999, -9999)
   * placeholder on load and forever on touch/coarse-pointer devices.
   */
  hasPointer: boolean;
}

/**
 * Single shared mutable pointer/hover state, updated by
 * useInteractionTracking and read every tick by CharacterCanvas and
 * MagneticCursor. Deliberately not React state: it changes on every
 * mousemove and must not trigger component re-renders.
 */
export const interactionState: InteractionState = {
  x: -9999,
  y: -9999,
  hovering: false,
  hasPointer: false,
};
