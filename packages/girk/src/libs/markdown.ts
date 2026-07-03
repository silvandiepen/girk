import { readFile } from "node:fs/promises";
import { resolve, dirname } from "path";

import {
  parseArticleOptions,
  buildArticleClassName,
  buildArticleStyle,
} from "@/libs/article";
import { extractMeta, removeMeta } from "@/libs/markdown-meta";
import { MarkdownData } from "@/types";
import { getGist } from "@/libs/download";
import { asyncForEach } from "@/libs/utils";
import type { NizelBlockNode, NizelRenderContext } from "nizel";

/**
 * Lazily-initialized Nizel processor configured with all girk plugins.
 *
 * Nizel and its plugins are ESM-only packages. Girky still publishes a
 * CommonJS build, so runtime imports must stay dynamic.
 */
type NizelProcessor = (input: string) => Promise<{ html: string }>;

let _processor: NizelProcessor | null = null;

const importEsm = (
  process.env.VITEST
    ? <T>(specifier: string) => import(specifier) as Promise<T>
    : (new Function("specifier", "return import(specifier)") as <T>(
        specifier: string
      ) => Promise<T>)
);

const getProcessor = async (): Promise<NizelProcessor> => {
  if (_processor) return _processor;

  const { useNizel } = await importEsm<typeof import("nizel")>("nizel");
  const { abbrPlugin } = await importEsm<typeof import("nizel-plugin-abbr")>("nizel-plugin-abbr");
  const { alertPlugin } = await importEsm<typeof import("nizel-plugin-alert")>("nizel-plugin-alert");
  const { autolinkPlugin } = await importEsm<typeof import("nizel-plugin-autolink")>("nizel-plugin-autolink");
  const { citationsPlugin } = await importEsm<typeof import("nizel-plugin-citations")>("nizel-plugin-citations");
  const { codeCopyPlugin } = await importEsm<typeof import("nizel-plugin-code-copy")>("nizel-plugin-code-copy");
  const { deflistPlugin } = await importEsm<typeof import("nizel-plugin-deflist")>("nizel-plugin-deflist");
  const { detailsPlugin } = await importEsm<typeof import("nizel-plugin-details")>("nizel-plugin-details");
  const { diagramsPlugin } = await importEsm<typeof import("nizel-plugin-diagrams")>("nizel-plugin-diagrams");
  const { emojiPlugin } = await importEsm<typeof import("nizel-plugin-emoji")>("nizel-plugin-emoji");
  const { footnotesPlugin } = await importEsm<typeof import("nizel-plugin-footnotes")>("nizel-plugin-footnotes");
  const { frontmatterUiPlugin } = await importEsm<typeof import("nizel-plugin-frontmatter-ui")>("nizel-plugin-frontmatter-ui");
  const { headingAnchorsPlugin } = await importEsm<typeof import("nizel-plugin-heading-anchors")>("nizel-plugin-heading-anchors");
  const { mathPlugin } = await importEsm<typeof import("nizel-plugin-math")>("nizel-plugin-math");
  const { mediaPlugin } = await importEsm<typeof import("nizel-plugin-media")>("nizel-plugin-media");
  const { sanitizePlugin } = await importEsm<typeof import("nizel-plugin-sanitize")>("nizel-plugin-sanitize");
  const { shikiPlugin } = await importEsm<typeof import("nizel-plugin-shiki")>("nizel-plugin-shiki");
  const { tocPlugin } = await importEsm<typeof import("nizel-plugin-toc")>("nizel-plugin-toc");
  const { typographyPlugin } = await importEsm<typeof import("nizel-plugin-typography")>("nizel-plugin-typography");

  _processor = useNizel({
    anchors: true,
    safe: false,
    elements: {
      img: {
        class: "image",
      },
    },
    blocks: {
      article: {
        name: "article",
        parse({ args }) {
          return { rawOptions: args.join(" ") };
        },
        formats: {
          html(node: NizelBlockNode, ctx: NizelRenderContext) {
            const customNode = node as { value?: { rawOptions: string }; children?: NizelBlockNode[] };
            const rawOptions = customNode.value?.rawOptions ?? "";
            const options = parseArticleOptions(rawOptions);
            const className = buildArticleClassName(options);
            const style = buildArticleStyle(options);
            const styleAttr = style ? ` style="${ctx.escape(style)}"` : "";
            const header = renderArticleHeader(options, ctx.escape);
            const contentHtml = ctx.render(customNode.children ?? []);
            const body = contentHtml
              ? `<div class="article-block__content">\n${contentHtml}\n</div>`
              : "";
            return `<article class="${ctx.escape(className)}"${styleAttr}>\n${header}${body}\n</article>\n`;
          },
        },
      },
    },
    plugins: [
      abbrPlugin(),
      alertPlugin(),
      autolinkPlugin({ target: "_blank", rel: "noopener" }),
      citationsPlugin(),
      deflistPlugin(),
      detailsPlugin(),
      diagramsPlugin(),
      emojiPlugin(),
      frontmatterUiPlugin(),
      footnotesPlugin(),
      headingAnchorsPlugin(),
      mathPlugin(),
      mediaPlugin(),
      shikiPlugin(),
      codeCopyPlugin(),
      tocPlugin(),
      typographyPlugin(),
      sanitizePlugin({ allowRawHtml: true }),
    ],
  });

  return _processor;
};

