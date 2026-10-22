import { File, Meta } from "../types";
import { camelCase } from "@sil/case";
import { join } from "@/libs/path-utils";
import { getStringFromTag, removeTag } from "@/libs/utils";

export const removeTitle = (input: string): string => removeTag(input, "h1");

const stripGeneratedHeadingAnchors = (input: string): string =>
  input.replace(/<a\b[^>]*class="[^"]*\bheading-anchor\b[^"]*"[^>]*>.*?<\/a>/gi, "");

const stripHtml = (input: string): string => input.replace(/<[^>]+>/g, "").trim();

export const getTitle = (input: string): string =>
  stripHtml(stripGeneratedHeadingAnchors(getStringFromTag(input, "h1")));

export const fileTitle = (file: File): string => getTitle(file.html) || file.name;

export const getExcerpt = (file: File): string => getStringFromTag(file.html ? file.html : "", "p");

/*
 * Plain-text summary of the page's first paragraph, for the meta description
 * of pages that don't set one.
 */
export const getDescription = (file: File, length = 160): string => {
  const text = getExcerpt(file)
    .replace(/<[^>]*>/g, "")
    // The template escapes the text again, so decode the entities first.
    .replace(
      /&(amp|lt|gt|quot|#39);/g,
      (_, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[entity as string],
    )
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
};

export const isHidden = (meta?: Meta): boolean => meta?.hide === true || meta?.hide === "true";

export const flattenObject = (
  obj: Record<string, unknown>,
  prevKey = "",
): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenObject(value as Record<string, unknown>, join(prevKey, key, "-")),
      );
    } else {
      flattened[camelCase(join(prevKey, key, "-"), { exclude: [":"] })] = value;
    }
  });

  return flattened;
};
