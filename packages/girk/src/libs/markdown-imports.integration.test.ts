/**
 * Integration tests — real network calls to GitHub raw content.
 *
 * No mocks are used here. These tests verify that the import feature works
 * end-to-end with an actual HTTP fetch, including frontmatter stripping and
 * HTML rendering of the downloaded markdown.
 *
 * Run conditions: requires internet access and the girk GitHub repo to be reachable.
 */
import { describe, expect, it } from "vitest";

import { loadImport, resolveImports, toHtml } from "@/libs/markdown";

const GITHUB_README =
  "https://raw.githubusercontent.com/silvandiepen/girk/main/README.md";

describe("File import — real network (GitHub)", () => {
  it(
    "fetches a raw markdown file from GitHub and returns its stripped body",
    async () => {
      const result = await loadImport(GITHUB_README, "/docs/page.md");

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(50);
      expect(result.toLowerCase()).toMatch(/girk/i);
      // Frontmatter delimiters must be stripped
      expect(result.trimStart()).not.toMatch(/^---/);
    },
    10_000
  );

  it(
    "replaces an inline [import:url] marker when rendering to HTML",
    async () => {
      const input = `# External Import Test\n\n[import:${GITHUB_README}]`;
      const { document } = await toHtml(input, "/docs/page.md");

      // The marker itself must be gone
      expect(document).not.toContain("[import:");
      // Content from the fetched README must appear in the HTML
      expect(document.toLowerCase()).toContain("girk");
      // The wrapper heading must still be there
      expect(document).toContain("<h1");
    },
    10_000
  );

  it(
    "resolves a URL import via metadata import key and prepends it to page content",
    async () => {
      const input = `---\ntitle: Integration Test\nimport: ${GITHUB_README}\n---\n\n## Page Own Section`;
      const { document } = await toHtml(input, "/docs/page.md");

      expect(document.toLowerCase()).toContain("girk");
      expect(document).toContain("Page Own Section");
      // Imported content must appear before the page's own section
      expect(document.toLowerCase().indexOf("girk")).toBeLessThan(
        document.indexOf("Page Own Section")
      );
    },
    10_000
  );

  it(
    "resolves inline imports in content returned by resolveImports",
    async () => {
      const content = `Before.\n\n[import:${GITHUB_README}]\n\nAfter.`;
      const result = await resolveImports(content, "/docs/page.md");

      expect(result).toContain("Before.");
      expect(result).toContain("After.");
      expect(result).not.toContain("[import:");
      expect(result.toLowerCase()).toContain("girk");
    },
    10_000
  );
});
