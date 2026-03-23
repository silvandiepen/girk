---
title: Generation Flow
icon: /media/icon_meta.svg
tags: documentation
---

# Generation Flow

Girk follows a predictable pipeline. Understanding that pipeline makes it much easier to set up a project or debug generated output.

## What Happens When You Run `npx girky`

1. Girk scans the current working directory for Markdown files.
2. It reads frontmatter and converts Markdown to HTML.
3. It derives project-wide settings from config files and frontmatter.
4. It removes ignored paths from the discovered file set.
5. It discovers media, logos, thumbnails, favicons, tags, and archives.
6. It builds the menu from the folder landing pages and eligible top-level pages.
7. It generates the stylesheet and copies assets.
8. It writes content pages, tag pages, and `robots.txt` into `public/`.

## Important Behaviors

- the folder structure drives the route structure
- project settings are merged before page generation
- archives are generated from folder landing pages with `archive: ...`
- tags are collected from page frontmatter
- the menu is built from visible top-level pages and archive landing pages

## Order Matters

Several parts of the generator depend on earlier discovery steps:

- project settings must be known before the final page data is assembled
- media discovery must run before logos, favicons, and thumbnails can resolve
- archive pages need their children to already exist in the discovered file set
- menu generation depends on the final filtered file list

If a page or asset seems to be missing, the cause is usually one of these:

- the file is ignored by naming convention or `projectIgnore`
- the page is hidden
- the file is not in a supported location
- the expected landing page is missing
- the asset path does not match the copied output path

## Output Conventions

- `README.md` becomes `public/index.html`
- `docs/README.md` becomes `public/docs/index.html`
- `about.md` becomes `public/about/index.html`
- tag pages are generated under `/tag/...`

## What Girk Does Not Require

- a runtime server
- a CMS
- a component framework
- a separate route config
- a database
