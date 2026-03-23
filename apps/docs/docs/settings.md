---
icon: /media/icon_settings.svg
tags: documentation
---
# Settings

Girk keeps CLI configuration minimal. The primary way to configure a project is through frontmatter on Markdown files and an optional project config file in the project root.

## Configuration Sources

Girk reads configuration from:

- frontmatter in Markdown files
- `girk.config.json`
- `gieter.config.json`

If the same project-level setting exists in both places, Markdown frontmatter overrides the config file.

## Config File Example

```json
{
  "project": {
    "title": "Acme Docs",
    "description": "Internal documentation for Acme"
  },
  "colors": {
    "primary": "#111111",
    "secondary": "#6e6e6e"
  },
  "socials": [
    "https://github.com/acme/docs"
  ],
  "noRobots": true
}
```

Nested config is flattened internally, so `project.title` becomes `projectTitle` and `colors.primary` becomes a color override.

## Precedence

Use the JSON file for project defaults and shared settings. Use frontmatter when a specific page needs to override the default behavior.

In practice:

- config file defines the default project title, description, colors, socials, and ignore rules
- page frontmatter defines page titles, dates, tags, archive behavior, and one-off project overrides
- when both define the same project key, the Markdown value wins

## Common Page Settings

### `title`

Changes the page title used in the document title and navigation.

```markdown
---
title: My Custom Title
---
```

### `date`

Useful for blog-style archives. Posts with a date are ordered and displayed by date in blog archives.

```markdown
---
date: 2026-03-23
---
```

### `hide`

Generates the page but keeps it out of the menu.

```markdown
---
hide: true
---
```

### `menuChildren`

When added to an archive landing page, the archive children become visible beneath that item in the menu.

```markdown
---
menuChildren: true
---
```

### `archive`

Turns a landing page into an archive listing for the pages in that folder.

```markdown
---
archive: articles
---
```

### `redirect`

Uses a different target URL in menu links and archive links without skipping page generation entirely.

```markdown
---
redirect: https://example.com
---
```

## Useful Project Settings

- `projectTitle`
- `projectDescription`
- `projectLogo`
- `projectStyle`
- `projectStyleOverrule`
- `projectScript`
- `projectIgnore`
- `projectGroupTags`
- `projectCopyFiles`

The [Project Settings](/docs/project-settings/index.html) page explains these project-wide keys in more detail.
