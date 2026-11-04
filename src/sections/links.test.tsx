import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Work from "./components/Work";
import { work } from "./data";

describe("Work case-study buttons are real links", () => {
  it("every project has its own case-study URL in the data: an external https:// link, or an in-site /work/<slug> case-study page", () => {
    work.forEach((item) => {
      expect(item.cta.href, item.title).toMatch(/^(https:\/\/|\/work\/)/);
    });
  });

  it("an external case-study link opens in a new tab; an in-site one navigates normally (no target/rel)", () => {
    render(<Work />);
    const links = screen.getAllByRole("link", { name: /view case study/i });
    expect(links).toHaveLength(work.length);
    links.forEach((link, index) => {
      const href = work[index].cta.href;
      expect(link).toHaveAttribute("href", href);
      if (href.startsWith("/")) {
        expect(link).not.toHaveAttribute("target");
        expect(link).not.toHaveAttribute("rel");
      } else {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link.getAttribute("rel")).toMatch(/noreferrer/);
      }
    });
  });

  it("does not swallow the click (no dead '#' link)", () => {
    render(<Work />);
    screen.getAllByRole("link", { name: /view case study/i }).forEach((link) => {
      expect(link.getAttribute("href")).not.toBe("#");
    });
  });
});
