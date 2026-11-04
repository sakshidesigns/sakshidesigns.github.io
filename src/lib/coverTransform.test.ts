import { describe, expect, it } from "vitest";
import {
  bitmapPixelSize,
  computeCoverTransform,
  computeStageTransform,
  mapSourcePointToContainer,
  offsetByRect,
  visibleSourceRect,
} from "./coverTransform";

describe("computeStageTransform", () => {
  it("is exactly the cover transform for common wide screens (16:10, 16:9, 8:5)", () => {
    for (const [w, h] of [
      [1440, 900],
      [1920, 1080],
      [1600, 1000],
    ]) {
      expect(computeStageTransform(w, h, 1280, 720)).toEqual(computeCoverTransform(w, h, 1280, 720));
    }
  });

  it("keeps her crown in view on very wide, short windows by anchoring the crop to the top", () => {
    const ultrawide = computeStageTransform(2560, 1080, 1280, 720);
    const cover = computeCoverTransform(2560, 1080, 1280, 720);
    expect(ultrawide.scale).toBeCloseTo(cover.scale);
    expect(ultrawide.offsetY).toBeCloseTo(0); // top-anchored: nothing cropped off the crown
    const wide = computeStageTransform(1366, 650, 1280, 720); // aspect 2.1
    expect(wide.offsetY).toBeGreaterThan(computeCoverTransform(1366, 650, 1280, 720).offsetY); // less top crop than centered
  });

  it("changes size smoothly across the tablet/desktop and phone/tablet thresholds (no popping while resizing)", () => {
    const sweep = (sizes: Array<[number, number]>) => {
      let worstScale = 0;
      let worstOffset = 0;
      for (let i = 1; i < sizes.length; i++) {
        const a = computeStageTransform(sizes[i - 1][0], sizes[i - 1][1], 1280, 720);
        const b = computeStageTransform(sizes[i][0], sizes[i][1], 1280, 720);
        worstScale = Math.max(worstScale, Math.abs(b.scale - a.scale) / a.scale);
        worstOffset = Math.max(worstOffset, Math.abs(b.offsetY - a.offsetY), Math.abs(b.offsetX - a.offsetX));
      }
      return { worstScale, worstOffset };
    };
    const widths = (from: number, to: number, height: number): Array<[number, number]> =>
      Array.from({ length: to - from + 1 }, (_, i) => [from + i, height]);
    const desktopEdge = sweep(widths(1300, 1700, 1000)); // aspect 1.3 -> 1.7, one pixel of width at a time
    expect(desktopEdge.worstScale).toBeLessThan(0.005);
    expect(desktopEdge.worstOffset).toBeLessThan(3); // px of movement per 1px of resize; the old step was 130+
    const phoneEdge = sweep(widths(800, 1200, 1000)); // aspect 0.8 -> 1.2
    expect(phoneEdge.worstScale).toBeLessThan(0.005);
    expect(phoneEdge.worstOffset).toBeLessThan(3);
  });

  it("fits the whole frame by width, anchored to the bottom, for tablet-shaped screens", () => {
    const t = computeStageTransform(1024, 768, 1280, 720);
    expect(t.scale).toBeCloseTo(1024 / 1280);
    expect(t.offsetX).toBeCloseTo(0);
    expect(t.offsetY).toBeCloseTo(768 - 720 * (1024 / 1280));
  });

  it("shows the central 60% of the frame, bottom-anchored, on phone portrait screens", () => {
    const t = computeStageTransform(390, 844, 1280, 720);
    expect(t.scale).toBeCloseTo(390 / (1280 * 0.6));
    expect(t.offsetX).toBeCloseTo((390 - 1280 * t.scale) / 2);
    expect(t.offsetX).toBeLessThan(0);
    expect(t.offsetY + 720 * t.scale).toBeCloseTo(844); // table edge sits on the viewport bottom
  });

  it("keeps the face anchor inside the viewport on a phone", () => {
    const t = computeStageTransform(390, 844, 1280, 720);
    const face = mapSourcePointToContainer(0.49, 0.38, 1280, 720, t);
    expect(face.x).toBeGreaterThan(0);
    expect(face.x).toBeLessThan(390);
    expect(face.y).toBeGreaterThan(0);
    expect(face.y).toBeLessThan(844);
  });
});

