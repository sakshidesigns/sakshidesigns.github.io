import { describe, expect, it } from "vitest";
import indexCss from "../index.css?raw";
import workSource from "./components/Work.jsx?raw";
import css from "./sections.css?raw";

describe("Work cards: vivid hero sky, moving clouds, glass info panel", () => {
  it("the card's own background is the hero's exact sky gradient, not a flat navy colour", () => {
    const rule = css.match(/\.card-sky-gradient \{([^}]*)\}/);
    expect(rule, "expected a .card-sky-gradient rule").not.toBeNull();
    expect(rule![1]).toMatch(/var\(--sky-top\)/);
    expect(rule![1]).toMatch(/var\(--sky-mid\)/);
    expect(rule![1]).toMatch(/var\(--sky-bottom\)/);
    expect(rule![1]).not.toMatch(/#1[34a]/i); // none of the old dark-navy stops remain
  });

  it("the clouds inside the cards drift, same as everywhere else on the site (no longer frozen)", () => {
    expect(indexCss).not.toMatch(/\.sky-clouds-compact[^{]*\{\s*animation:\s*none/);
  });

  it("the glass panel has no fill colour of its own at all - it reads as the card's own sky, just blurred and separated", () => {
    const rule = css.match(/\.work-card-glass \{([^}]*)\}/);
    expect(rule, "expected a .work-card-glass rule").not.toBeNull();
    const body = rule![1];
    expect(body).toMatch(/backdrop-filter/);
    // No background/background-color declaration at all: no ink tint, no
    // white wash, nothing. The panel's separation from the rest of the card
    // comes entirely from blurring what's behind it (backdrop-filter) plus a
    // thin border/shadow for edge definition, never from an added fill.
    expect(body).not.toMatch(/(?<!-)background(-color)?:/);
  });

  it("keeps the white text legible without a tint, via a text-shadow instead of a background colour", () => {
    // With no background colour to guarantee contrast against, legibility
    // comes from a dark text-shadow (a halo behind the letterforms), verified
    // for real by eye in the browser - there is no fixed background colour
    // left for a WCAG contrast-ratio calculation to run against.
    expect(css).toMatch(/\.work-card-glass[^}]*text-shadow/s);
  });

  it("wraps the card's text in the glass panel, reading in white (legible on the tinted glass)", () => {
    expect(workSource).toMatch(/work-card-glass/);
    expect(workSource).toMatch(/text-white sm:text-3xl/); // title
    expect(workSource).toMatch(/text-white\/95/); // description
    expect(workSource).not.toMatch(/text-ink sm:text-3xl/);
  });

  it("the whole info panel is one link (not just the small CTA), so hovering or clicking any part of it works", () => {
    // The panel itself carries href/target/rel now; there is exactly one
    // link per card (no separate nested CTA anchor).
    const anchorCount = (workSource.match(/<a\b/g) ?? []).length;
    expect(anchorCount).toBe(1);
    // The single <a> tag itself (not just somewhere later in the file) carries
    // both the case-study href and the work-card-glass class.
    const openingTag = workSource.match(/<a\b[^>]*>/s)?.[0];
    expect(openingTag, "expected exactly one <a ...> opening tag").toBeDefined();
    expect(openingTag).toMatch(/href=\{item\.cta\.href\}/);
    expect(openingTag).toMatch(/work-card-glass/);
    // target/rel are conditional now: external case studies open in a new
    // tab, but an in-site /work/<slug> page (see links.test.tsx) navigates
    // normally, so the literal attributes no longer always appear here.
    expect(openingTag).toMatch(/target: '_blank'/);
    expect(openingTag).toMatch(/rel: 'noreferrer'/);
  });

  it("drops the old hover-reveal arrow-in-a-circle (the site's own cursor expanding on hover replaces it)", () => {
    expect(workSource).not.toMatch(/↗/);
    expect(workSource).not.toMatch(/group-hover:opacity-100/);
  });

  it("the card's outer padding is close to symmetric top/bottom, so the card (and the panel centered inside it) doesn't read as shifted low in the viewport", () => {
    // Some top clearance is still needed for the fixed nav pill; this is not
    // perfectly symmetric, just much closer than the old pt-28/pb-8 (an 80px
    // gap between them). Verified against the actual nav height in the browser.
    expect(workSource).toMatch(/pb-10 pt-20 sm:px-5 sm:pb-16 sm:pt-24/);
    expect(workSource).not.toMatch(/pb-6 pt-24/);
  });

  it("the first card is visible immediately when the pinned section begins (no empty scroll gap before it)", () => {
    expect(workSource).toMatch(/isFirst/);
    expect(workSource).toMatch(/isFirst\s*\?\s*['"]0%['"]/);
  });

  it("\"Selected Work\" continues the white from \"What I do\" above it, before the sky-blue cards begin", () => {
    const rule = css.match(/#work \{([^}]*)\}/);
    expect(rule, "expected a #work rule").not.toBeNull();
    expect(rule![1]).toMatch(/#ffffff/);
    expect(rule![1]).toMatch(/rgba\(255,\s*255,\s*255,\s*0\)/);
  });

  it("keeps the last card's fade into the pale sky below it, for a smooth hand-off between cards", () => {
    expect(workSource).toMatch(/isLast/);
    expect(workSource).toMatch(/rgba\(234,\s*245,\s*255,\s*0\.95\)/);
  });
});
