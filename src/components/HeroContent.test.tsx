// src/components/HeroContent.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroContent } from "./HeroContent";

describe("HeroContent", () => {
  it("renders the name", () => {
    render(<HeroContent />);
    expect(screen.getByText("Sakshi Haste")).toBeInTheDocument();
  });

  it("shows the greeting, role tagline and a one-sentence bio", () => {
    render(<HeroContent />);
    expect(screen.getByText("Hi, I'm")).toBeInTheDocument();
    expect(screen.getByText("UI/UX & Product Designer")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Designing clear, thoughtful digital experiences across product, UX and visual design."
      )
    ).toBeInTheDocument();
  });

  it("links the Resume button to the PDF, opened in a new tab", () => {
    render(<HeroContent />);
    const link = screen.getByRole("link", { name: /resume/i });
    expect(link).toHaveAttribute("href", "/resume.pdf");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("links Let's Talk to the contact section, not straight to a mailto", () => {
    render(<HeroContent />);
    const link = screen.getByRole("link", { name: /let's talk/i });
    expect(link).toHaveAttribute("href", "#contact");
  });
});
