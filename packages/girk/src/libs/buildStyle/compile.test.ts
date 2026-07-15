import { describe, expect, it } from "vitest";

import { buildCss, buildModeColorVariables } from "./compile";

describe("buildStyle compile", () => {
  it("creates a minimal semantic color contract for light mode", () => {
    const variables = buildModeColorVariables(null, "light");

    expect(variables).toContain("--color-primary:");
    expect(variables).toContain("--color-secondary:");
    expect(variables).toContain("--color-background:");
    expect(variables).toContain("--color-foreground:");
    expect(variables).toContain("--color-error:");
    expect(variables).toContain("--color-success:");
    expect(variables).toContain("--color-red:");
    expect(variables).toContain("--color-beige:");
    expect(variables).toContain("--color-primary-contrast:");
    expect(variables).not.toContain("--color-primary-10:");
    expect(variables).not.toContain("--primary-h:");
    expect(variables).toContain("--color-primary: var(--color-red);");
    expect(variables).toContain("--color-secondary: var(--color-blue);");
    expect(variables).toContain("--color-background: var(--color-light);");
    expect(variables).toContain("--color-foreground: var(--color-dark);");
  });

  it("resolves semantic colors from palette references", () => {
    const variables = buildModeColorVariables(
      {
        red: "#aa0000",
        primary: "red",
        background: "beige",
        beige: "#efe2cf",
      },
      "light",
    );

    expect(variables).toContain("--color-red: #aa0000;");
    expect(variables).toContain("--color-primary: var(--color-red);");
    expect(variables).toContain("--color-background: var(--color-beige);");
  });

  it("supports mode-specific background overrides", () => {
    const variables = buildModeColorVariables(
      {
        backgroundLight: "beige",
        backgroundDark: "dark",
        beige: "#efe2cf",
      },
      "light",
    );

    expect(variables).toContain("--color-background: var(--color-beige);");
  });

  it("appends the installed nizel-style stylesheet after the bundled app stylesheet", async () => {
    const css = await buildCss(null);

    const compactCss = css.replace(/\s+/g, "");

    expect(compactCss).toContain(
      ".nizel-code-copy__label{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}",
    );
    expect(compactCss).toContain("@media(hover:hover)and(pointer:fine)");
    expect(compactCss).toContain(".nizel-code-copy__button:hover.nizel-code-copy__label");
    expect(compactCss).not.toContain("text-indent:100%");
    expect(compactCss).toContain(".header:has(.navigation--mobile-open){backdrop-filter:none}");
    expect(compactCss).toContain("display:flex;overflow-y:auto;-webkit-overflow-scrolling:touch");
    expect(compactCss).toContain("opacity:0;visibility:hidden;pointer-events:none");
    expect(compactCss).toContain("transition:opacity.18sease,visibility0slinear.18s");
    expect(compactCss).toContain("view-transition-name:none");
    expect(compactCss).toContain(
      "navigation--mobile-panel.navigation--mobile-open.navigation__list{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}",
    );
    expect(compactCss).toContain(
      "navigation--header.navigation--mobile-panel.navigation__item--open>.navigation__panel,.navigation--header.navigation--mobile-panel.navigation__panel[data-state=open],.navigation--header.navigation--mobile-panel.navigation__panel[data-state=opening]{display:block;opacity:1;visibility:visible;transform:none}",
    );
    expect(compactCss).toContain("justify-content:flex-start");
    expect(compactCss).toContain(
      "padding:calc(var(--space-xxl)+var(--space-l))var(--space)var(--space-l)",
    );
    expect(compactCss).toContain("font-size:var(--font-size-l)");
    expect(css).toContain(".nizel-code-copy__button::before");
  });
});
