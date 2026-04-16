---
title: Structure a Project
icon: ui/folder
tags: documentation
---

# Structure a Project

Girk gets its routes from the file tree, so the structure of the folder matters.

## Basic Rules

- every `.md` file is a page candidate
- `README.md` and `index.md` become the landing page for a folder
- other Markdown files become nested routes
- `media/` and `assets/` are copied into the output
- folders starting with `_` are ignored
- files starting with `-` stay in the project but do not become standalone pages

## Example

```text
my-site/
  README.md
  about.md
  features/
    README.md
    archives.md
```

This becomes:

- `/`
- `/about/`
- `/features/`
- `/features/archives/`

## Sections And Supporting Files

If you want one long page made from child files, use `archive: sections` on the folder landing page. Those child files render into the parent page and do not generate standalone routes. Use files starting with `-` when you want source material that should stay out of routing entirely.

The folder landing page is also where section-level behavior belongs. If a whole section should opt into or out of a feature, set that frontmatter on the folder `README.md` or `index.md`.

## Language Variants

Use suffixes such as `:nl` for translated versions:

```text
README.md
README:nl.md
guide.md
guide:nl.md
```
