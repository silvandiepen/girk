// Girk SDK — build static sites from in-memory data
// Zero filesystem access. Pure functions.

export { build } from "./build";
export { renderEjs } from "./libs/render";
export { setFetchImpl } from "./libs/fetch";
export type { FetchFn } from "./libs/fetch";
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