describe("computeCoverTransform", () => {
  it("is a 1:1 scale with no offset when container matches source exactly", () => {
    const t = computeCoverTransform(1280, 720, 1280, 720);
    expect(t.scale).toBeCloseTo(1);
    expect(t.offsetX).toBeCloseTo(0);
    expect(t.offsetY).toBeCloseTo(0);
  });

  it("scales to fill width and crops vertically for a wider container", () => {
    const t = computeCoverTransform(1920, 720, 1280, 720);
    expect(t.scale).toBeCloseTo(1.5);
    expect(t.offsetX).toBeCloseTo(0);
    expect(t.offsetY).toBeCloseTo((720 - 720 * 1.5) / 2);
  });

  it("scales to fill height and crops horizontally for a taller/narrower container", () => {
    const t = computeCoverTransform(400, 800, 1280, 720);
    // scaleY = 800/720 = 1.111..., scaleX = 400/1280 = 0.3125 -> cover uses the larger
    expect(t.scale).toBeCloseTo(800 / 720);
    expect(t.offsetY).toBeCloseTo(0);
    expect(t.offsetX).toBeLessThan(0);
  });
});

describe("mapSourcePointToContainer", () => {
  it("maps a normalized source point through an identity transform", () => {
    const transform = computeCoverTransform(1280, 720, 1280, 720);
    const p = mapSourcePointToContainer(0.49, 0.38, 1280, 720, transform);
    expect(p.x).toBeCloseTo(0.49 * 1280);
    expect(p.y).toBeCloseTo(0.38 * 720);
  });

  it("scales and offsets the point for a non-identity transform", () => {
    const transform = computeCoverTransform(1920, 720, 1280, 720);
    const p = mapSourcePointToContainer(0.5, 0.5, 1280, 720, transform);
    expect(p.x).toBeCloseTo(0.5 * 1280 * transform.scale + transform.offsetX);
    expect(p.y).toBeCloseTo(0.5 * 720 * transform.scale + transform.offsetY);
  });
});

describe("visibleSourceRect", () => {
  it("is the part of the frame that stays on screen after a cover crop", () => {
    const t = computeStageTransform(1440, 900, 1280, 720);
    const rect = visibleSourceRect(1440, 900, 1280, 720, t);
    expect(rect.sx).toBeCloseTo(64); // 80px cropped off each side at scale 1.25
    expect(rect.sw).toBeCloseTo(1152);
    expect(rect.sy).toBeCloseTo(0);
    expect(rect.sh).toBeCloseTo(720);
  });

  it("is the central 60% of the frame on a phone, full height (bottom-anchored)", () => {
    const t = computeStageTransform(390, 844, 1280, 720);
    const rect = visibleSourceRect(390, 844, 1280, 720, t);
    expect(rect.sw).toBeCloseTo(1280 * 0.6);
    expect(rect.sx).toBeCloseTo(1280 * 0.2);
    expect(rect.sy).toBeCloseTo(0);
    expect(rect.sh).toBeCloseTo(720);
  });

  it("never extends outside the source frame", () => {
    for (const [w, h] of [[1024, 768], [2560, 1080], [768, 1024], [320, 568]]) {
      const rect = visibleSourceRect(w, h, 1280, 720, computeStageTransform(w, h, 1280, 720));
      expect(rect.sx).toBeGreaterThanOrEqual(0);
      expect(rect.sy).toBeGreaterThanOrEqual(0);
      expect(rect.sx + rect.sw).toBeLessThanOrEqual(1280 + 1e-6);
      expect(rect.sy + rect.sh).toBeLessThanOrEqual(720 + 1e-6);
    }
  });
});

describe("bitmapPixelSize", () => {
  it("matches the on-screen size at 1x pixel density", () => {
    const rect = { sx: 64, sy: 0, sw: 1152, sh: 720 };
    expect(bitmapPixelSize(rect, 1.25, 1)).toEqual({ width: 1440, height: 900 });
  });

  it("caps at 2x density and never exceeds the real frame resolution (1.5 px per source unit)", () => {
    const rect = { sx: 64, sy: 0, sw: 1152, sh: 720 };
    const hidpi = bitmapPixelSize(rect, 1.25, 3);
    expect(hidpi.width).toBe(Math.round(1152 * 1.5)); // 1728, the frame's own pixels
    const phone = bitmapPixelSize({ sx: 256, sy: 0, sw: 768, sh: 720 }, 390 / 768, 3);
    expect(phone.width).toBe(780); // 390 css px x 2, not x3
    expect(phone.height).toBe(Math.round((780 * 720) / 768));
  });
});

describe("offsetByRect", () => {
  it("moves a canvas-space point into viewport space by the canvas's on-screen position", () => {
    expect(offsetByRect({ x: 704, y: 342 }, { left: 0, top: -250 })).toEqual({ x: 704, y: 92 });
    expect(offsetByRect({ x: 10, y: 20 }, { left: 5, top: 7 })).toEqual({ x: 15, y: 27 });
  });
});
