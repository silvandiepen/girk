import {
  createColorSet,
  cssVariables,
  ColorType,
  ColorData,
} from "@sil/colorset";
import { readFile } from "fs/promises";
import { join } from "path";

export const loadStyling = async (path: string): Promise<string> => {
  const data = await readFile(path).then((res: any) => res.toString());
  return data;
};

const isColorToken = (key: string): boolean => !key.match(/-(h|s|l|a)$/);

const createColorAliases = (data: Record<string, unknown>): string => {
  const keys = Object.keys(data).filter(isColorToken);
  const aliases = keys.map((key) => `--color-${key}: var(--${key});`);
  const contrastAliases = keys
    .filter((key) => !key.endsWith("-text"))
    .map((key) => `--color-${key}-contrast: var(--color-${key}-text);`);

  return [...aliases, ...contrastAliases].join("");
};

export const buildCss = async (colors: ColorData | null) => {
  const stylingPath = join(__dirname, "../../../dist/style/app.css");

  const baseColors = {
    dark: "#0a0a0a",
    light: "#ffffff",
    primary: "rgb(26, 26, 26)",
    secondary: "rgb(118, 118, 118)",
    ...(colors || {}),
  };

  const darkData = await createColorSet({
    data: baseColors,
    mix: [baseColors.dark, baseColors.light],
    shades: [10, 30, 60, 90],
    type: ColorType.HSLA,
    keepSaturation: true,
  });
  const lightData = await createColorSet({
    data: baseColors,
    mix: [baseColors.light, baseColors.dark],
    shades: [10, 30, 60, 90],
    type: ColorType.HSLA,
    keepSaturation: true,
  });

  const darkMode = cssVariables({ data: darkData }) + createColorAliases(darkData);
  const lightMode =
    cssVariables({ data: lightData }) + createColorAliases(lightData);

  const styleData = await loadStyling(stylingPath);

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
