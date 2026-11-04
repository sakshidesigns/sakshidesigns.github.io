import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageLoader } from "./PageLoader";

describe("PageLoader", () => {
  it("shows the take-off caption and a plane icon rather than the old wordmark", () => {
    const { container } = render(<PageLoader progress={0} done={false} />);
    expect(screen.getByText("Preparing to take off")).toBeInTheDocument();
    expect(container.querySelector(".loader-plane-scene")).toBeInTheDocument();
    expect(container.querySelector(".page-loader-mark")).not.toBeInTheDocument();
  });

  it("announces loading politely and shows real progress on the bar", () => {
    const { container } = render(<PageLoader progress={0.4} done={false} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).not.toHaveAttribute("aria-hidden", "true");
    expect((container.querySelector(".page-loader-bar") as HTMLElement).style.transform).toBe("scaleX(0.4)");
  });

  it("keeps the bar within 0-100% however odd the reported progress", () => {
    const { container, rerender } = render(<PageLoader progress={-3} done={false} />);
    const bar = () => (container.querySelector(".page-loader-bar") as HTMLElement).style.transform;
    expect(bar()).toBe("scaleX(0)");
    rerender(<PageLoader progress={7} done={false} />);
    expect(bar()).toBe("scaleX(1)");
  });

  it("fades out and is hidden from assistive tech once done", () => {
    const { container } = render(<PageLoader progress={1} done />);
    const root = container.querySelector(".page-loader") as HTMLElement;
    expect(root).toHaveClass("is-done");
    expect(root).toHaveAttribute("aria-hidden", "true");
  });
});
