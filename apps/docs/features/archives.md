---
title: Archives
icon: /media/icon_archive.svg
tags: documentation
---

# Archives

Archives turn a folder landing page into a generated overview of its child pages.

## Why You Want It

Use archives when a folder should become more than just a route segment.

Typical uses:

- a docs section with article cards
- a blog or changelog
- a guide section with child pages in the menu
- a long page assembled from several child files

## What It Gives You

- `articles` for documentation and structured overviews
- `blog` for dated posts
- `sections` for one long page made from child files, without standalone child routes
- `collection` for grouped content without the blog treatment

## How You Turn It On

```markdown
---
archive: articles
menuChildren: true
---
```

## Live Examples

- [example-basic.girk.dev](https://example-basic.girk.dev/) shows article, blog, and section archives in one project
- [example-blog.girk.dev](https://example-blog.girk.dev/) is a smaller archive-focused example

## Source Examples

- [`apps/example-basic`](https://github.com/silvandiepen/girk/tree/main/apps/example-basic)
- [`apps/example-blog`](https://github.com/silvandiepen/girk/tree/main/apps/example-blog)
