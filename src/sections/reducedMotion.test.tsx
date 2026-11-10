import { render } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import Intro from "./components/Intro";
import Work from "./components/Work";
import { work } from "./data";

// framer-motion reads the OS setting on the first useReducedMotion() call, so
// the stub must be in place before any component renders.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
});
afterAll(() => {
  vi.unstubAllGlobals();
});

describe("scroll-linked effects respect prefers-reduced-motion", () => {
  it("Work becomes a plain list of cards: nothing pinned, no scroll-driven slide/scale", () => {
    const { container, getByText } = render(<Work />);
    expect(container.querySelector(".sticky")).toBeNull();
    expect(container.querySelector("#work [style*='height']")).toBeNull(); // no 400vh scroll runway
    work.forEach((item) => expect(getByText(item.title)).toBeInTheDocument());
  });


  it("Intro shows the whole statement at full strength with no per-word blur", () => {
    const { container } = render(<Intro />);
    expect(container.querySelectorAll("p span[style]")).toHaveLength(0);
    expect(container.querySelector("p")?.textContent).toContain("navigate naturally");
  });
});
