// Media helpers that don't require filesystem access

import { File } from "@/types";

export const getThumbnail = (file: File): string | null => {
  const thumb = file.meta?.thumbnail || file.meta?.thumb;
  const image = file.meta?.image;
  return thumb || image || null;
};
