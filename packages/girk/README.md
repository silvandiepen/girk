# Girk

Markdown-first static sites without the sprawl.

Girk turns a plain folder of Markdown, media, and a small JSON config into a static site you can deploy anywhere.

Supported Node versions: `20.19+`, `22.12+`, and `24` through `25`.

## Install

Run it directly:

```bash
npx girky
```

Or install it globally:

```bash
npm install --global girky
```

Then run:

```bash
girk
```

## What It Does

Girk keeps the content model simple:

- the file tree becomes the route model
- Markdown stays the source of truth
- frontmatter handles page behavior without extra tooling
- `girk.config.json` keeps shared project defaults in one place
- the output is static HTML, CSS, and assets

Use it for:

- documentation sites
- product and marketing sites
- handbooks and knowledge bases
- blogs and archive-driven sections
- multilingual content trees

## Minimal Project

```text
my-site/
  README.md
  features/
    README.md
    archives.md
  media/
    logo.svg
```

That becomes:

- `/`
- `/features/`
- `/features/archives/`

## Quick Start

1. create a folder with Markdown files
2. run `npx girky`
3. open the generated `public/` folder
4. add frontmatter or config only where needed

## Config Hooks

Useful project hooks:

- `projectStyle` adds a stylesheet after the generated one
- `projectStyleOverrule` replaces the generated stylesheet
- `projectScript` adds classic scripts before `</body>`
- `projectScriptModule` adds `type="module"` scripts before `</body>`

Example:

```json
{
  "project": {
    "title": "My Site",
    "description": "A practical static site",
    "style": "/assets/site.css",
    "scriptModule": "/assets/components.js"
  }
}
```

## Customisation

Girk supports:

- custom CSS layered on top of the default theme
- full stylesheet replacement
- custom JavaScript
- custom web components
- Vue-powered mounts from browser-ready scripts

Girk does not compile Vue for you. You ship browser-ready assets and reference them from project settings.

## Learn More

- Docs: `https://girk.dev`
- Features: `https://girk.dev/features/`
- How to Use: `https://girk.dev/how-to/`
- Examples: `https://girk.dev/examples/`
- Release Notes: `https://girk.dev/release-notes/`

Example sites:

- `https://example-basic.girk.dev/`
- `https://example-multilang.girk.dev/`
- `https://example-config.girk.dev/`
- `https://example-blog.girk.dev/`
- `https://example-recipes.girk.dev/`

## Repository

Source code and docs live in the monorepo:

- package source: [`packages/girk`](https://github.com/silvandiepen/girk/tree/main/packages/girk)
- docs site: [`apps/docs`](https://github.com/silvandiepen/girk/tree/main/apps/docs)
- examples: [`apps`](https://github.com/silvandiepen/girk/tree/main/apps)
