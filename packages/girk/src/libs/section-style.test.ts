import { describe, expect, it } from "vitest";

import { buildSectionStyle } from "./section-style";

describe("section style helper", () => {
  it("maps a color token to section CSS variables", () => {
    expect(buildSectionStyle({ color: "blue" })).toBe(
      "--section-background-color: var(--color-blue); --section-text-color: var(--color-blue-contrast)"
    );
  });

  it("merges color tokens with custom inline styles", () => {
    expect(
      buildSectionStyle({
        color: "primary",
        style: "scroll-margin-top: 5rem;",
      })
    ).toBe(
      "--section-background-color: var(--color-primary); --section-text-color: var(--color-primary-contrast); scroll-margin-top: 5rem"
    );
  });

  it("ignores invalid color tokens and keeps plain style overrides", () => {
    expect(
      buildSectionStyle({
        color: "var(--color-blue)",
        style: "border-radius: 1rem",
      })
    ).toBe("border-radius: 1rem");
  });
});
