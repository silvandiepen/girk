---
title: AI Reference
icon: /media/icon_settings.svg
tags: documentation
---

# AI Reference

This page is written to be fed to an AI assistant that needs to understand Girk quickly and correctly.

## What Girk Is

Girk is a Markdown-first static site generator. It turns a folder tree into a static website in `public/`.

## The Core Model

- Markdown files are content pages
- folders define route structure
- `README.md` or `index.md` becomes the landing page for a folder
- frontmatter controls page behavior
- `girk.config.json` can define project defaults
- `media/` and `assets/` are copied into the generated output

## Important Behaviors

- normal Markdown files generate routes
- files starting with `-` do not generate standalone pages
- folders starting with `_` are ignored
- `archive` on a landing page turns a folder into a generated archive
- `menuChildren: true` exposes archive children in the navigation
- multilingual content uses filename suffixes such as `:nl`

## Common Frontmatter Keys

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

## Common Project Keys

- `projectTitle`
- `projectDescription`
- `projectLogo`
- `projectStyle`
- `projectStyleOverrule`
- `projectScript`
- `projectIgnore`
- `projectGroupTags`
- `projectCopyFiles`

## Routing Rules

Example:

```text
README.md -> /
about.md -> /about/
features/README.md -> /features/
features/archives.md -> /features/archives/
```

## Multilingual Rules

Example:

```text
README.md
README:nl.md
guide.md
guide:nl.md
```

The default language stays on the base route. Other languages are generated with a language prefix such as `/nl/`.

## Configuration Rules

- use frontmatter for page-specific behavior
- use `girk.config.json` for shared project defaults
- if the same project key exists in both places, frontmatter wins

## Output

Girk writes the generated site to `public/`.

## Constraint For AI Assistants

When working on a Girk project:

- keep the project Markdown-first
- prefer file structure and frontmatter over adding new abstraction layers
- do not add a framework, route config, or CMS layer unless explicitly asked
