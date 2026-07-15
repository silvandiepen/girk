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
      "light"
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
      "light"
    );

    expect(variables).toContain("--color-background: var(--color-beige);");
  });

  it("appends the installed nizel-style stylesheet after the bundled app stylesheet", async () => {
    const css = await buildCss(null);

    const compactCss = css.replace(/\s+/g, "");

    expect(compactCss).toContain("text-indent:100%");
    expect(compactCss).toContain("font-size:0.8em");
    expect(compactCss).toContain(".header:has(.navigation--mobile-open){backdrop-filter:none}");
    expect(compactCss).toContain("display:flex;overflow-y:auto;-webkit-overflow-scrolling:touch");
    expect(compactCss).toContain("opacity:0;visibility:hidden;clip-path:inset(00100%0);pointer-events:none");
    expect(compactCss).toContain("clip-path.24scubic-bezier(0.22,1,0.36,1)");
    expect(compactCss).toContain("view-transition-name:none");
    expect(compactCss).toContain("navigation__mobile-toggle[aria-expanded=true].navigation__mobile-toggle-icon{background-color:rgba(0,0,0,0)}");
    expect(compactCss).toContain("navigation__mobile-toggle[aria-expanded=true].navigation__mobile-toggle-icon::before{transform:translateY(calc(var(--space)*0.375-var(--border-width-s)/2))rotate(45deg)}");
    expect(compactCss).toContain(
      "navigation--mobile-panel.navigation--mobile-open.navigation__list{opacity:1;visibility:visible;clip-path:inset(0000);pointer-events:auto;transition-delay:0s}",
    );
    expect(compactCss).toContain("navigation--mobile-panel.navigation--mobile-open.navigation__item{opacity:1;transform:translateY(0)}");
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
