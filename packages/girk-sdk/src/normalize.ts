// Normalize GirkBuildInput to internal Payload
// Converts flat SDK input into the rich internal File objects

import { extname, basename } from "@/libs/path-utils";
import { asyncForEach } from "@/libs/utils";
import { fileId, isHomePath } from "@/libs/files";
import { getLangFromFilename } from "@/libs/language";
import { toHtml } from "@/libs/markdown";
import { prepareDataFiles } from "@/libs/data";
import { fileTitle } from "@/libs/helpers";
import { resolveFileIcons } from "@/libs/icon";
import { getThumbnail, getSvgThumbnail } from "@/libs/media";
import { extractMeta } from "@/libs/markdown-meta";
import { flattenObject } from "@/libs/helpers";
import { camelCase } from "@sil/case";
import {
  GirkBuildInput,
  File,
  Payload,
  Project,
  Settings,
  FileType,
} from "@/types";
import { languageKeys } from "@/data/language";

/**
 * Parse a virtual path into file metadata.
 * e.g. "/blog/post:nl.md" → { fileName: "post", name: "post", language: "nl", parent: "blog", ext: ".md" }
 */
const parseVirtualPath = (path: string, languages?: string[]) => {
  const extension = extname(path);
  const rawFileName = basename(path, extension);
  const lang =
    rawFileName.indexOf(":") > 0
      ? getLangFromFilename(rawFileName)
      : "en";
  const fileName = rawFileName.split(":")[0];
  const name = (
    fileName.toLowerCase() === "index" || fileName.toLowerCase() === "readme"
      ? path.split("/").filter(Boolean).slice(-2, -1)[0] || fileName
      : fileName
  ).toLowerCase();

  const pathSegments = path.split("/").filter(Boolean);
  // parent is the directory name (second to last segment, or empty for root)
  const parent = pathSegments.length > 1
    ? pathSegments[pathSegments.length - 2].toLowerCase()
    : undefined;

  const relativePath = path;

  return {
    id: fileId(relativePath),
    fileName,
    name,
    relativePath,
    path,
    ext: extension,
    language: lang,
    parent,
  };
};

/**
 * Build the Project config from SDK input config + file metadata.
 * Mirrors the logic in project.ts but without filesystem reads.
 */
const buildProjectData = (files: File[], config?: Record<string, unknown>): Project => {
  const project: Project = {};

  // Apply config-level project settings
  if (config) {
    const flatConfig = flattenObject(config as Record<string, unknown>);
    Object.keys(flatConfig).forEach((item) => {
      if (item.includes("project") && typeof item === "string") {
        const key = camelCase(item.replace("project", ""), { exclude: [":"] });
        if (key === "ignore") {
          project[key] = String(flatConfig[item])
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean);
        } else {
          project[key] = flatConfig[item];
        }
      }
    });
  }

  // File-level project overrides
  files.forEach((file) => {
    if (file.meta) {
      Object.keys(file.meta).forEach((item) => {
        if (item.includes("project") && typeof item === "string") {
          const key = camelCase(item.replace("project", ""), { exclude: [":"] });
          if (key === "ignore") {
            project[key] = String(file.meta[item])
              .split(",")
              .map((v: string) => v.trim())
              .filter(Boolean);
          } else {
            project[key] = file.meta[item];
          }
        }
      });
    }
  });

  // Fix types
  const fixedProject: Project = {};
  Object.keys(project).forEach((key: string) => {
    let value: any = project[key];
    if (value === "false" || value === false) value = false;
    else if (value === "true" || value === true) value = true;
    else if (
      typeof value === "string" &&
      !/\r|\n/.exec(value) &&
      value.split(",").length > 1
    ) {
      value = value.split(",").map((entry: string) => entry.trim()).filter(Boolean);
    }
    fixedProject[key] = value;
  });

  return fixedProject;
};

/**
 * Convert GirkBuildInput files to internal File[] with rendered HTML and metadata.
 */
const inputFilesToFiles = async (
  inputFiles: GirkBuildInput["files"],
  languages?: string[]
): Promise<File[]> => {
  const files: File[] = inputFiles.map((inputFile) => {
    const parsed = parseVirtualPath(inputFile.path, languages);
    return {
      id: parsed.id,
      fileName: parsed.fileName,
      name: parsed.name,
      path: parsed.path,
      relativePath: parsed.relativePath,
      ext: parsed.ext,
      language: parsed.language,
      parent: parsed.parent,
      created: inputFile.created || new Date(),
      data: inputFile.content,
      type: FileType.CONTENT,
    };
  });

  return files;
};

/**
 * Process files: render markdown, extract metadata, set titles, resolve icons.
 */
const processFiles = async (files: File[]): Promise<{ files: File[]; languages: string[] }> => {
  const languages: string[] = [];

  // Detect languages
  for (const file of files) {
    if (!languages.includes(file.language)) languages.push(file.language);
  }

  // Render markdown to HTML and extract metadata
  await asyncForEach(files, async (file: File, index: number) => {
    const rendered = await toHtml(file.data?.toString() ?? "", file.path);
    files[index] = {
      ...file,
      html: rendered.document,
      meta: rendered.meta,
    };
  });

  // Set home flag
  await asyncForEach(files, async (file: File, index: number) => {
    files[index].home = isHomePath(file.path);
  });

  // Set titles
  await asyncForEach(files, async (file: File, index: number) => {
    const title = file.meta?.title ? file.meta.title : fileTitle(file);
    files[index].title = title.toString();
  });

  // Resolve icons
  const resolvedFiles = await resolveFileIcons(files);

  // Set thumbnails
  await asyncForEach(resolvedFiles, async (file: File, index: number) => {
    const thumbnail = getThumbnail(file);
    const thumbnailSvg = thumbnail ? await getSvgThumbnail(thumbnail) : "";
    resolvedFiles[index].thumbnail = thumbnail;
    resolvedFiles[index].thumbnailSvg = thumbnailSvg;
  });

  return { files: resolvedFiles, languages };
};

/**
 * Normalize GirkBuildInput into an internal Payload object.
 */
export const normalize = async (
  input: GirkBuildInput,
  version: string
): Promise<Payload> => {
  // Convert input files to internal format
  let files = await inputFilesToFiles(input.files, input.languages);

  // Process data files (interpolation, etc.)
  files = await prepareDataFiles(files);

  // Render markdown and extract metadata
  const processed = await processFiles(files);

  // Build project config
  const project = buildProjectData(processed.files, input.config);

  // Filter ignored files
  if (project.ignore) {
    processed.files = processed.files.filter(
      (file) => !project.ignore.some((ignore) => file.path.includes(ignore))
    );
  }

  // Use explicit languages if provided, otherwise auto-detected
  const languages = (input.languages || processed.languages) as languageKeys[];

  // Build settings
  const settings: Settings = {
    output: "/virtual-output", // SDK doesn't write to disk, but some code references this
    languages,
    args: {},
    config: input.config || {},
  };

  // Build media from input assets
  const media: File[] = (input.media || []).map((asset) => {
    const parsed = parseVirtualPath(asset.path);
    return {
      id: parsed.id,
      fileName: parsed.fileName,
      name: parsed.name,
      path: asset.path,
      relativePath: asset.path,
      ext: parsed.ext,
      language: parsed.language,
      created: new Date(),
      data: asset.content,
      contentType: asset.contentType,
    };
  });

  return {
    output: settings.output,
    languages,
    args: {},
    config: input.config || {},
    files: processed.files,
    media,
    socials: [],
    settings,
    project,
    generator: {
      name: "Girk",
      version,
    },
  };
};
