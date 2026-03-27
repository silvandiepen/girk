import { describe, expect, it } from "vitest";

import { toHtml } from "@/libs/markdown";

describe("Markdown code highlighting", () => {
  it.each([
    ["bash", "echo hello", "token builtin"],
    ["json", '{\"name\":\"girk\"}', "token property"],
    ["markdown", "# Heading", "token title"],
    ["css", "body { color: red; }", "token selector"],
  ])(
    "renders Prism token markup for %s fences",
    async (language, source, tokenClass) => {
      const { document } = await toHtml(`\`\`\`${language}\n${source}\n\`\`\``);

      expect(document).toContain(`class="language-${language}"`);
      expect(document).toContain(tokenClass);
    }
  );
});

describe("Markdown article blocks", () => {
  it("renders article containers from markdown syntax", async () => {
    const { document } = await toHtml(`:::article editorial-note
## Editorial note
This article comes from markdown.

It keeps semantic grouping without raw HTML.
:::`);

    expect(document).toContain(
      '<article class="article-block editorial-note">'
    );
    expect(document).toContain("<h2");
    expect(document).toContain("<p>This article comes from markdown.</p>");
    expect(document).toContain("</article>");
  });

  it("renders structured article metadata from markdown attributes", async () => {
    const { document } = await toHtml(`:::article type="info" title="Note" subtitle="Heads up" date="2026-03-27" description="Start here."
This article assumes basic Markdown knowledge.
:::`);

    expect(document).toContain('article-block--type-info');
    expect(document).toContain("article-block__header");
    expect(document).toContain(">Heads up<");
    expect(document).toContain('datetime="2026-03-27"');
    expect(document).toContain(">Note<");
    expect(document).toContain(">Start here.<");
    expect(document).toContain(
      "<p>This article assumes basic Markdown knowledge.</p>"
    );
  });
});
