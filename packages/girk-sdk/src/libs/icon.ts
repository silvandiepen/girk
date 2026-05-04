// Icon resolution for SDK mode
// In SDK mode, icons come from input assets, not filesystem

import { File, ResolvedIcon } from "@/types";

export const resolveFileIcons = async (files: File[]): Promise<File[]> => {
  // In SDK mode, icon resolution is handled differently:
  // - Icons provided via input assets are matched by path
  // - No filesystem checks needed
  // For now, return files as-is. Advanced icon resolution can be added later.
  return files;
};
