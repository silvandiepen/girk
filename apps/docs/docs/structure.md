---
title: Project Structure
icon: /media/icon_project.svg
tags: documentation
---

# Project Structure

Girk derives routes from folders and filenames. You do not define a route table separately.

## Basic Rules

- every `.md` file becomes content
- `README.md` and `index.md` become the landing page for their folder
- other Markdown files become nested routes ending in `/index.html`
- folders named with a leading `_` are ignored during discovery
- files with a leading `-` are skipped as standalone pages
- the generated site is written to `public/`

## Example

```text
my-site/
  README.md
  about.md
  docs/
    README.md
    getting-started.md
  media/
    logo.svg
```

This becomes:

- `/`
- `/about/`
- `/docs/`
- `/docs/getting-started/`

## Landing Pages And Children

If a folder contains a `README.md`, that file becomes the page for the folder itself and the other Markdown files become its children.

```text
docs/
  README.md
  settings.md
  meta.md
```

This becomes:

- `/docs/`
- `/docs/settings/`
- `/docs/meta/`

That pattern is the foundation for nested documentation and archive landing pages.

## Language Variants

Girk uses filename suffixes to represent alternate languages.

```text
README.md
README:nl.md
guide.md
guide:nl.md
```

The default language is English. Non-default languages are generated with a language prefix in the URL, so a Dutch version becomes routes such as `/nl/guide/`.

## Ignored And Supporting Files

- folders starting with `_` are ignored completely
- files starting with `-` are not generated as pages
- `media/` and `assets/` are copied, not converted into routes

This lets you keep notes, fragments, source files, and design assets next to the content without publishing them as standalone pages.

## Assets And Media

If your project contains `media/` or `assets/`, Girk copies those folders into the generated site. Logo discovery, favicons, and page images all build on top of that.
