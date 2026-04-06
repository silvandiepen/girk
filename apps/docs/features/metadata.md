---
title: Page Frontmatter
icon: ADD
color: magenta
tags: documentation
---

# Page Frontmatter

Page frontmatter is the single place where you control page titles, routes, navigation, archives, styling, tags, icons, images, and build-time data behavior.

## What It Is

In Girk, both "page settings" and "page metadata" mean the same thing: the frontmatter block at the top of a Markdown file.

```markdown
---
title: Install
description: Set up a new project
order: 10
icon: ui/folder-star
tags: guide, basics
---
```

Girk parses that block during the build and stores it as the page's `meta` object. There is no separate route config or page settings file.

## Frontmatter Syntax

Girk frontmatter is intentionally simple. It is not full YAML.

- use plain `key: value` lines
- numbers such as `order: 10` are parsed as numbers
- comma-separated values such as `tags: guide, basics` become arrays
- keys containing `date` are parsed as dates
- nested objects and YAML lists are not supported
- boolean-looking values such as `true` are treated as strings, but Girk still handles string flags for keys like `hide`

## Defaults And Fallbacks

When you leave a key out, Girk falls back to built-in behavior:

- `title`: first `#` heading in the document, otherwise the filename or folder name
- `description`: page description when present, otherwise the project description is used for the HTML meta description
- `order`: `999`
- `hide`: visible by default
- `redirect`: no redirect
- `archive`: no archive
- `menuChildren`: off by default
- `thumbnail`: falls back to `image`
- `icon`, `color`, `style`, `tags`, `date`: no value unless you set them

## Common Example

```md
---
title: Install
description: Start a new Girk project
order: 10
icon: ui/folder-star
image: /media/setup.jpg
tags: guide, basics
color: blue
---
```

## Reference

### `title`

Controls the page title in navigation, cards, and the HTML `<title>`.

```markdown
---
title: Install
---
```

Default:
The first Markdown `#` heading. If no heading exists, Girk falls back to the filename or folder name.

### `description`

Sets the page description used in the document head.

```markdown
---
description: Set up a new Girk project.
---
```

Default:
No page-specific description. The project description is used as the HTML meta description when available.

### `date`

Adds an updated date meta tag and gives archive pages a date to display or sort against.

```markdown
---
date: 2026-04-06
---
```

Use ISO-style dates when possible.

### `icon`

Sets the page icon used in navigation, archive cards, and related page cards.

```markdown
---
icon: ADD
---
```

```markdown
---
icon: ui/grid
---
```

```markdown
---
icon: /assets/icon-install.svg
---
```

`icon` accepts Open Icon values, local asset paths, external asset URLs, or inline SVG. For the full format and examples, see [Icons](/features/icons/).

### `image`

Sets the main page image and also acts as the thumbnail fallback.

```markdown
---
image: /media/setup.jpg
---
```

On normal pages, Girk renders the image near the top of the content. If `thumbnail` is missing, this image is also used for archive cards and previews.

### `thumbnail`

Sets the image used for archive cards and preview surfaces.

```markdown
---
thumbnail: /media/setup-card.jpg
---
```

If you omit it, Girk falls back to `image`.

### `thumb`

Alias for `thumbnail`.

```markdown
---
thumb: /media/setup-card.jpg
---
```

Prefer `thumbnail` in new content. `thumb` exists as a shorthand alias.

### `tags`

Assigns one or more tags to the page so Girk can build tag pages.

```markdown
---
tags: guide, basics
---
```

Single values also work:

```markdown
---
tags: guide
---
```

### `hide`

Keeps the page out of generated navigation, archive cards, tag pages, and related-page listings.

```markdown
---
hide: true
---
```

The page is still generated and remains reachable directly.

### `order`

Controls sort order in menus, related pages, and non-blog archives.

```markdown
---
order: 10
---
```

Lower numbers appear first. The default is `999`.

### `redirect`

Turns the page into an immediate redirect target.

```markdown
---
redirect: /guide/install/
---
```

Girk adds a refresh redirect in the page head and points menu/archive links at the redirect target.

### `name`

Overrides the generated route segment without changing the source filename.

```markdown
---
name: installation
---
```

A file such as `install.md` can then generate `/installation/`.

### `archive`

Turns a folder landing page into a generated archive.

```markdown
---
archive: articles
---
```

Supported values:

- `articles`: card grid of child pages
- `blog`: dated archive cards
- `sections`: inline long-form page assembled from child pages, without standalone child routes
- `collection`: grouped content rendered in sequence

For archive patterns and examples, see [Archives](/features/archives/).

### `archiveTitle`

Adds a heading above an `articles` archive grid.

```markdown
---
archive: articles
archiveTitle: More Guides
---
```

### `menuChildren`

Adds child pages from an archive section to the menu.

```markdown
---
archive: articles
menuChildren: true
---
```

This is most useful on guide and docs landing pages.

### `color`

Applies a section color token to the page and to archive cards that surface the page.

```markdown
---
color: blue
---
```

Girk maps this to `--section-background-color` and `--section-text-color`. For the full token system, see [Customisation](/features/customisation/).

### `style`

Adds inline CSS rules to the page section.

```markdown
---
style: border-radius: 1rem;
---
```

This is useful for one-off layout or presentation tweaks tied to a page.

### `dataSource`

Loads JSON during the build so one page can render structured data or generate detail pages.

```markdown
---
dataSource: data/projects.json
---
```

Supported sources:

- local JSON files relative to the project root
- remote HTTP or HTTPS JSON endpoints

### `dataItems`

Selects a nested array or object inside the JSON loaded by `dataSource`.

```markdown
---
dataSource: data/projects.json
dataItems: items
---
```

Use dotted paths for nested data such as `items.projects`.

### `dataSlug`

Generates sibling pages from a template file using the resolved item value as the route slug.

```markdown
---
dataSource: data/projects.json
dataItems: items
dataSlug: slug
---
```

This is typically used in template files such as `projects/-detail.md`. For the full flow, see [Use Data Sources](/how-to/data-sources/).

## Practical Patterns

### A Normal Content Page

```markdown
---
title: Install
description: Set up a new project
order: 10
icon: ui/folder-star
tags: guide, basics
---

# Install
```

### A Guide Landing Page

```markdown
---
title: Guide
archive: articles
menuChildren: true
icon: /assets/icon-guide.svg
---

# Guide
```

### A Styled Feature Page

```markdown
---
title: Theme Tokens
color: yellow
style: border-radius: 1rem;
---

# Theme Tokens
```

### Data-Generated Detail Pages

```markdown
---
dataSource: data/projects.json
dataItems: items
dataSlug: slug
title: {{result.title}}
description: {{result.summary}}
---
```

## Practical Advice

- prefer `title` over renaming files when you only want to change labels
- use `name` only when you need a different route segment
- use `order` to make menus and archive grids deliberate instead of filename-driven
- use `hide` for helper pages, redirects, and content that should stay off navigational surfaces
- use `archive` and `menuChildren` on folder landing pages, not on ordinary leaf pages
- use `thumbnail` when card imagery should differ from the main `image`
- prefer `color` tokens over long inline `style` values when the goal is just section theming
- use `dataSource`, `dataItems`, and `dataSlug` together when one template should generate many pages

## Live Example

- [example-basic.girk.dev](https://example-basic.girk.dev/)

## Source Example

- [`apps/example-basic`](https://github.com/silvandiepen/girk/tree/main/apps/example-basic)
