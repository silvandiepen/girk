import { readFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";

export type ColorConfig = Record<string, string>;

type Mode = "light" | "dark";

const DEFAULT_THEME = {
  dark: "#0a0a0a",
  light: "#ffffff",
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
} as const;

const PALETTE_KEYS = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "lime",
  "brown",
  "gray",
  "magenta",
  "beige",
] as const;

const SEMANTIC_KEYS = [
  "primary",
  "secondary",
  "background",
  "foreground",
  "error",
  "info",
  "warning",
  "success",
] as const;

// Semantic colours that are also used as text (links, link hover) and get a
// per-mode `--color-<key>-text` variant that is guaranteed to be readable.
const TEXT_VARIANT_KEYS = ["primary", "secondary"] as const;

type ThemeKey = keyof typeof DEFAULT_THEME;
type PaletteKey = (typeof PALETTE_KEYS)[number];
type SemanticKey = (typeof SEMANTIC_KEYS)[number];
type SemanticAssignment = Record<SemanticKey, string>;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const loadStyling = async (path: string): Promise<string> => {
  const data = await readFile(path).then((res: Buffer) => res.toString());
  return data;
};

const requireFromHere = createRequire(__filename);

const loadInstalledNizelStyle = async (): Promise<string> => {
  try {
    const stylePath = requireFromHere.resolve("nizel-style");
    return await loadStyling(stylePath);
  } catch {
    return "";
  }
};

const normalizeKey = (key: string): string => key.toLowerCase().replace(/^palette/, "");

const hslToRgb = (hue: number, saturation: number, lightness: number): [number, number, number] => {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const h = hue / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 1) [r, g, b] = [c, x, 0];
  else if (h < 2) [r, g, b] = [x, c, 0];
  else if (h < 3) [r, g, b] = [0, c, x];
  else if (h < 4) [r, g, b] = [0, x, c];
  else if (h < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
};

const parseHexColor = (value: string): [number, number, number] | null => {
  const hex = value.replace("#", "").trim();
  if (![3, 6].includes(hex.length)) return null;

  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
};

const parseRgbColor = (value: string): [number, number, number] | null => {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const channels = match[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => parseFloat(channel.trim()));

  if (channels.some((channel) => Number.isNaN(channel))) return null;

  return [channels[0], channels[1], channels[2]].map((channel) =>
    clamp(Math.round(channel), 0, 255),
  ) as [number, number, number];
};

const parseHslColor = (value: string): [number, number, number] | null => {
  const match = value.match(/hsla?\(([^)]+)\)/i);
  if (!match) return null;

  const channels = match[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => channel.trim());
  if (channels.length < 3) return null;

  const hue = parseFloat(channels[0].replace("deg", ""));
  const saturation = parseFloat(channels[1].replace("%", ""));
  const lightness = parseFloat(channels[2].replace("%", ""));

  if ([hue, saturation, lightness].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return hslToRgb(hue, saturation, lightness);
};

const parseColor = (value: string): [number, number, number] | null => {
  return parseHexColor(value) || parseRgbColor(value) || parseHslColor(value) || null;
};

const MIN_TEXT_CONTRAST = 4.5;

// Inline code inside a link is tinted with the link colour (nizel mixes 7% of
// currentColor into the code background), so text variants are checked
// against that tint as well as the plain background.
const CODE_TINT = 0.07;

