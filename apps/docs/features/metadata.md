---
title: Page Metadata
icon: /media/icon_meta.svg
tags: documentation
---

# Page Metadata

Page frontmatter is how you shape navigation, order, descriptions, redirects, and archive behavior without leaving the content file.

## Why You Want It

Most of the time, you do not need a separate admin panel or route config. A few keys in frontmatter are enough.

## Common Keys

- `title`
- `description`
- `date`
- `icon`
- `image`
- `thumbnail`
- `tags`
- `hide`
- `order`
- `redirect`
- `archive`
- `menuChildren`

## Example

```markdown
---
title: Install
description: Start a new Girk project
order: 10
icon: /assets/icon-install.svg
tags: guide, basics
---
```

## Live Example

- [example-basic.girk.dev](https://example-basic.girk.dev/)

## Source Example

- [`apps/example-basic`](https://github.com/silvandiepen/girk/tree/main/apps/example-basic)
