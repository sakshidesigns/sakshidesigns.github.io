// src/hooks/useInteractionTracking.test.tsx
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { interactionState } from "../lib/interactionState";
import { useInteractionTracking } from "./useInteractionTracking";

function TestHarness() {
  useInteractionTracking();
  return (
    <div>
      <button data-cursor-hover>hoverable</button>
      <a href="#plain">plain link</a>
      <button>plain button</button>
      <span data-testid="outside">outside</span>
    </div>
  );
}

afterEach(() => {
  interactionState.x = -9999;
  interactionState.y = -9999;
  interactionState.hovering = false;
});

describe("useInteractionTracking", () => {
  it("updates interactionState.x/y on pointer move", () => {
    render(<TestHarness />);
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 123, clientY: 456 })
      );
    });
    expect(interactionState.x).toBe(123);
    expect(interactionState.y).toBe(456);
  });

  it("sets hovering true when the pointer enters a data-cursor-hover element", () => {
    const { getByText } = render(<TestHarness />);
    const target = getByText("hoverable");
    act(() => {
      target.dispatchEvent(
        new PointerEvent("pointerover", { bubbles: true })
      );
    });
    expect(interactionState.hovering).toBe(true);
  });

  it("sets hovering false when the pointer leaves to a non-hoverable element", () => {
    const { getByText, getByTestId } = render(<TestHarness />);
    const target = getByText("hoverable");
    const outside = getByTestId("outside");
    act(() => {
      target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    });
    expect(interactionState.hovering).toBe(true);
    act(() => {
      target.dispatchEvent(
        new PointerEvent("pointerout", { bubbles: true, relatedTarget: outside })
      );
    });
    expect(interactionState.hovering).toBe(false);
  });

  it("treats plain links and plain buttons (no data attribute) as hover targets", () => {
    const { getByText, getByTestId } = render(<TestHarness />);
    const outside = getByTestId("outside");
    for (const label of ["plain link", "plain button"]) {
      const target = getByText(label);
      act(() => {
        target.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      });
      expect(interactionState.hovering, label).toBe(true);
      act(() => {
        target.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: outside }));
      });
      expect(interactionState.hovering, label).toBe(false);
    }
  });
});
