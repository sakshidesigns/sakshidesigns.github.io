import { describe, expect, it } from "vitest";
import css from "./sections.css?raw";

describe("sections.css (Tailwind wiring)", () => {
  it("imports Tailwind utilities only: no preflight, no automatic source scanning", () => {
    expect(css).toContain('@import "tailwindcss/theme.css" layer(theme);');
    expect(css).toContain('@import "tailwindcss/utilities.css" layer(utilities) source(none);');
    expect(css).not.toMatch(/tailwindcss\/preflight/);
    expect(css).not.toMatch(/@import\s+["']tailwindcss["']/);
    expect(css).toContain('@source "./";');
  });

  it("declares layer order so the scoped reset (base) sits below utilities", () => {
    expect(css).toMatch(/@layer theme, base, components, utilities;/);
  });

  it("scopes the preflight replacement to .site-sections inside @layer base", () => {
    const base = css.match(/@layer base \{([\s\S]*?)\r?\n\}/);
    expect(base, "expected an @layer base block").not.toBeNull();
    expect(base![1]).toContain(".site-sections");
    expect(base![1]).toMatch(/list-style:\s*none/);
  });

  it("maps the old tokens onto the new palette", () => {
    expect(css).toMatch(/--color-ink:\s*#0f1f4d/);
    expect(css).toMatch(/--color-brand:\s*#2f7ff2/);
    expect(css).toMatch(/--font-serif:\s*"Playfair Display"/);
  });
});

describe("sections.css review fixes", () => {
  it("smooth-scrolls only for people who have not asked for reduced motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?scroll-behavior:\s*smooth/);
    expect(css).not.toMatch(/(^|\n)html \{\s*scroll-behavior/);
  });

  it("gives the lifted links a strong keyboard focus ring (the native cursor is hidden)", () => {
    expect(css).toMatch(/\.site-sections a:focus-visible/);
  });

  it("does not put a backdrop blur behind the opaque Work card fill (it can never show and costs a lot)", () => {
    const rule = css.match(/\.card-sky-gradient \{([^}]*)\}/);
    expect(rule).not.toBeNull();
    expect(rule![1]).not.toMatch(/backdrop-filter/);
  });

  it("defines the deeper and lighter brand shades used for text on the sky and on the footer", () => {
    expect(css).toMatch(/--color-brand-deep:\s*#174aad/);
    expect(css).toMatch(/--color-brand-light:\s*#7db4ff/);
  });
});