const getRelativeLuminance = ([red, green, blue]: [number, number, number]): number => {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const getContrastRatio = (
  first: [number, number, number],
  second: [number, number, number],
): number => {
  const a = getRelativeLuminance(first);
  const b = getRelativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// Mirrors `color-mix(in srgb, first weight, second)`.
const mixRgb = (
  first: [number, number, number],
  second: [number, number, number],
  weight: number,
): [number, number, number] =>
  first.map((channel, index) => Math.round(channel * weight + second[index] * (1 - weight))) as [
    number,
    number,
    number,
  ];

const DEFAULT_DARK_RGB: [number, number, number] = [10, 10, 10];
const DEFAULT_LIGHT_RGB: [number, number, number] = [255, 255, 255];

// Picks whichever of the dark and light theme colours gives the higher WCAG
// contrast ratio against `value`.
export const getContrastReference = (
  value: string,
  darkColor: string,
  lightColor: string,
): string => {
  const rgb = parseColor(value);
  if (!rgb) return "var(--color-light)";

  const dark = parseColor(darkColor) || DEFAULT_DARK_RGB;
  const light = parseColor(lightColor) || DEFAULT_LIGHT_RGB;

  return getContrastRatio(rgb, dark) > getContrastRatio(rgb, light)
    ? "var(--color-dark)"
    : "var(--color-light)";
};

// Returns a text-safe variant of a semantic colour for the given mode: the
// colour itself when it reaches 4.5:1 against the background, otherwise the
// smallest mix towards the foreground that does.
export const getTextVariant = (
  key: string,
  value: string,
  background: string,
  foreground: string,
): string => {
  const reference = `var(--color-${key})`;
  const rgb = parseColor(value);
  const backgroundRgb = parseColor(background);
  const foregroundRgb = parseColor(foreground);
  if (!rgb || !backgroundRgb || !foregroundRgb) return reference;

  const passes = (candidate: [number, number, number]): boolean =>
    getContrastRatio(candidate, backgroundRgb) >= MIN_TEXT_CONTRAST &&
    getContrastRatio(candidate, mixRgb(candidate, backgroundRgb, CODE_TINT)) >= MIN_TEXT_CONTRAST;

  if (passes(rgb)) return reference;

  for (let weight = 95; weight > 0; weight -= 5) {
    if (passes(mixRgb(rgb, foregroundRgb, weight / 100))) {
      return `color-mix(in srgb, ${reference} ${weight}%, var(--color-foreground))`;
    }
  }

  return "var(--color-foreground)";
};

const buildPalette = (colors: ColorConfig | null): Record<ThemeKey | PaletteKey, string> => {
  const overrides = Object.entries(colors || {}).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    },
    {},
  );

  return {
    ...DEFAULT_THEME,
    dark: overrides.dark || DEFAULT_THEME.dark,
    light: overrides.light || DEFAULT_THEME.light,
    red: overrides.red || DEFAULT_THEME.red,
    blue: overrides.blue || DEFAULT_THEME.blue,
    green: overrides.green || DEFAULT_THEME.green,
    yellow: overrides.yellow || DEFAULT_THEME.yellow,
    orange: overrides.orange || DEFAULT_THEME.orange,
    purple: overrides.purple || DEFAULT_THEME.purple,
    pink: overrides.pink || DEFAULT_THEME.pink,
    lime: overrides.lime || DEFAULT_THEME.lime,
    brown: overrides.brown || DEFAULT_THEME.brown,
    gray: overrides.gray || DEFAULT_THEME.gray,
    magenta: overrides.magenta || DEFAULT_THEME.magenta,
    beige: overrides.beige || DEFAULT_THEME.beige,
  };
};

const resolveToken = (
  token: string,
  source: Record<string, string>,
  stack = new Set<string>(),
): string => {
  const key = token.trim().toLowerCase();
  if (!source[key]) return token;
  if (stack.has(key)) return source[key];

  stack.add(key);
  const resolved = resolveToken(source[key], source, stack);
  stack.delete(key);

  return resolved;
};

const resolveReference = (
  token: string,
  source: Record<string, string>,
  stack = new Set<string>(),
): string => {
  const key = token.trim().toLowerCase();
  if (!source[key]) return token;
  if (stack.has(key)) return key;

  const next = source[key].trim().toLowerCase();
  if (!source[next]) return key;

  stack.add(key);
  const resolved = resolveReference(next, source, stack);
  stack.delete(key);

  return resolved;
};

const SURFACE_DEFAULTS: Record<"background" | "foreground", Record<Mode, string>> = {
  background: { light: "light", dark: "dark" },
  foreground: { light: "dark", dark: "light" },
};

// The un-suffixed `background` / `foreground` overrides describe the light
// theme. Dark mode only changes them through `backgroundDark` /
// `foregroundDark`, otherwise both modes would resolve to the same colours and
// the colour-mode toggle would do nothing.
const resolveSurface = (
  overrides: Record<string, string>,
  key: "background" | "foreground",
  mode: Mode,
): string =>
  overrides[`${key}${mode}`] ||
  (mode === "light" ? overrides[key] : "") ||
  SURFACE_DEFAULTS[key][mode];

