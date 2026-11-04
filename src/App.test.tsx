import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, blob: async () => new Blob([]) })));
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders the hero and the four sections in order with the nav anchors' ids", () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll("#top, #about, #work, #experience, #contact")].map((el) => el.id);
    expect(ids).toEqual(["top", "about", "work", "experience", "contact"]);
  });

  it("puts the lifted sections inside the .site-sections wrapper and the hero outside it", () => {
    const { container } = render(<App />);
    const wrapper = container.querySelector(".site-sections") as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector("#about, #work, #experience, #contact")).not.toBeNull();
    expect(wrapper.querySelector("#top")).toBeNull();
    expect(wrapper.querySelector(".site-sky")).not.toBeNull();
  });
});
