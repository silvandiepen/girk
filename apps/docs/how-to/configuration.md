---
title: Configure a Project
icon: ui/settings
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
    "logo": "/assets/logo.svg",
    "style": "/assets/site.css",
    "scriptModule": "/assets/components.js"
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
- `projectScriptModule`
- `projectIgnore`
- `projectGroupTags`
- `projectCopyFiles`

## Colors In `girk.config.json`

Use the top-level `colors` object for theme tokens.

```json
{
  "colors": {
    "primary": "gray",
    "secondary": "beige",
    "background": "light",
    "foreground": "dark"
  }
}
```

The values can be:

- built-in palette tokens such as `blue`, `gray`, `beige`, `dark`, and `light`
- direct color values such as `#2b59ff`

Girk then generates CSS variables such as:

- `--color-primary`
- `--color-primary-contrast`
- `--color-background`
- `--color-foreground`

For the full color model and section color behavior, see [Customisation](/features/customisation/).

## Custom CSS And JS

Use flat project keys in frontmatter when you want a page to define project-wide hooks:

```md
---
projectStyle: /assets/custom.css
projectScript: /assets/custom.js
projectScriptModule: /assets/components.js
---
```

Use `projectScriptModule` for module scripts such as web components or standalone Vue code.

## Precedence

If the same project key exists in both the config file and frontmatter, the frontmatter value wins.

## Live Example

- [example-config.girk.dev](https://example-config.girk.dev/)

## Source Example

- [`apps/example-config`](https://github.com/silvandiepen/girk/tree/main/apps/example-config)
