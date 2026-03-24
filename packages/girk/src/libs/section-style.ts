import type { Meta } from "@/types";

const SECTION_COLOR_TOKEN = /^[a-z0-9-]+$/i;

const normalizeStyleValue = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeColorToken = (value: unknown): string => {
  const token = normalizeStyleValue(value).toLowerCase();
  return SECTION_COLOR_TOKEN.test(token) ? token : "";
};

export const buildSectionStyle = (meta?: Meta): string => {
  if (!meta) return "";

  const rules: string[] = [];
  const color = normalizeColorToken(meta.color);
  const style = normalizeStyleValue(meta.style);

  if (color) {
    rules.push(`--section-background-color: var(--color-${color})`);
    rules.push(`--section-text-color: var(--color-${color}-contrast)`);
  }

  if (style) {
    rules.push(style.endsWith(";") ? style.slice(0, -1) : style);
  }

  return rules.join("; ");
};
