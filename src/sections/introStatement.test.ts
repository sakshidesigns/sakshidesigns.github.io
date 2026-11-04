import { describe, expect, it } from "vitest";
import introSource from "./components/Intro.jsx?raw";
import { intro } from "./data";
import css from "./sections.css?raw";

describe('"What I do" statement', () => {
  it("reads the new statement, joined exactly, with the dash+\"shaping\" as one emphasis segment", () => {
    const joined = intro.heading.map((segment) => segment.text).join("");
    expect(joined).toBe(
      "I make sense of complicated products — shaping workflows, interfaces, and systems people can navigate naturally."
    );
    const dashSegment = intro.heading.find((segment) => segment.text.includes("shaping"));
    expect(dashSegment).toBeDefined();
    expect(dashSegment!.text).toBe("— shaping");
    expect(dashSegment!.emphasis).toBe(true);
  });

  it("marks nothing else in the sentence as emphasis", () => {
    intro.heading
      .filter((segment) => !segment.text.includes("shaping"))
      .forEach((segment) => expect(segment.emphasis, segment.text).toBe(false));
  });
});

describe('"What I do" section background and size', () => {
  it("gives #about its own background that starts at the hero's own fade colour and turns white", () => {
    const rule = css.match(/#about \{([^}]*)\}/);
    expect(rule, "expected an #about rule in sections.css").not.toBeNull();
    expect(rule![1]).toMatch(/#e8ecf1/);
    expect(rule![1]).toMatch(/#ffffff/);
  });

  it("stays solid white through its own end (Work carries the white forward, so there is no blue band between the two)", () => {
    const rule = css.match(/#about \{([^}]*)\}/)![1];
    expect(rule).toMatch(/#ffffff 100%/);
    expect(rule).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\)/);
  });

  it("has a little more vertical room above than before, but not drastically more", () => {
    expect(introSource).toMatch(/\bpt-36\b/);
    expect(introSource).toMatch(/sm:pt-48\b/);
    expect(introSource).not.toMatch(/pt-32\b/);
  });

  it("keeps the gap into Work noticeably smaller than the gap down from the hero", () => {
    expect(introSource).toMatch(/\bpb-16\b/);
    expect(introSource).toMatch(/sm:pb-24\b/);
  });
});
