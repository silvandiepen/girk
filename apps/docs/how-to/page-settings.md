---
title: Use Page Settings
icon: /media/icon_meta.svg
tags: documentation
---

# Use Page Settings

Page frontmatter is where you control titles, descriptions, ordering, redirects, icons, and archive behavior.

## Common Settings

```markdown
---
title: Install
description: Set up a new project
order: 10
icon: /assets/icon-install.svg
tags: guide, basics
---
```

## The Keys You Will Use Most

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
- `dataSource`
- `dataItems`
- `dataSlug`

## Practical Advice

- use `title` when the filename is not the right menu label
- use `order` when the content should appear in a deliberate sequence
- use `hide` when a page should exist but stay out of the menu
- use `redirect` when a menu or archive item should point somewhere else
- use `archive` and `menuChildren` on folder landing pages
