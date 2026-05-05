import { useNizel } from "nizel";
import { alertPlugin } from "nizel-plugin-alert";
import { deflistPlugin } from "nizel-plugin-deflist";
import { emojiPlugin } from "nizel-plugin-emoji";
import { shikiPlugin } from "nizel-plugin-shiki";

import {
  parseArticleOptions,
  buildArticleClassName,
  buildArticleStyle,
} from "@/libs/article";
import { extractMeta, removeMeta } from "@/libs/markdown-meta";
import { MarkdownData } from "@/types";
import type { NizelBlockNode, NizelRenderContext } from "nizel";
import { getGist } from "@/libs/download";
import { asyncForEach } from "@/libs/utils";
import { getFetch } from "./fetch";
import { dirname, resolve } from "@/libs/path-utils";

/**
 * Lazily-initialized Nizel processor with JS-engine Shiki for Worker compatibility.
 */
let _processor: ReturnType<typeof useNizel> | null = null;

async function getProcessor() {
  if (_processor) return _processor;

  // Use Shiki's JavaScript regex engine (no WASM) for Worker compatibility.
  // This import is safe in both Node and Workers.
  const { createBundledHighlighter } = await import("shiki/core");
  const { createJavaScriptRegexEngine } = await import("shiki/engine/javascript");
  const { bundledLanguages } = await import("shiki/langs");
  const { bundledThemes } = await import("shiki/themes");

  const createHighlighter = createBundledHighlighter({
    langs: bundledLanguages,
    themes: bundledThemes,
    engine: createJavaScriptRegexEngine,
  });

  const highlighter = await createHighlighter({
    themes: ["github-dark"],
    langs: ["javascript", "typescript", "html", "css", "json", "bash", "markdown", "python", "rust", "go"],
  });

  const highlightFn = (code: string, input: { lang?: string; theme?: string; meta?: string }) => {
    return highlighter.codeToHtml(code, {
      lang: input.lang || "text",
      theme: input.theme || "github-dark",
      meta: input.meta ? { __raw: input.meta } : undefined,
    });
  };

  _processor = useNizel({
    anchors: true,
    autolinks: { enabled: true, target: "_blank", rel: "noopener" },
    safe: true,
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
      alertPlugin(),
      deflistPlugin(),
      emojiPlugin(),
      shikiPlugin({ highlighter: highlightFn }),
    ],
  });

  return _processor;
}

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
 * Fetch the raw text of a URL. Returns an empty string on failure.
 */
const fetchUrl = async (url: string): Promise<string> => {
  const fetch = getFetch();
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
};

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
  const matches = Array.from(content.matchAll(importPattern));
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
 * Uses Nizel as the markdown engine with alert, deflist, emoji, and shiki plugins.
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

    strippedData = await resolveImports(strippedData, filePath, importFileMap);
  }

  const replacedData = await replaceData(strippedData);
  const nizel = await getProcessor();
  const result = await nizel(replacedData);

  return {
    document: result.html,
    meta: metaData,
  };
};
