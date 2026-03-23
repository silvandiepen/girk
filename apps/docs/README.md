---
projectTitle: Girk
projectDescription: Minimal static sites from Markdown with routes, archives, tags, media, and multilingual pages.
projectGroupTags: true
hide: true
---

# Girk

Girk is a Markdown-first static site generator. It turns a folder tree into a deployable site in `public/` without asking you to define routes, components, or a CMS model first.

## Quick Start

```bash
npx girky
```

Run that command inside any folder that contains Markdown files. Girk scans the project, derives routes from the file structure, copies assets, generates HTML, and writes the output to `public/`.

## Mental Model

- every `.md` file is a page candidate
- `README.md` and `index.md` become the landing page for their folder
- folders become URL segments
- frontmatter controls page behavior and project behavior
- `media/` and `assets/` are copied into the generated site
- a root `girk.config.json` can provide project defaults

## What Girk Handles

- flat pages and nested documentation trees
- article, blog, collection, and section-style archives
- copied media and assets
- language variants through filename suffixes like `README:nl.md`
- project-level settings from frontmatter or `girk.config.json`
- tags, redirects, custom styles, and custom scripts

## Minimal Example

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

That becomes:

- `/`
- `/about/`
- `/docs/`
- `/docs/getting-started/`
- copied media under the generated output

## Read Next

- [Project Structure](/docs/structure/index.html) for the route and folder rules
- [Generation Flow](/docs/generation/index.html) for the build pipeline
- [Settings](/docs/settings/index.html) for config precedence and JSON config
- [Meta](/docs/meta/index.html) for the important frontmatter keys
- [AI Usage](/docs/ai/index.html) for briefing an AI to create or maintain a Girk project

The docs site source lives in [`apps/docs`](https://github.com/silvandiepen/girk/tree/master/apps/docs), and the package source lives in [`packages/girk`](https://github.com/silvandiepen/girk/tree/master/packages/girk).