/**
 * Renders the article block header with type, subtitle, date, title, and description.
 */
const renderArticleHeader = (
  options: ReturnType<typeof parseArticleOptions>,
  escape: (v: unknown) => string
): string => {
  const metaItems: string[] = [];

  if (options.type) {
    const humanized = options.type
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    metaItems.push(`<p class="article-block__type">${escape(humanized)}</p>`);
  }

  if (options.subtitle) {
    metaItems.push(`<p class="article-block__subtitle">${escape(options.subtitle)}</p>`);
  }

  if (options.date) {
    metaItems.push(`<time class="article-block__date" datetime="${escape(options.date)}">${escape(options.date)}</time>`);
  }

  const headerContent: string[] = [];

  if (metaItems.length) {
    headerContent.push(`<div class="article-block__meta">${metaItems.join("")}</div>`);
  }

  if (options.title) {
    headerContent.push(`<h3 class="article-block__title">${escape(options.title)}</h3>`);
  }

  if (options.description) {
    headerContent.push(`<p class="article-block__description">${escape(options.description)}</p>`);
  }

  if (!headerContent.length) return "";

  return `<header class="article-block__header">${headerContent.join("")}</header>`;
};

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
 * Rewrite .md file links in markdown content to girk's URL format.
 *
 * Only the file extension is converted — relative paths are left exactly as written.
 * Rebasing paths to account for the importer's location would require knowing the full
 * URL structure of the published site, which girk cannot assume. Keeping links relative
 * also means the site works on any domain or path prefix.
 *
 * Transformations applied to relative links ending in .md:
 *   - README.md / index.md → trailing-slash directory URL  (e.g. `./api/`)
 *   - Other .md files       → name/ directory URL          (e.g. `./convert/`)
 *
 * Absolute URLs (http/https), root-relative paths (/), and anchor-only hrefs (#)
 * are left unchanged. Anchor fragments on rewritten links are preserved.
 *
 * @param content - Markdown body to process.
 */
export const rewriteImportedLinks = (content: string): string => {
  return content.replace(
    /(\[[^\]]*\])\(([^)]+)\)/g,
    (match, label, href) => {
      // Leave absolute URLs, root-relative paths, and anchor-only hrefs alone
      if (/^(https?:\/\/|\/|#|mailto:)/.test(href)) return match;

      const hashIndex = href.indexOf("#");
      const pathPart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
      const anchor = hashIndex >= 0 ? href.slice(hashIndex) : "";

      if (!pathPart.endsWith(".md")) return match;

      // README/index → trailing-slash directory URL
      const fileName = pathPart.split("/").pop()!.toLowerCase();
      if (fileName === "readme.md" || fileName === "index.md") {
        const dir = pathPart.includes("/")
          ? `${pathPart.slice(0, pathPart.lastIndexOf("/"))}/`
          : "./";
        return `${label}(${dir}${anchor})`;
      }

      // Other .md files → name/ directory URL
      return `${label}(${pathPart.replace(/\.md$/, "/")}${anchor})`;
    }
  );
};

/**
 * Load a single import source (relative path or http/https URL), strip its frontmatter,
 * and rewrite any .md links to girk's URL format.
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

  const stripped = await removeMeta(raw);
  return rewriteImportedLinks(stripped);
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

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const renderTaskLists = (input: string): string => {
  const lines = input.split("\n");
  const output: string[] = [];
  let taskItems: string[] = [];

  const flushTaskList = () => {
    if (!taskItems.length) return;
    output.push(`<ul class="task-list">\n${taskItems.join("\n")}\n</ul>`);
    taskItems = [];
  };

  for (const line of lines) {
    const match = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/);

    if (!match) {
      flushTaskList();
      output.push(line);
      continue;
    }

    const checked = match[1].toLowerCase() === "x";
    const checkedAttr = checked ? " checked" : "";
    taskItems.push(
      `<li class="task-list__item"><input class="task-list__input" type="checkbox" disabled${checkedAttr}><span class="task-list__label">${escapeHtml(match[2])}</span></li>`
    );
  }

  flushTaskList();
  return output.join("\n");
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

  // Rewrite .md links to girk's URL format so links between pages work on the
  // generated site (e.g. `setup-new-project.md` -> `setup-new-project/`).
  strippedData = rewriteImportedLinks(strippedData);

  const replacedData = renderTaskLists(await replaceData(strippedData));
  const processor = await getProcessor();
  const result = await processor(replacedData);

  return {
    document: result.html,
    meta: metaData,
  };
};
