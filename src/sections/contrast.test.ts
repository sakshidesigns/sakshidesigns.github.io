import { describe, expect, it } from "vitest";
import bursts from "./components/BurstHeading.jsx?raw";
import footerSource from "./components/Footer.jsx?raw";
import introSource from "./components/Intro.jsx?raw";
import css from "./sections.css?raw";

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Colour of `fg` drawn at `alpha` opacity over `bg`. */
function blend(fg: string, bg: string, alpha: number): string {
  const f = fg.replace("#", "");
  const g = bg.replace("#", "");
  const mixed = [0, 2, 4].map((i) => Math.round(parseInt(f.slice(i, i + 2), 16) * alpha + parseInt(g.slice(i, i + 2), 16) * (1 - alpha)));
  return "#" + mixed.map((v) => v.toString(16).padStart(2, "0")).join("");
}
function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  expect(match, `expected token --${name}`).not.toBeNull();
  return match![1];
}

const SKY = ["#9fd8ff", "#c7e3f9", "#cfe9fd", "#eaf5ff"]; // every background the sections can sit on
const AA = 4.5;

describe("text contrast on the sky sections (WCAG AA)", () => {
  it("brand eyebrows and emphasis use the deeper brand blue, which clears AA on every sky shade", () => {
    const deep = token("color-brand-deep");
    SKY.forEach((bg) => expect(contrast(deep, bg), `${deep} on ${bg}`).toBeGreaterThanOrEqual(AA));
    expect(introSource).toMatch(/text-brand-deep/);
    expect(bursts).toMatch(/text-brand-deep/);
    expect(introSource).not.toMatch(/text-brand(?![-\w])/);
    expect(bursts).not.toMatch(/text-brand(?![-\w])/);
  });

  it("the section subtitle is dark enough on the sky", () => {
    expect(bursts).toMatch(/text-ink\/70/);
    SKY.forEach((bg) => expect(contrast(blend("#0f1f4d", bg, 0.7), bg), bg).toBeGreaterThanOrEqual(AA));
  });

  it("the Work card's own surface is the hero's exact sky (no invented colour to re-check)", () => {
    const rule = css.match(/\.card-sky-gradient \{([^}]*)\}/)![1];
    expect(rule).toMatch(/var\(--sky-top\)/);
    expect(rule).toMatch(/var\(--sky-mid\)/);
    expect(rule).toMatch(/var\(--sky-bottom\)/);
  });

  // The Work card's glass panel has no fill colour of its own at all (the
  // user asked for it to read as the card's own sky, just blurred - not a
  // separate tinted box), so there is no longer a fixed background colour
  // for a WCAG contrast-ratio calculation to run against; legibility comes
  // from a text-shadow instead (see workCardSky.test.tsx), verified by eye
  // in the browser rather than by computed contrast.

  it("the footer eyebrow and emphasis use the lighter brand blue on the dusk gradient, with pixel-anchored stops", () => {
    const light = token("color-brand-light");
    ["#163372", "#0e1d4a", "#0b1638"].forEach((bg) => expect(contrast(light, bg), `${light} on ${bg}`).toBeGreaterThanOrEqual(AA));
    expect(footerSource).toMatch(/text-brand-light/);
    expect(footerSource).not.toMatch(/text-brand(?![-\w])/);
    // Percent stops would move the dark band with the footer height; pixel stops keep the text on dark navy.
    const gradient = footerSource.match(/linear-gradient\(([^)]*\)[^)]*)\)/)![1];
    expect(gradient).toMatch(/\d+px/);
  });
});
