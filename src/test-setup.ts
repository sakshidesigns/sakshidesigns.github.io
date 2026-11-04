import "@testing-library/jest-dom/vitest";

// jsdom does not implement PointerEvent (see jsdom/jsdom#2527). MouseEvent
// already carries every property our tests/hooks rely on (clientX, clientY,
// relatedTarget, bubbles), so a thin subclass is a faithful stand-in.
if (typeof window !== "undefined" && !("PointerEvent" in window)) {
  class PointerEventPolyfill extends MouseEvent {}
  // @ts-expect-error -- polyfilling a constructor jsdom doesn't provide
  window.PointerEvent = PointerEventPolyfill;
}

// framer-motion (whileInView / useScroll) needs these; jsdom implements neither.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
for (const name of ["IntersectionObserver", "ResizeObserver"] as const) {
  if (typeof window !== "undefined" && !(name in window)) {
    Object.defineProperty(window, name, { writable: true, configurable: true, value: ObserverStub });
  }
}
