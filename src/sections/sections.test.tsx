import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import Intro from "./components/Intro";
import ScrollProgress from "./components/ScrollProgress";
import Work from "./components/Work";
import Writing from "./components/Writing";
import { experience, footer, profile, work, writing } from "./data";

describe("lifted sections render", () => {
  it("Intro shows its eyebrow and the full statement", () => {
    const { container } = render(<Intro />);
    expect(container.querySelector("#about")).not.toBeNull();
    expect(screen.getByText("What I do")).toBeInTheDocument();
    expect(container.querySelector("p")?.textContent).toContain("shaping");
  });

  it("Work shows its heading and every project", () => {
    const { container } = render(<Work />);
    expect(container.querySelector("#work")).not.toBeNull();
    expect(screen.getByText("Selected Work")).toBeInTheDocument();
    work.forEach((item) => expect(screen.getByText(item.title)).toBeInTheDocument());
  });

  it("Experience shows every company", () => {
    render(<Experience />);
    experience.items.forEach((item) => expect(screen.getByText(item.company)).toBeInTheDocument());
  });

  it("Footer shows the contact email link, pre-filled so it doesn't open a blank compose window, and the watermark", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("#contact")).not.toBeNull();
    const link = screen.getByRole("link", { name: profile.email });
    const href = link.getAttribute("href")!;
    expect(href.startsWith(`mailto:${profile.email}?`)).toBe(true);
    expect(href).toMatch(/subject=/);
    expect(screen.getByText(footer.watermark)).toBeInTheDocument();
  });

  it("ScrollProgress renders", () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstChild).not.toBeNull();
  });

  it("Writing shows the article's title and both working links", () => {
    const { container } = render(<Writing />);
    expect(container.querySelector("#writing")).not.toBeNull();
    const [item] = writing;
    expect(screen.getByText(item.title)).toBeInTheDocument();
    const behanceLink = screen.getByRole("link", { name: /view on behance/i });
    expect(behanceLink).toHaveAttribute("href", item.behanceHref);
    expect(behanceLink).toHaveAttribute("target", "_blank");
    const mediumLink = screen.getByRole("link", { name: /read on medium/i });
    expect(mediumLink).toHaveAttribute("href", item.mediumHref);
    expect(mediumLink).toHaveAttribute("target", "_blank");
  });
});
