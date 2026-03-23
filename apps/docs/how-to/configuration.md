---
title: Configure a Project
icon: /media/icon_settings.svg
tags: documentation
---

# Configure a Project

Use frontmatter for page-specific behavior and `girk.config.json` for project defaults.

## When To Use A Config File

Use a config file when you want to define shared project settings once instead of repeating them in Markdown frontmatter.

## Example `girk.config.json`

```json
{
  "project": {
    "title": "Acme Docs",
    "description": "Internal product documentation",
    "logo": "/assets/logo.svg"
  },
  "colors": {
    "primary": "gray",
    "secondary": "beige"
  }
}
```

## Useful Project Keys

- `projectTitle`
- `projectDescription`
- `projectLogo`
- `projectStyle`
- `projectStyleOverrule`
- `projectScript`
- `projectIgnore`
- `projectGroupTags`
- `projectCopyFiles`

## Precedence

If the same project key exists in both the config file and frontmatter, the frontmatter value wins.

## Live Example

- [example-config.girk.dev](https://example-config.girk.dev/)

## Source Example

- [`apps/example-config`](https://github.com/silvandiepen/girk/tree/main/apps/example-config)
