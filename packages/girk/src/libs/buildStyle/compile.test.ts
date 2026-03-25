import { describe, expect, it } from "vitest";

import { buildModeColorVariables } from "./compile";

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
});
