---
title: Imports
icon: ui/file-import
color: blue
tags: documentation
---

# Imports

Girk can pull in the body of another markdown file at build time — either via a frontmatter key or an inline marker. This lets component READMEs live next to their source code while docs pages wrap them with girk-specific metadata and layout.

## How It Works

Imports are resolved once, at build time. Frontmatter in the imported file is always stripped — only the body is used. Imports are **not** recursive: if the loaded file itself contains `[import:]` markers they are left in place as literal text. This prevents circular import loops and keeps the behaviour predictable.

## Metadata Import

Add an `import` key to the frontmatter of any docs page. Girk loads the referenced file and prepends its body before the page's own content.

```markdown
---
title: Button Component
tags: components
import: ../../src/components/button/README.md
---

Any content written here appears after the imported body.
```

Multiple files can be listed comma-separated:

```markdown
---
import: ../../src/button/README.md, ../../src/button/CHANGELOG.md
---
```

URL sources are also supported:

```markdown
---
import: https://raw.githubusercontent.com/org/repo/main/README.md
---
```

## Inline Import

Place `[import:path]` anywhere in the body to insert another file's content at that exact position. This is useful when you want to compose a single page from several source files.

```markdown
---
title: Full API Reference
---

## Button

[import:../../src/button/README.md]

## Input

[import:../../src/input/README.md]
```

Inline and metadata imports can be combined freely. The same path can appear more than once — the file is fetched only once and reused.

## Path Resolution

| Source | How it resolves |
|--------|----------------|
| Relative path (`../../src/...`) | Resolved relative to the docs file that contains the import |
| Absolute URL (`https://...`) | Fetched over HTTP at build time |

## Keeping Source Files Clean

The whole point of this feature is that component READMEs do **not** need any girk metadata. A typical component README:

```markdown
# Button

A basic button component. Accepts `label`, `disabled`, and `onClick` props.

## Usage

\`\`\`html
<button>Click me</button>
\`\`\`
```

And the docs wrapper:

```markdown
---
title: Button
icon: ui/cursor-click
tags: components, ui
import: ../../src/components/button/README.md
---
```

The README stays useful on GitHub or inside an IDE. Girk picks it up and renders it under the right title, icon, and tags without touching the source file.

## Related

- [Page Metadata](/features/metadata/index.html)
- [Data Sources](/features/data-sources/index.html)
