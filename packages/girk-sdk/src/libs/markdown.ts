import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import prism from "markdown-it-prism";
import anchor from "markdown-it-anchor";
import tasks from "markdown-it-tasks";
import alert from "markdown-it-alert";
import defList from "markdown-it-deflist";
import { dirname, resolve } from "@/libs/path-utils";

import articleBlock from "@/libs/markdown-it-article";
import svgImages from "@/libs/markdown-it-svg";
import { extractMeta, removeMeta } from "@/libs/markdown-meta";
import { MarkdownData } from "@/types";
import { getGist } from "@/libs/download";
import { asyncForEach } from "@/libs/utils";
import { getFetch } from "./fetch";

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
 * Fetch the raw text of a URL. Returns an empty string on failure.
 */
const fetchUrl = async (url: string): Promise<string> => {
  try {
    const response = await getFetch()(url);
    if (!response.ok) {
      console.warn(`[girk-sdk] Failed to import URL ${url}: ${response.status}`);
      return "";
    }
    return await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.warn(`[girk-sdk] Failed to import URL ${url}: ${reason}`);
    return "";
  }
};

/**
 * In-memory content resolver for local imports in SDK mode.
 * When an importFileMap is provided, local imports are resolved from it.
 * Otherwise, local file imports return an empty string.
 */
const fetchFromMap = async (
  importPath: string,
  basePath: string,
  importFileMap?: Map<string, string>
): Promise<string> => {
  if (!importFileMap) return "";
  const absolutePath = resolve(dirname(basePath), importPath);
  return importFileMap.get(absolutePath) || importFileMap.get(importPath) || "";
};

/**
 * Rewrite .md file links in markdown content to girk's URL format.
 */
export const rewriteImportedLinks = (content: string): string => {
  return content.replace(
    /(\[[^\]]*\])\(([^)]+)\)/g,
    (match, label, href) => {
      if (/^(https?:\/\/|\/|#|mailto:)/.test(href)) return match;

      const hashIndex = href.indexOf("#");
      const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
      const anchor = hashIndex >= 0 ? href.slice(hashIndex) : "";

      if (!pathPart.endsWith(".md")) return match;

      const fileName = pathPart.split("/").pop()!.toLowerCase();
      if (fileName === "readme.md" || fileName === "index.md") {
        const dir = pathPart.includes("/")
          ? `${pathPart.slice(0, pathPart.lastIndexOf("/"))}/`
          : "./";
        return `${label}(${dir}${anchor})`;
      }

      return `${label}(${pathPart.replace(/\.md$/, "/")}${anchor})`;
    }
  );
};

/**
 * Load a single import source (URL or from in-memory map), strip its frontmatter,
 * and rewrite any .md links.
 */
export const loadImport = async (
  importPath: string,
  basePath: string,
  importFileMap?: Map<string, string>
): Promise<string> => {
  let raw = "";

  if (importPath.startsWith("http://") || importPath.startsWith("https://")) {
    raw = await fetchUrl(importPath);
  } else {
    raw = await fetchFromMap(importPath, basePath, importFileMap);
  }

  const stripped = await removeMeta(raw);
  return rewriteImportedLinks(stripped);
};

/**
 * Replace every [import:path] marker in `content` with the body of the referenced file.
 */
export const resolveImports = async (
  content: string,
  filePath: string,
  importFileMap?: Map<string, string>
): Promise<string> => {
  const importPattern = /\[import:(.*?)\]/g;
  const matches = [...content.matchAll(importPattern)];
  if (!matches.length) return content;

  const cache = new Map<string, string>();
  for (const match of matches) {
    const importPath = match[1].trim();
    if (!cache.has(importPath)) {
      cache.set(importPath, await loadImport(importPath, filePath, importFileMap));
    }
  }

  return content.replace(importPattern, (_, importPath: string) => cache.get(importPath.trim()) ?? "");
};

export const unp = (input: string): string => {
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
 * In SDK mode, local file imports require an optional importFileMap.
 * If no importFileMap is provided, local imports will be empty strings.
 *
 * @param input    - Raw markdown source including optional frontmatter.
 * @param filePath - Virtual path of the source file; used for relative import resolution.
 * @param importFileMap - Optional map of file paths to content for resolving local imports.
 */
export const toHtml = async (
  input: string,
  filePath?: string,
  importFileMap?: Map<string, string>
): Promise<MarkdownData> => {
  const metaData = await extractMeta(input);
  let strippedData = await removeMeta(input);

  if (filePath) {
    // Metadata-level import: load referenced file(s) and prepend their body content.
    if (metaData.import) {
      const importPaths: string[] = Array.isArray(metaData.import)
        ? (metaData.import as string[])
        : [metaData.import as string];

      const imported = await Promise.all(importPaths.map((p) => loadImport(p, filePath, importFileMap)));
      const importedBody = imported.join("\n\n");
      strippedData = strippedData.trim()
        ? `${importedBody}\n\n${strippedData}`
        : importedBody;
    }

    // Inline import: replace [import:path] markers in the body.
    strippedData = await resolveImports(strippedData, filePath, importFileMap);
  }

  const replacedData = await replaceData(strippedData);
  const renderedDocument = md.render(replacedData);

  return {
    document: unp(renderedDocument),
    meta: metaData,
  };
};
