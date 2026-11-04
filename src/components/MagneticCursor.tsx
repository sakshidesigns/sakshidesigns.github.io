// src/components/MagneticCursor.tsx
import { useEffect, useRef } from "react";
import { interactionState } from "../lib/interactionState";
import { subscribeTick } from "../lib/ticker";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Exponential decay rates (per second), not a per-frame fraction. A fixed
// per-frame lerp (pos += (target - pos) * 0.6) only reaches the feel it was
// tuned at on the frame rate it was tuned on - the same constant converges
// faster on a 120Hz display and visibly crawls on any page where the rAF
// loop is dropping frames (several autoplaying case-study videos decoding
// at once is enough to do that), which reads as "laggy". Framing the chase
// as 1 - exp(-rate * dt) instead makes the dot/ring close a fixed share of
// the remaining distance per second of real time rather than per tick, so
// the motion looks the same regardless of refresh rate or dropped frames.
// These rates are picked to match the old constants' feel at a steady 60fps
// (solving 1 - exp(-rate / 60) = oldFactor), so this is a fix, not a retune.
const DOT_RATE = 55;
const RING_RATE = 12;
const HOVER_SCALE = 1.8;
// After the tab is backgrounded or a long task blocks the main thread, the
// next rAF delta can be huge; without a cap the resulting factor rounds up
// to effectively 1 anyway, but clamping keeps the maths (and devtools
// throttling, where dt can be seconds) sane rather than relying on that.
const MAX_DT_MS = 100;

export function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const lastTime = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const unsubscribe = subscribeTick((timestamp) => {
      const targetX = interactionState.x;
      const targetY = interactionState.y;

      // First tick: nothing to measure a delta against yet, so assume one
      // nominal 60fps frame rather than a 0 (which would freeze the chase
      // for a tick) or MAX_DT_MS (which would jump-start it too fast).
      const dtMs = lastTime.current === null ? 1000 / 60 : Math.min(timestamp - lastTime.current, MAX_DT_MS);
      lastTime.current = timestamp;
      const dt = dtMs / 1000;

      const dotFactor = reducedMotion ? 1 : 1 - Math.exp(-DOT_RATE * dt);
      const ringFactor = reducedMotion ? 1 : 1 - Math.exp(-RING_RATE * dt);

      dotPos.current.x += (targetX - dotPos.current.x) * dotFactor;
      dotPos.current.y += (targetY - dotPos.current.y) * dotFactor;
      ringPos.current.x += (targetX - ringPos.current.x) * ringFactor;
      ringPos.current.y += (targetY - ringPos.current.y) * ringFactor;

      const scale = interactionState.hovering ? HOVER_SCALE : 1;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
    });

    return unsubscribe;
  }, [reducedMotion]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      <div ref={dotRef} className="magnetic-cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="magnetic-cursor-ring" aria-hidden="true" />
    </>
  );
}
