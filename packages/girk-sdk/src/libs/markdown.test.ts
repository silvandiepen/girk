import { describe, expect, it } from "vitest";

import { getTitle } from "@/libs/helpers";
import { toHtml } from "@/libs/markdown";

const pluginFixture = `*[HTML]: HyperText Markup Language

[[toc]]

## Section

HTML text with ==marked==, H~2~O, E = mc^2^, $a+b$, :badge(beta), :kbd(Mod+K), :open-icon(ui/search-m), and https://example.com.

:::details More
Hidden **text**
:::

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`

\`\`\`js
console.log("copy");
\`\`\`

![Caption](/image.png)

Cite [@ref].

[@ref]: Citation text.

::frontmatter
title: Demo
::
`;

describe("markdown plugins", () => {
  it("renders the first-party Nizel plugin syntax", async () => {
    const result = await toHtml(pluginFixture);
    const html = result.document;

    expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
    expect(html).toContain('<nav class="toc">');
    expect(html).toContain('class="heading-anchor"');
    expect(html).toContain("<mark>marked</mark>");
    expect(html).toContain("H<sub>2</sub>O");
    expect(html).toContain("mc<sup>2</sup>");
    expect(html).toContain('<span class="math math-inline">a+b</span>');
    expect(html).toContain('class="nizel-badge"');
    expect(html).toContain('class="nizel-kbd-group"');
    expect(html).toContain('class="nizel-open-icon"');
    expect(html).toContain('href="https://example.com" target="_blank" rel="noopener"');
    expect(html).toContain('<details class="details">');
    expect(html).toContain('<div class="mermaid">');
    expect(html).toContain('data-nizel-code-copy');
    expect(html).toContain('data-nizel-copy-source');
    expect(html).toContain('data-nizel-copy-button');
    expect(html).not.toContain("onclick=");
    expect(html).toContain('<figure class="media-figure">');
    expect(html).toContain('<section class="citations">');
    expect(html).toContain('<dl class="frontmatter">');
  });

  it("keeps safe raw HTML while sanitizing risky attributes", async () => {
    const result = await toHtml('<example-note onclick="alert(1)" data-text="Loaded"></example-note>');

    expect(result.document).toContain('<example-note data-text="Loaded"></example-note>');
    expect(result.document).not.toContain("onclick");
  });

  it("renders task lists with the Nizel task-list plugin markup", async () => {
    const result = await toHtml(`- [ ] Prep
- [x] Done`);

    expect(result.document).toContain('class="nizel-task-list__checkbox"');
    expect(result.document).toContain("data-nizel-task-checkbox");
    expect(result.document).toContain('type="checkbox"');
    expect(result.document).toContain('type="checkbox" checked');
    expect(result.document).not.toContain("disabled");
  });

  it("renders print layout directives", async () => {
    const result = await toHtml(`:::print-only
Printed text.
:::

:::pagebreak
:::
`);

    expect(result.document).toContain('class="nizel-print-only"');
    expect(result.document).toContain('class="nizel-pagebreak"');
  });

  it("renders Girk article blocks with Nizel custom block syntax", async () => {
    const result = await toHtml(`::article type="info" title="Note"
Article body.
::`);

    expect(result.document).toContain('<article class="article-block article-block--type-info"');
    expect(result.document).toContain('<h3 class="article-block__title">Note</h3>');
    expect(result.document).toContain("Article body.");
  });

  it("renders footnotes", async () => {
    const result = await toHtml(`Note.[^one]

[^one]: Footnote text.
`);

    expect(result.document).toContain('<section class="footnotes">');
    expect(result.document).toContain('class="footnote-ref"');
  });

  it("keeps generated heading anchors out of extracted titles", () => {
    expect(getTitle('<h1 id="intro">Intro<a class="heading-anchor" href="#intro" aria-hidden="true">#</a></h1>')).toBe("Intro");
  });
});
