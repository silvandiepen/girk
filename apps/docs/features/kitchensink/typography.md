---
title: Typography And Content
order: 1
color: secondary
---

## Typography And Content

This paragraph is normal body copy. It shows the default measure, spacing, and tone of the generated stylesheet. If you need a callout, a table, or a form right inside Markdown, this is the baseline you are starting from.

> Girk aims to make plain HTML look deliberate before you start layering project styles on top.

> [!NOTE]
> Alert blocks keep important Markdown content visually distinct.

> [!WARNING]
> Warning alerts use the same content rhythm as the rest of the page.

### Mixed content

- one list item with enough text to show line length and spacing
- a second item with `inline code` and a [standard link](/features/customisation/index.html)
- a third item that exists only to show consistent defaults across elements
- [ ] one incomplete task item
- [x] one completed task item

GFM-style task list checkboxes should be editable in the rendered page.

#### Small data table

| Element | What it demonstrates | Why it matters |
| --- | --- | --- |
| Heading | scale and spacing | sets the visual hierarchy |
| Table | responsive table defaults | keeps structured content readable |
| Form control | native input styling | gives plain HTML a usable baseline |

### Markdown Extensions

*[HTML]: HyperText Markup Language

HTML abbreviations, ==marked text==, H~2~O, E = mc^2^, emoji shortcuts :rocket:, bare links like https://example.com, badges like :badge(beta, tone="info"), and keyboard shortcuts like :kbd(Mod+K) should all render from Markdown.

:open-icon(ui/check-m, label="Rendered icon") Open Icon syntax should render an inline icon from the installed local icon catalog.

Girk
: A Markdown-first static site generator.

Nizel
: The Markdown processor used by Girk.

This paragraph includes a citation [@kitchen] and a footnote.[^kitchen-note]

[@kitchen]: Kitchen Sink Rendering Notes, 2026.

[^kitchen-note]: Footnotes collect supporting notes below the content.

:::details Expandable Markdown details
Details blocks can contain **Markdown** content and links to [other docs](/features/markdown/index.html).
:::

:::print-only
This note only appears in printed output.
:::

:::screen-only
This note only appears on screen.
:::

:::keep
This block asks print renderers to avoid splitting it across pages.
:::

:::pagebreak
:::
