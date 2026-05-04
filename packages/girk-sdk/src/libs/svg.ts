/**
 * In SDK mode, SVG data is provided directly rather than read from filesystem.
 * This module provides a helper to retrieve SVG data from an in-memory map.
 */

const svgContentMap = new Map<string, string>();

export const setSvgContent = (path: string, content: string): void => {
  svgContentMap.set(path, content);
};

export const clearSvgContent = (): void => {
  svgContentMap.clear();
};

export const getSVGData = async (svgPath: string): Promise<string> => {
  // Try exact match first
  if (svgContentMap.has(svgPath)) {
    return svgContentMap.get(svgPath) || "";
  }

  // Try matching just the filename portion
  for (const [key, value] of svgContentMap.entries()) {
    if (key.endsWith(svgPath) || svgPath.endsWith(key)) {
      return value;
    }
  }

  return "";
};

/**
 * Bulk register SVG content from a map of path → content.
 */
export const registerSvgContent = (entries: Record<string, string>): void => {
  Object.entries(entries).forEach(([path, content]) => {
    svgContentMap.set(path, content);
  });
};
