import { describe, expect, it } from "vitest";

import { buildCss, buildModeColorVariables, getContrastReference, getTextVariant } from "./compile";

const toRgb = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
};

const luminance = (hex: string): number => {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (first: string, second: string): number => {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const mix = (first: string, second: string, weight: number): string =>
  `#${toRgb(first)
    .map((channel, index) => Math.round(channel * weight + toRgb(second)[index] * (1 - weight)))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;

const DARK = "#0a0a0a";
const LIGHT = "#ffffff";

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

  it("does not apply the un-suffixed background and foreground to dark mode", () => {
    const colors = { background: "light", foreground: "dark" };
    const light = buildModeColorVariables(colors, "light");
    const dark = buildModeColorVariables(colors, "dark");

    expect(light).toContain("--color-background: var(--color-light);");
    expect(light).toContain("--color-foreground: var(--color-dark);");
    expect(dark).toContain("--color-background: var(--color-dark);");
    expect(dark).toContain("--color-foreground: var(--color-light);");
  });

  it("still applies explicit dark-mode surface overrides", () => {
    const dark = buildModeColorVariables(
      { background: "beige", backgroundDark: "brown", foregroundDark: "light" },
      "dark",
    );

    expect(dark).toContain("--color-background: var(--color-brown);");
    expect(dark).toContain("--color-foreground: var(--color-light);");
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
    expect(compactCss).not.toContain(".header:has(.navigation--mobile-open)");
    expect(compactCss).toContain(
      '.header::before{content:"";position:absolute;inset:0;z-index:-1;background-color:var(--color-background);backdrop-filter:blur(18px)}',
    );
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

describe("getContrastReference", () => {
  const palette = {
    red: "#c44747",
    blue: "#3f63dd",
    green: "#3f8f5b",
    yellow: "#d1ab36",
    orange: "#d57b28",
    purple: "#7655d8",
    pink: "#d668a4",
    lime: "#8bab2a",
    brown: "#8c6343",
    gray: "#767676",
    magenta: "#b64cb0",
    beige: "#d7c1a2",
  };

  it.each([
    ["#d1ab36", "var(--color-dark)"],
    ["#3f8f5b", "var(--color-dark)"],
    ["#3f63dd", "var(--color-light)"],
    ["#d57b28", "var(--color-dark)"],
    ["#8bab2a", "var(--color-dark)"],
    ["#767676", "var(--color-light)"],
  ])("picks the higher-contrast text colour for %s", (value, expected) => {
    expect(getContrastReference(value, DARK, LIGHT)).toBe(expected);
  });

  it.each(Object.entries(palette))("gives %s (%s) text of at least 4.5:1", (_name, value) => {
    const text = getContrastReference(value, DARK, LIGHT) === "var(--color-dark)" ? DARK : LIGHT;
    const other = text === DARK ? LIGHT : DARK;

    expect(contrast(value, text)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value, text)).toBeGreaterThanOrEqual(contrast(value, other));
  });

  it("uses the configured dark and light colours", () => {
    expect(getContrastReference("#767676", "#000000", "#bbbbbb")).toBe("var(--color-dark)");
  });

  it("falls back to light text for unparseable values", () => {
    expect(getContrastReference("var(--brand)", DARK, LIGHT)).toBe("var(--color-light)");
  });
});

describe("getTextVariant", () => {
  const resolve = (variant: string, value: string, foreground: string): string => {
    if (variant === "var(--color-primary)") return value;
    const match = variant.match(/var\(--color-primary\) (\d+)%, var\(--color-foreground\)/);
    if (!match) return foreground;
    return mix(value, foreground, Number(match[1]) / 100);
  };

  it("keeps the colour when it already reaches 4.5:1", () => {
    expect(getTextVariant("primary", "#3f63dd", LIGHT, DARK)).toBe("var(--color-primary)");
  });

  it.each([
    ["light", "#c44747", LIGHT, DARK],
    ["dark", "#c44747", DARK, LIGHT],
    ["dark", "#3f63dd", DARK, LIGHT],
  ])("lifts a %s-mode link colour %s to at least 4.5:1", (_mode, value, background, foreground) => {
    const variant = getTextVariant("primary", value, background, foreground);
    const text = resolve(variant, value, foreground);

    expect(variant).not.toBe("var(--color-primary)");
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(text, mix(text, background, 0.07))).toBeGreaterThanOrEqual(4.5);
  });

  it("emits text variants for primary and secondary per mode", () => {
    const dark = buildModeColorVariables(null, "dark");

    expect(dark).toMatch(
      /--color-primary-text: color-mix\(in srgb, var\(--color-primary\) \d+%, var\(--color-foreground\)\);/,
    );
    expect(dark).toContain("--color-secondary-text:");
  });
});
