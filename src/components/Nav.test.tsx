import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav } from "./Nav";

describe("Nav", () => {
  it("links to the four page sections in order", () => {
    render(<Nav />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Work", "About", "Experience", "Contact"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#work", "#about", "#experience", "#contact"]);
  });
});
