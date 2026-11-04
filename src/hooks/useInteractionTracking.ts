// src/hooks/useInteractionTracking.ts
import { useEffect } from "react";
import { interactionState } from "../lib/interactionState";

const HOVER_SELECTOR = "a, button, [data-cursor-hover]";

/**
 * Wires window/document-level pointer listeners into the shared
 * interactionState singleton. Call this exactly once (in Hero.tsx).
 */
export function useInteractionTracking(): void {
  useEffect(() => {
    function handleMove(event: PointerEvent) {
      interactionState.x = event.clientX;
      interactionState.y = event.clientY;
      interactionState.hasPointer = true;
    }
    function handleOver(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(HOVER_SELECTOR)) {
        interactionState.hovering = true;
      }
    }
    function handleOut(event: PointerEvent) {
      const related = event.relatedTarget as HTMLElement | null;
      if (!related || !related.closest(HOVER_SELECTOR)) {
        interactionState.hovering = false;
      }
    }

    window.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerover", handleOver);
    document.addEventListener("pointerout", handleOut);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      document.removeEventListener("pointerout", handleOut);
    };
  }, []);
}
