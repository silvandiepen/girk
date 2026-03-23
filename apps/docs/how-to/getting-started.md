---
title: Getting Started
icon: /media/icon_settings.svg
tags: documentation
---

# Getting Started

The fastest way to understand Girk is to run it in a tiny folder of Markdown files.

## 1. Create A Folder

```text
my-site/
  README.md
  about.md
```

## 2. Add Content

`README.md`

```markdown
# My Site

This is the homepage.
```

`about.md`

```markdown
# About

This is the about page.
```

## 3. Run Girk

```bash
npx girky
```

## 4. Check The Output

Girk writes the generated site to `public/`.

You now have:

- `/index.html`
- `/about/index.html`

## What To Do Next

- add folders when you want nested routes
- add frontmatter when you want ordering, redirects, or archives
- add `girk.config.json` when you want project defaults
- add `media/` or `assets/` when you need logos, images, or CSS
