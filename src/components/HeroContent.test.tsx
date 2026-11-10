// src/components/HeroContent.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroContent } from "./HeroContent";

describe("HeroContent", () => {
  it("renders the name", () => {
    render(<HeroContent />);
    expect(screen.getByText("Sakshi Haste")).toBeInTheDocument();
  });

  it("shows the greeting, role tagline and a one-line bio", () => {
    render(<HeroContent />);
    expect(screen.getByText("Hi, I'm")).toBeInTheDocument();
    expect(screen.getByText("UI/UX & Product Designer")).toBeInTheDocument();
    expect(screen.getByText("Designing for scalable, complex digital products.")).toBeInTheDocument();
  });

  it("shows Previously @ with the Accenture logo, as plain text rather than a card", () => {
    render(<HeroContent />);
    expect(screen.getByText(/previously @/i)).toBeInTheDocument();
    const logo = screen.getByAltText("Accenture");
    expect(logo).toHaveAttribute("src", "/accenture-navy.webp");
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
