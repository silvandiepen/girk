import { describe, expect, it } from "vitest";
import MarkdownIt from "markdown-it";

import {
  buildArticleClassName,
  buildArticleStyle,
  parseArticleOptions,
  renderArticle,
} from "./article";

describe("article helper", () => {
  it("parses metadata attributes and class shorthand", () => {
    const options = parseArticleOptions(
      'type="info" title="Note" subtitle="Heads up" class="editorial-note compact" date="2026-03-27" description="Short context."'
    );

    expect(options.type).toBe("info");
    expect(options.title).toBe("Note");
    expect(options.subtitle).toBe("Heads up");
    expect(options.date).toBe("2026-03-27");
    expect(options.description).toBe("Short context.");
    expect(options.classes).toEqual(["editorial-note", "compact"]);
  });

  it("prefers type over color for article theme variables", () => {
    const options = parseArticleOptions(
      'type="info" color="warning" style="scroll-margin-top: 5rem;"'
    );

    expect(buildArticleClassName(options)).toBe(
      "article-block article-block--type-info article-block--color-warning"
    );
    expect(buildArticleStyle(options)).toBe(
      "--article-color: var(--color-info); --article-color-contrast: var(--color-info-contrast); scroll-margin-top: 5rem"
    );
  });

  it("renders a structured article header and body", () => {
    const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true });
    const article = renderArticle(
      md,
      'type="info" title="Note" subtitle="Heads up" date="2026-03-27" description="Short context."',
      "This article assumes basic Markdown knowledge."
    );

    expect(article).toContain('class="article-block article-block--type-info"');
    expect(article).toContain("article-block__meta");
    expect(article).toContain(">Info<");
    expect(article).toContain(">Note<");
    expect(article).toContain(">Short context.<");
    expect(article).toContain('datetime="2026-03-27"');
    expect(article).toContain(
      "<p>This article assumes basic Markdown knowledge.</p>"
    );
  });
});
