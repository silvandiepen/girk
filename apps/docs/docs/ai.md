---
title: AI Usage
icon: /media/icon_settings.svg
tags: documentation
---

# AI Usage

If you want an AI assistant to generate or maintain a Girk project, the most useful thing you can do is give it the project root and tell it to follow Girk's file-structure rules. Girk works well with AI because the project model is explicit and file-based.

## What An AI Should Know About Girk

- content lives in Markdown files
- routes come from folders and filenames
- `README.md` or `index.md` is the landing page for a folder
- frontmatter controls titles, archives, tags, redirects, and project settings
- `media/` and `assets/` are copied to the generated output
- the site is generated into `public/`

## What To Tell The AI First

Tell the AI:

- whether it is creating a new Girk site or editing an existing one
- the folder structure you want it to produce
- which files should be landing pages with `README.md`
- whether any folder should be an archive
- the project title, description, logo path, and any custom CSS
- whether you need translations, tags, redirects, or copied files

If the AI understands those rules, it can usually scaffold the project correctly without extra framework-specific instructions.

## Good Prompt Shape

Tell the AI:

- the pages or sections you want
- the folder structure it should create
- which pages should be archive landing pages
- the project title, description, and branding
- whether you need tags, translations, redirects, custom styles, or copied files

## Example Prompt

```text
Create a Girk documentation site for a design system.
Use README.md as the homepage, add docs/README.md as the docs landing page,
create docs/components.md and docs/tokens.md, add a media/logo.svg,
set projectTitle to "Acme Design System", and generate a simple custom stylesheet.
```

## Best Practice

When you ask an AI to work on a Girk project, point it to:

- [Project Structure](/docs/structure/index.html)
- [Generation Flow](/docs/generation/index.html)
- [Settings](/docs/settings/index.html)
- [Meta](/docs/meta/index.html)

That gives it the routing model, the config model, and the key frontmatter surface in one place.

## Useful Constraint To Add

If you want better results, tell the AI:

> Keep the site Markdown-first. Do not add a framework, route config, or CMS layer unless I explicitly ask for one.

That keeps the solution aligned with Girk instead of drifting into a different toolchain.
