import { readFile } from "fs/promises";
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

const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/^palette/, "");

const hslToRgb = (
  hue: number,
  saturation: number,
  lightness: number
): [number, number, number] => {
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

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
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
    clamp(Math.round(channel), 0, 255)
  ) as [number, number, number];
};

const parseHslColor = (value: string): [number, number, number] | null => {
  const match = value.match(/hsla?\(([^)]+)\)/i);
  if (!match) return null;

  const channels = match[1].split(",").slice(0, 3).map((channel) => channel.trim());
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
  return (
    parseHexColor(value) ||
    parseRgbColor(value) ||
    parseHslColor(value) ||
    null
  );
};

const getContrastReference = (
  value: string,
  darkColor: string,
  lightColor: string
): string => {
  const rgb = parseColor(value);
  if (!rgb) return "var(--color-light)";

  const [r, g, b] = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.55 || value === lightColor
    ? "var(--color-dark)"
    : value === darkColor
      ? "var(--color-light)"
      : "var(--color-light)";
};

const buildPalette = (colors: ColorConfig | null): Record<ThemeKey | PaletteKey, string> => {
  const overrides = Object.entries(colors || {}).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    },
    {}
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
  stack = new Set<string>()
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
  stack = new Set<string>()
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

const buildSemanticColors = (
  colors: ColorConfig | null,
  mode: Mode,
  palette: Record<ThemeKey | PaletteKey, string>
): Record<ThemeKey | PaletteKey | SemanticKey, string> => {
  const overrides = Object.entries(colors || {}).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    },
    {}
  );

  const raw = {
    ...palette,
    primary: overrides.primary || "red",
    secondary: overrides.secondary || "blue",
    error: overrides.error || "red",
    info: overrides.info || "blue",
    warning: overrides.warning || "orange",
    success: overrides.success || "green",
    background:
      overrides[`background${mode}`] ||
      overrides.background ||
      (mode === "dark" ? "dark" : "light"),
    foreground:
      overrides[`foreground${mode}`] ||
      overrides.foreground ||
      (mode === "dark" ? "light" : "dark"),
  } as Record<string, string>;

  return Object.keys(raw).reduce<Record<string, string>>((result, key) => {
    result[key] = resolveToken(raw[key], raw);
    return result;
  }, {}) as Record<ThemeKey | PaletteKey | SemanticKey, string>;
};

const buildSemanticAssignments = (
  colors: ColorConfig | null,
  mode: Mode
): SemanticAssignment => {
  const overrides = Object.entries(colors || {}).reduce<Record<string, string>>(
    (result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    },
    {}
  );

  return {
    primary: overrides.primary || "red",
    secondary: overrides.secondary || "blue",
    error: overrides.error || "red",
    info: overrides.info || "blue",
    warning: overrides.warning || "orange",
    success: overrides.success || "green",
    background:
      overrides[`background${mode}`] ||
      overrides.background ||
      (mode === "dark" ? "dark" : "light"),
    foreground:
      overrides[`foreground${mode}`] ||
      overrides.foreground ||
      (mode === "dark" ? "light" : "dark"),
  };
};

export const createColorVariables = (
  colors: Record<ThemeKey | PaletteKey | SemanticKey, string>,
  semanticAssignments?: SemanticAssignment
): string => {
  const paletteKeys = ["dark", "light", ...PALETTE_KEYS] as const;
  const paletteVariables = paletteKeys.flatMap((key) => {
    const value = colors[key];
    const contrast = getContrastReference(
      value,
      colors.dark,
      colors.light
    );

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

  return [...paletteVariables, ...semanticVariables].join("");
};

export const buildModeColorVariables = (
  colors: ColorConfig | null,
  mode: Mode
): string => {
  const palette = buildPalette(colors);
  const semanticAssignments = buildSemanticAssignments(colors, mode);

  return createColorVariables(
    buildSemanticColors(colors, mode, palette),
    semanticAssignments
  );
};

export const buildCss = async (colors: ColorConfig | null) => {
  const stylingPath = join(__dirname, "../../../dist/style/app.css");
  const styleData = await loadStyling(stylingPath);
  const lightMode = buildModeColorVariables(colors, "light");
  const darkMode = buildModeColorVariables(colors, "dark");

  const findDarkmodeDev = `content: "[DARKMODE]";`;
  const findLightmodeDev = `content: "[LIGHTMODE]";`;
  const findDarkmodeProd = `content:"[DARKMODE]"`;
  const findLightmodeProd = `content:"[LIGHTMODE]"`;

  return styleData
    .replaceAll(findDarkmodeDev, `${darkMode}`)
    .replaceAll(findLightmodeDev, `${lightMode}`)
    .replaceAll(findDarkmodeProd, `${darkMode}`)
    .replaceAll(findLightmodeProd, `${lightMode}`);
};
