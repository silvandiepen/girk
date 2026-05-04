// Girk SDK — build static sites from in-memory data
// Zero filesystem access. Pure functions.

export { build } from "./build";
export type {
  GirkBuildInput,
  GirkBuildResult,
  GirkInputFile,
  GirkInputAsset,
  GirkOutputFile,
  GirkOutputPage,
} from "./types";

// Re-export internal types for advanced usage
export type { File, Payload, Project, Settings, Meta } from "./types";
