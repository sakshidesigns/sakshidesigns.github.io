import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BehanceLink, CaseStudySlide, NextProjectCard } from "./CaseStudyKit";

describe("BehanceLink", () => {
  it("renders nothing when no href is given (projects without a Behance gallery)", () => {
    const { container } = render(<BehanceLink href={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("links out to Behance in a new tab when given an href", () => {
    render(<BehanceLink href="https://www.behance.net/gallery/123/Example" />);
    const link = screen.getByRole("link", { name: /behance/i });
    expect(link).toHaveAttribute("href", "https://www.behance.net/gallery/123/Example");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});

describe("NextProjectCard", () => {
  it("is a single clickable link carrying the title, description and thumbnail", () => {
    render(
      <NextProjectCard
        title="DataAssist"
        description="Designing an AI-powered experience for web and mobile."
        href="/work/dataassist"
        image="/dataassist-hero-laptop-phone.webp"
        imageAlt="DataAssist hero design shown on laptop and phone"
      />
    );
    const link = screen.getByRole("link", { name: /dataassist/i });
    expect(link).toHaveAttribute("href", "/work/dataassist");
    expect(screen.getByText(/designing an ai-powered experience/i)).toBeInTheDocument();
    const img = screen.getByAltText("DataAssist hero design shown on laptop and phone");
    expect(img).toHaveAttribute("src", "/dataassist-hero-laptop-phone.webp");
  });
});

describe('CaseStudySlide tone="sky"', () => {
  it("renders the hero's own sky gradient plus a drifting-clouds layer, not a flat tone colour", () => {
    const { container } = render(
      <CaseStudySlide index={0} activeIndex={0} reduce eyebrow="Next project" tone="sky">
        <p>Explore another case study</p>
      </CaseStudySlide>
    );
    const slide = container.firstElementChild as HTMLElement;
    expect(slide.className).toContain("card-sky-gradient");
    expect(container.querySelector(".sky-clouds")).not.toBeNull();
  });

  it("other tones render their flat background with no clouds layer", () => {
    const { container } = render(
      <CaseStudySlide index={0} activeIndex={0} reduce eyebrow="The problem" tone="light">
        <p>Body</p>
      </CaseStudySlide>
    );
    const slide = container.firstElementChild as HTMLElement;
    expect(slide.className).toContain("bg-white");
    expect(container.querySelector(".sky-clouds")).toBeNull();
  });
});
