import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCards } from "./SummaryCards";

describe("SummaryCards", () => {
  it("renders the summary as a labelled list of three cards", () => {
    render(<SummaryCards />);
    const list = screen.getByRole("list", { name: "Summary" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows the confirmed summary copy", () => {
    render(<SummaryCards />);
    expect(screen.getByText("Currently focused on")).toBeInTheDocument();
    expect(screen.getByText("AI-powered experiences")).toBeInTheDocument();
    expect(screen.getByText("Based in")).toBeInTheDocument();
    expect(screen.getByText("Pune, India")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("3+ Years")).toBeInTheDocument();
    expect(screen.getByText("AI products, SaaS and digital platforms")).toBeInTheDocument();
  });

  it("hides decorative icons from assistive tech", () => {
    const { container } = render(<SummaryCards />);
    const icons = container.querySelectorAll(".summary-card-icon");
    expect(icons).toHaveLength(3);
    icons.forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });
});
