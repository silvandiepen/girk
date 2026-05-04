// Media helpers that don't require filesystem access

import { File } from "@/types";

export const getThumbnail = (file: File): string | null => {
  const thumb = file.meta?.thumbnail || file.meta?.thumb;
  const image = file.meta?.image;
  return thumb || image || null;
};

export const getSvgThumbnail = async (thumb: string): Promise<string> => {
  // In SDK mode, SVG data comes from input assets, not filesystem
  // Return empty string — SDK consumers provide SVG content via media input
  return "";
};