const buildSemanticColors = (
  colors: ColorConfig | null,
  mode: Mode,
  palette: Record<ThemeKey | PaletteKey, string>,
): Record<ThemeKey | PaletteKey | SemanticKey, string> => {
  const overrides = Object.entries(colors || {}).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    },
    {},
  );

  const raw = {
    ...palette,
    primary: overrides.primary || "red",
    secondary: overrides.secondary || "blue",
    error: overrides.error || "red",
    info: overrides.info || "blue",
    warning: overrides.warning || "orange",
    success: overrides.success || "green",
    background: resolveSurface(overrides, "background", mode),
    foreground: resolveSurface(overrides, "foreground", mode),
  } as Record<string, string>;

  return Object.keys(raw).reduce<Record<string, string>>((result, key) => {
    result[key] = resolveToken(raw[key], raw);
    return result;
  }, {}) as Record<ThemeKey | PaletteKey | SemanticKey, string>;
};

const buildSemanticAssignments = (colors: ColorConfig | null, mode: Mode): SemanticAssignment => {
  const overrides = Object.entries(colors || {}).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    },
    {},
  );

  return {
    primary: overrides.primary || "red",
    secondary: overrides.secondary || "blue",
    error: overrides.error || "red",
    info: overrides.info || "blue",
    warning: overrides.warning || "orange",
    success: overrides.success || "green",
    background: resolveSurface(overrides, "background", mode),
    foreground: resolveSurface(overrides, "foreground", mode),
  };
};

export const createColorVariables = (
  colors: Record<ThemeKey | PaletteKey | SemanticKey, string>,
  semanticAssignments?: SemanticAssignment,
): string => {
  const paletteKeys = ["dark", "light", ...PALETTE_KEYS] as const;
  const paletteVariables = paletteKeys.flatMap((key) => {
    const value = colors[key];
    const contrast = getContrastReference(value, colors.dark, colors.light);

    return [`--color-${key}: ${value};`, `--color-${key}-contrast: ${contrast};`];
  });

  const semanticVariables = SEMANTIC_KEYS.flatMap((key) => {
    const value = colors[key];
    const assignment = semanticAssignments?.[key];
    const reference = assignment
      ? resolveReference(assignment, colors as Record<string, string>)
      : "";
    const hasReference = Boolean(reference) && reference in colors;
    const variableValue = hasReference ? `var(--color-${reference})` : value;
    const contrast = hasReference
      ? `var(--color-${reference}-contrast)`
      : getContrastReference(value, colors.dark, colors.light);

    return [`--color-${key}: ${variableValue};`, `--color-${key}-contrast: ${contrast};`];
  });

  const textVariables = TEXT_VARIANT_KEYS.map(
    (key) =>
      `--color-${key}-text: ${getTextVariant(
        key,
        colors[key],
        colors.background,
        colors.foreground,
      )};`,
  );

  return [...paletteVariables, ...semanticVariables, ...textVariables].join("");
};

export const buildModeColorVariables = (colors: ColorConfig | null, mode: Mode): string => {
  const palette = buildPalette(colors);
  const semanticAssignments = buildSemanticAssignments(colors, mode);

  return createColorVariables(buildSemanticColors(colors, mode, palette), semanticAssignments);
};

export const buildCss = async (colors: ColorConfig | null) => {
  const stylingPath = join(__dirname, "../../../dist/style/app.css");
  const styleData = await loadStyling(stylingPath);
  const nizelStyle = await loadInstalledNizelStyle();
  const lightMode = buildModeColorVariables(colors, "light");
  const darkMode = buildModeColorVariables(colors, "dark");

  const findDarkmodeDev = `content: "[DARKMODE]";`;
  const findLightmodeDev = `content: "[LIGHTMODE]";`;
  const findDarkmodeProd = `content:"[DARKMODE]"`;
  const findLightmodeProd = `content:"[LIGHTMODE]"`;

  return `${styleData}\n${nizelStyle}`
    .replaceAll(findDarkmodeDev, `${darkMode}`)
    .replaceAll(findLightmodeDev, `${lightMode}`)
    .replaceAll(findDarkmodeProd, `${darkMode}`)
    .replaceAll(findLightmodeProd, `${lightMode}`);
};
