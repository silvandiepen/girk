import { Payload, Style } from "@/types";
import { buildCss, buildCssFromContent, ColorConfig } from "./compile";

export const getConfigColors = (
  config: Payload["settings"]["config"]
): ColorConfig | null => {
  if (!config) return null;
  const colors: ColorConfig = {};
  Object.keys(config).forEach((key: string) => {
    if (!key.startsWith("colors")) return null;
    colors[key.replace("colors", "").toLowerCase()] = config[key];
  });
  return colors;
};

export interface StyleResult {
  style: Style;
  cssContent: string;
}

/**
 * Generate styles and return them in-memory.
 * No filesystem writes — the caller receives the CSS string.
 *
 * @param payload  - Current build payload.
 * @param baseCss  - Pre-compiled base CSS string to inject colors into.
 *                    If omitted, only color variables are generated.
 */
export const generateStyles = async (
  payload: Payload,
  baseCss?: string
): Promise<Payload & { _sdkStyleResult?: StyleResult }> => {
  const colors = getConfigColors(payload.settings?.config);

  const styleSheet = baseCss
    ? buildCssFromContent(baseCss, colors)
    : await buildCss(colors);

  const style: Style = {
    path: "/style/app.css",
    sheet: "",
    add: "",
    page: "",
    og: "",
  };

  if (payload.project?.style) {
    style.add = payload.project.style.toString().replace(".scss", ".css");
  }

  if (payload.project?.styleOverrule) {
    style.path = payload.project.styleOverrule
      .toString()
      .replace(".scss", ".css");
  }

  return {
    ...payload,
    style,
    _sdkStyleResult: {
      style,
      cssContent: styleSheet,
    },
  };
};
