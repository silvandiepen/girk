// Data interpolation — SDK version
// No filesystem access. Remote data fetching via node-fetch is kept.

import fetch from "node-fetch";
import { basename, dirname, extname, join } from "node:path";

import { fileId } from "@/libs/files";
import { extractMeta } from "@/libs/markdown-meta";
import { nthIndex } from "@/libs/utils";
import { File, Meta } from "@/types";

const EACH_PATTERN = /\{\{#each result\}\}([\s\S]*?)\{\{\/each\}\}/g;
const VALUE_PATTERN = /\{\{\s*(result(?:\.[\w-]+)*)\s*\}\}/g;
const DATA_META_KEYS = ["dataSource", "dataItems", "dataSlug"];

const responseCache = new Map<string, Promise<unknown>>();

interface DataDefinition {
  source?: string;
  items?: string;
  slug?: string;
}

const splitPath = (path: string): string[] =>
  path
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

export const getValueByPath = (input: unknown, path = ""): unknown => {
  if (!path) return input;

  return splitPath(path).reduce<unknown>((value, part) => {
    if (value === null || value === undefined) return undefined;

    if (Array.isArray(value) && /^\d+$/.test(part)) {
      return value[parseInt(part, 10)];
    }

    if (typeof value === "object") {
      return (value as Record<string, unknown>)[part];
    }

    return undefined;
  }, input);
};

const stringifyValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
};

const interpolateValues = (
  template: string,
  context: Record<string, unknown>
): string =>
  template.replace(VALUE_PATTERN, (match, path: string) => {
    const value = getValueByPath(context, path);
    return value === undefined ? "" : stringifyValue(value);
  });

export const interpolateDataTemplate = (
  template: string,
  context: Record<string, unknown>
): string => {
  const repeated = template.replace(EACH_PATTERN, (_match, block: string) => {
    const result = context.result;
    if (!Array.isArray(result)) return "";

    return result
      .map((entry) => interpolateValues(block, { ...context, result: entry }))
      .join("");
  });

  return interpolateValues(repeated, context);
};

const stripDataMeta = (input: string): string => {
  const startLine = nthIndex(input, "---", 0);
  const endLine = nthIndex(input, "---", 1);

  if (startLine > -1 && startLine < 10 && endLine > -1) {
    const rawMeta = input.substring(startLine + 3, endLine);
    const nextMeta = rawMeta
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        if (!trimmed) return true;

        return !DATA_META_KEYS.some((key) => trimmed.startsWith(`${key}:`));
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    return `${input.substring(0, startLine + 3)}${nextMeta}${input.substring(endLine)}`;
  }

  return input;
};

const getDataDefinition = (meta: Meta): DataDefinition => ({
  source: typeof meta.dataSource === "string" ? meta.dataSource : undefined,
  items: typeof meta.dataItems === "string" ? meta.dataItems : undefined,
  slug: typeof meta.dataSlug === "string" ? meta.dataSlug : undefined,
});

const isRemoteSource = (source: string): boolean => /^https?:\/\//i.test(source);

const getSourceData = async (source: string): Promise<unknown> => {
  if (!isRemoteSource(source)) {
    // SDK mode: local file data sources are not supported.
    // Data should be pre-resolved and passed via GirkBuildInput.
    console.warn(`[girk-sdk] Local dataSource "${source}" not supported in SDK mode. Pre-resolve data before passing to build().`);
    return undefined;
  }

  if (!responseCache.has(source)) {
    responseCache.set(
      source,
      (async () => {
        const response = await fetch(source);

        if (!response.ok) {
          throw new Error(
            `[girk-sdk] Failed to load dataSource ${source}: ${response.status} ${response.statusText}`
          );
        }

        return response.json();
      })()
    );
  }

  return responseCache.get(source)!;
};

const getResolvedResult = async (definition: DataDefinition): Promise<unknown> => {
  if (!definition.source) return undefined;

  const sourceData = await getSourceData(definition.source);
  const result = definition.items
    ? getValueByPath(sourceData, definition.items)
    : sourceData;

  return result;
};

const getNameFromPath = (relativePath: string): string => {
  const extension = extname(relativePath);
  const fileName = basename(relativePath).replace(extension, "");

  if (fileName.toLowerCase() === "index" || fileName.toLowerCase() === "readme") {
    const pathGroup = relativePath.split("/");
    return pathGroup[pathGroup.length - 2].toLowerCase();
  }

  return fileName.split(":")[0].toLowerCase();
};

const buildGeneratedPath = (file: File, slug: unknown): string => {
  const rawSlug = stringifyValue(slug).trim().replace(/^\/+|\/+$/g, "");

  if (!rawSlug) {
    throw new Error(
      `[girk-sdk] dataSlug did not resolve to a usable value for ${file.relativePath}`
    );
  }

  const extension = extname(file.path) || ".md";
  const segments = rawSlug.split("/").filter(Boolean);
  const leaf = segments.pop();

  // SDK: use file's language from the path
  const languageSuffix = file.language && file.language !== "en" ? `:${file.language}` : "";

  return join(dirname(file.path), ...segments, `${leaf}${languageSuffix}${extension}`);
};

const createGeneratedFile = async (file: File, item: unknown): Promise<File> => {
  const rawMeta = await extractMeta(file.data || "");
  const definition = getDataDefinition(rawMeta);
  const generatedPath = buildGeneratedPath(file, getValueByPath(item, definition.slug));
  const relativePath = generatedPath;

  const renderedData = stripDataMeta(
    interpolateDataTemplate(file.data || "", {
      result: item,
    })
  );

  return {
    ...file,
    id: fileId(relativePath),
    fileName: basename(generatedPath).replace(extname(generatedPath), "").split(":")[0],
    name: getNameFromPath(relativePath),
    relativePath,
    path: generatedPath,
    parent: file.parent,
    data: renderedData,
  };
};

export const prepareDataFiles = async (files: File[]): Promise<File[]> => {
  const preparedFiles: File[] = [];

  for (const file of files) {
    const rawMeta = await extractMeta(file.data || "");
    const definition = getDataDefinition(rawMeta);

    if (!definition.source) {
      preparedFiles.push(file);
      continue;
    }

    const result = await getResolvedResult(definition);

    if (definition.slug) {
      if (!Array.isArray(result)) {
        throw new Error(
          `[girk-sdk] dataSlug requires an array result for ${file.relativePath}`
        );
      }

      for (const item of result) {
        preparedFiles.push(await createGeneratedFile(file, item));
      }

      continue;
    }

    preparedFiles.push({
      ...file,
      data: stripDataMeta(
        interpolateDataTemplate(file.data || "", {
          result,
        })
      ),
    });
  }

  return preparedFiles;
};
