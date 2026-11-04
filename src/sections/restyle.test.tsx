import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BurstHeading from "./components/BurstHeading";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import Intro from "./components/Intro";
import Work from "./components/Work";
import { experience, work } from "./data";

describe("lifted sections sit on the sky", () => {
  it("have no opaque white/ink section backgrounds", () => {
    for (const [container, selector] of [
      [render(<Intro />).container, "#about"],
      [render(<Work />).container, "#work"],
      [render(<Experience />).container, "#experience"],
      [render(<Footer />).container, "#contact"],
    ] as const) {
      const root = container.querySelector(selector) as HTMLElement;
      expect(root, selector).not.toBeNull();
      expect(root.className, selector).not.toMatch(/\bbg-white\b/);
      expect(root.className, selector).not.toMatch(/\bbg-ink\b/);
    }
  });

  it("uses the serif display font for section headings", () => {
    const { container: burst } = render(<BurstHeading eyebrow="e" title="a title" subtitle="a subtitle" />);
    expect(burst.querySelector("h2")).toHaveClass("font-serif");
    const { container: footer } = render(<Footer />);
    expect(footer.querySelector("h2")).toHaveClass("font-serif");
  });

  it("puts realistic (compact) clouds in every Work card", () => {
    const { container } = render(<Work />);
    expect(container.querySelectorAll(".sky-clouds-compact")).toHaveLength(work.length);
  });

  it("says 3+ years, never 4+", () => {
    expect(experience.subheading).toMatch(/three\+ years/i);
    expect(experience.subheading).not.toMatch(/four\+/i);
  });
});
