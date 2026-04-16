import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import prism from "markdown-it-prism";
import anchor from "markdown-it-anchor";
import tasks from "markdown-it-tasks";
import alert from "markdown-it-alert";
import defList from "markdown-it-deflist";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "path";

import articleBlock from "@/libs/markdown-it-article";
import svgImages from "@/libs/markdown-it-svg";
import { extractMeta, removeMeta } from "@/libs/markdown-meta";
import { MarkdownData } from "@/types";
import { getGist } from "@/libs/download";
import { asyncForEach } from "@/libs/utils";
import fetch from "node-fetch";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

md.use(prism, {
  highlightInlineCode: true,
  plugins: ["autolinker"]
});
md.use(emoji);
md.use(anchor);
md.use(tasks, { enabled: true, label: true, labelAfter: true });
md.use(alert, { bem: true });
md.use(defList);
md.use(articleBlock);
md.use(svgImages);

/**
 * Fetch the raw text of a URL. Returns an empty string and logs a warning on failure.
 */
const fetchUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[girk] Failed to import URL ${url}: ${response.status}`);
      return "";
    }
    return await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.warn(`[girk] Failed to import URL ${url}: ${reason}`);
    return "";
  }
};

/**
 * Read a local file as UTF-8 text. Returns an empty string and logs a warning on failure.
 */
const fetchLocalFile = async (absolutePath: string): Promise<string> => {
  try {
    return await readFile(absolutePath, "utf-8");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.warn(`[girk] Failed to import file ${absolutePath}: ${reason}`);
    return "";
  }
};

/**
 * Load a single import source (relative path or http/https URL) and strip its frontmatter.
 *
 * Imports are intentionally non-recursive: the loaded content is used as-is so that
 * component README files stay clean — they need no girk-specific metadata of their own.
 * The wrapper doc page supplies all girk metadata and controls where the imported body lands.
 *
 * @param importPath - Relative file path or absolute URL to import.
 * @param basePath   - Absolute path of the file that contains the import directive,
 *                     used to resolve relative paths.
 */
export const loadImport = async (importPath: string, basePath: string): Promise<string> => {
  let raw = "";

  if (importPath.startsWith("http://") || importPath.startsWith("https://")) {
    raw = await fetchUrl(importPath);
  } else {
    raw = await fetchLocalFile(resolve(dirname(basePath), importPath));
  }

  return removeMeta(raw);
};

/**
 * Replace every [import:path] marker in `content` with the body of the referenced file.
 *
 * - Relative paths are resolved against `filePath`.
 * - http/https URLs are fetched directly.
 * - Each unique source is loaded once (duplicates reuse the cached result).
 * - Frontmatter in the imported file is stripped automatically.
 * - Imports are NOT processed recursively to avoid circular loops.
 *
 * Syntax:
 *   [import:./relative/path.md]
 *   [import:../../other/component/README.md]
 *   [import:https://example.com/raw/file.md]
 *
 * @param content  - Markdown source that may contain [import:...] markers.
 * @param filePath - Absolute path of the file being processed (used for relative resolution).
 */
export const resolveImports = async (content: string, filePath: string): Promise<string> => {
  const importPattern = /\[import:(.*?)\]/g;
  const matches = [...content.matchAll(importPattern)];
  if (!matches.length) return content;

  const cache = new Map<string, string>();
  for (const match of matches) {
    const importPath = match[1].trim();
    if (!cache.has(importPath)) {
      cache.set(importPath, await loadImport(importPath, filePath));
    }
  }

  return content.replace(importPattern, (_, importPath: string) => cache.get(importPath.trim()) ?? "");
};

export const unp = (input: string): string => {
  // const regex = new RegExp("<p>(?:<img[^>]+>|<svg[^>]+>(.*?)</svg>)</p>", "g");
  // const images = input.match(regex);
  return input;
};

export const replaceData = async (input: string): Promise<string> => {
  const gist = /\[gist=(.*?)\]/g;
  const matches = input.match(gist);
  if (matches) {
    await asyncForEach(matches, async (match) => {
      const gistId = match.split("[gist=").pop().split("]")[0];
      const gistData = await getGist(gistId);
      input = input.replace(match, `\n${gistData}\n`);
    });
  }
  return input;
};

/**
 * Convert a markdown string to HTML with full import and data resolution.
 *
 * Import resolution (requires `filePath`):
 *   1. Metadata import — when the frontmatter contains an `import` key, the referenced
 *      file(s) are loaded and prepended to this file's own body. This lets a docs page
 *      act as a girk-aware wrapper for a source-adjacent README with zero metadata of
 *      its own.
 *   2. Inline import — [import:path] markers anywhere in the body are replaced with the
 *      body of the referenced file.
 *
 * In both cases the imported file's frontmatter is stripped and imports inside the
 * loaded file are NOT resolved (non-recursive, prevents circular loops).
 *
 * @param input    - Raw markdown source including optional frontmatter.
 * @param filePath - Absolute path of the source file; required for relative import resolution.
 */
export const toHtml = async (input: string, filePath?: string): Promise<MarkdownData> => {
  const metaData = await extractMeta(input);
  let strippedData = await removeMeta(input);

  if (filePath) {
    // Metadata-level import: load referenced file(s) and prepend their body content.
    if (metaData.import) {
      const importPaths: string[] = Array.isArray(metaData.import)
        ? (metaData.import as string[])
        : [metaData.import as string];

      const imported = await Promise.all(importPaths.map((p) => loadImport(p, filePath)));
      const importedBody = imported.join("\n\n");
      strippedData = strippedData.trim()
        ? `${importedBody}\n\n${strippedData}`
        : importedBody;
    }

    // Inline import: replace [import:path] markers in the body.
    strippedData = await resolveImports(strippedData, filePath);
  }

  const replacedData = await replaceData(strippedData);
  const renderedDocument = md.render(replacedData);

  return {
    document: unp(renderedDocument),
    meta: metaData,
  };
};
