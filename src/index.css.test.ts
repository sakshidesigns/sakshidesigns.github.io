import { describe, expect, it } from "vitest";
import css from "./index.css?raw";

function reducedMotionBlock(): string {
  const match = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\r?\n\}/);
  expect(match, "expected a prefers-reduced-motion block in index.css").not.toBeNull();
  return match![1];
}

/** Concatenated bodies of every rule whose selector list ends with `selector`. */
function ruleBodies(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...css.matchAll(new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`, "g"))];
  expect(matches.length, `expected a ${selector} rule`).toBeGreaterThan(0);
  return matches.map((m) => m[1]).join("\n");
}

describe("index.css reduced motion", () => {
  it("stops cloud drift and card bobbing", () => {
    const block = reducedMotionBlock();
    expect(block).toContain(".sky-cloud-layer");
    expect(block).toContain(".summary-card");
    expect(block).toMatch(/animation:\s*none/);
  });
});

describe("index.css cursor", () => {
  it("draws the dot and ring in navy ink so they stay visible over the light sky, clouds and table", () => {
    expect(ruleBodies(".magnetic-cursor-dot")).toContain("var(--ink)");
    expect(ruleBodies(".magnetic-cursor-ring")).toMatch(/rgba\(15, 31, 77/);
  });
});

describe("index.css hero layers scroll with the page", () => {
  it("sizes the hero with the dynamic viewport unit so phone toolbars neither stretch nor hide the bottom of the scene", () => {
    expect(ruleBodies(".hero")).toContain("100dvh");
  });

  it("keeps the canvas and text column inside the hero (absolute), never pinned to the screen (fixed)", () => {
    expect(ruleBodies(".hero-canvas")).not.toContain("position: fixed");
    expect(ruleBodies(".hero-canvas")).toContain("position: absolute");
    expect(ruleBodies(".hero-content")).not.toContain("position: fixed");
    expect(ruleBodies(".hero-content")).toContain("position: absolute");
  });
});

describe("index.css sections wrapper", () => {
  it("clips the fixed sky layer to the sections so the clouds never paint over the hero", () => {
    expect(ruleBodies(".site-sections")).toContain("clip-path: inset(0)");
  });

  it("clips horizontal overflow (transient burst-in scale) without becoming a scroll container that would break sticky sections", () => {
    const body = ruleBodies(".site-sections");
    expect(body).toContain("overflow-x: clip");
    expect(body).not.toMatch(/overflow(-x|-y)?:\s*(hidden|auto|scroll)/);
  });

  it("keeps the site sky fixed, behind the sections and non-interactive", () => {
    const body = ruleBodies(".site-sky");
    expect(body).toContain("position: fixed");
    expect(body).toMatch(/z-index:\s*-1/);
    expect(body).toContain("pointer-events: none");
  });
});

describe("index.css stacking and cloud cost (review fixes)", () => {
  const zIndex = (selector: string) => Number(ruleBodies(selector).match(/z-index:\s*(-?\d+)/)?.[1]);

  it("keeps the fixed nav above the hero text column that now scrolls under it, and below the progress bar and loader", () => {
    expect(zIndex(".site-nav")).toBeGreaterThan(zIndex(".hero-content"));
    expect(zIndex(".site-nav")).toBeLessThan(60); // ScrollProgress is z-[60]
    expect(zIndex(".site-nav")).toBeLessThan(zIndex(".page-loader"));
  });

  // Whether the Work cards' clouds drift or hold still is now covered by
  // workCardSky.test.tsx: the user asked them to keep moving, overriding
  // the performance-only freeze this test used to pin.
});
describe("index.css scrollbar gutter", () => {
  it("does not reserve a both-edges scrollbar gutter: fixed full-bleed layers (.site-sky, .hero) don't paint into a reserved gutter, so it left a bare-background seam down one edge of the whole page", () => {
    expect(css).not.toMatch(/scrollbar-gutter/);
  });
});
