---
title: Multilingual Content
icon: ui/globe
tags: documentation
---

# Multilingual Content

Girk supports multilingual content with filename suffixes instead of a separate translation system.

## Why You Want It

Translations stay close to the source files. The project remains easy to read because the translated files live next to the original page.

## How It Looks

```text
README.md
README:nl.md
guide.md
guide:nl.md
```

The default language stays on the base route. Other languages are generated with a language prefix such as `/nl/`.

## What It Gives You

- translated routes
- language switching in the generated UI
- language-specific page content
- language-specific project titles

## Live Example

- [example-multilang.girk.dev](https://example-multilang.girk.dev/)

## Source Example

- [`apps/example-multilang`](https://github.com/silvandiepen/girk/tree/main/apps/example-multilang)
