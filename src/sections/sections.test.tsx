import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Graphics from "./components/Graphics";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import Intro from "./components/Intro";
import ScrollProgress from "./components/ScrollProgress";
import Work from "./components/Work";
import Writing from "./components/Writing";
import { footer, graphics, profile, testimonials, work, writing } from "./data";

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

  it("Graphics shows its wavy heading and every picture", () => {
    const { container } = render(<Graphics />);
    expect(container.querySelector("#graphics")).not.toBeNull();
    expect(screen.getByRole("heading", { name: graphics.heading })).toBeInTheDocument();
    graphics.items.forEach((item) => expect(screen.getAllByAltText(item.alt).length).toBeGreaterThan(0));
  });

  it("Testimonials shows one quote at a time and the arrows move between them", async () => {
    render(<Testimonials />);
    const [first, second] = testimonials.items;
    expect(screen.getByText(first.quote)).toBeInTheDocument();
    expect(screen.queryByText(second.quote)).toBeNull(); // one at a time
    fireEvent.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(await screen.findByText(second.quote)).toBeInTheDocument();
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
