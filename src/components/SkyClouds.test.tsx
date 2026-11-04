import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkyClouds } from "./SkyClouds";

describe("SkyClouds", () => {
  it("is decorative: hidden from assistive tech", () => {
    const { container } = render(<SkyClouds />);
    const root = container.querySelector(".sky-clouds");
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("aria-hidden", "true");
  });

  it("renders three drifting layers, each tiled three times for a seamless loop", () => {
    const { container } = render(<SkyClouds />);
    const layers = container.querySelectorAll(".sky-cloud-layer");
    expect(layers).toHaveLength(3);
    layers.forEach((layer) => {
      expect(layer.querySelectorAll("svg")).toHaveLength(3);
    });
  });

  it("keeps every layer at or below 0.5 opacity with a 120-200s drift", () => {
    const { container } = render(<SkyClouds />);
    container.querySelectorAll<HTMLElement>(".sky-cloud-layer").forEach((layer) => {
      expect(Number(layer.style.opacity)).toBeLessThanOrEqual(0.5);
      const seconds = parseFloat(layer.style.animationDuration);
      expect(seconds).toBeGreaterThanOrEqual(120);
      expect(seconds).toBeLessThanOrEqual(200);
    });
  });
});

describe("SkyClouds compact mode and unique ids", () => {
  it("compact renders one layer of two tiles and is marked compact", () => {
    const { container } = render(<SkyClouds compact />);
    expect(container.querySelector(".sky-clouds")).toHaveClass("sky-clouds-compact");
    const layers = container.querySelectorAll(".sky-cloud-layer");
    expect(layers).toHaveLength(1);
    expect(layers[0].querySelectorAll("svg")).toHaveLength(2);
  });

  it("gives every filter a document-unique id even with several instances on the page", () => {
    const { container } = render(
      <>
        <SkyClouds />
        <SkyClouds />
        <SkyClouds compact />
      </>
    );
    const ids = [...container.querySelectorAll("filter")].map((filter) => filter.id);
    expect(ids.length).toBeGreaterThan(3);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
