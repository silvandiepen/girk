---
projectTitle: Girk
projectDescription: Generate pragmatic static sites from Markdown, files, and a small set of settings.
projectGroupTags: true
projectSearch: true
hide: true
---

# Girk

Markdown-first static sites without the sprawl.

Girk turns a plain folder of Markdown, media, and a small JSON config into a static site you can deploy anywhere.

## Why Girk

Most static site workflows get harder as soon as the content grows. Girk goes the other direction: the file tree stays the project model, Markdown stays the source of truth, and the generated site stays easy to host.

## What You Build With It

- documentation sites
- product and marketing sites
- handbooks and knowledge bases
- blogs, journals, and archive-driven sections
- multilingual content trees

## What You Get

- the file tree is the route model
- Markdown stays the source of truth
- frontmatter handles page behavior without extra tooling
- `girk.config.json` keeps shared project defaults in one place
- the output is static HTML, CSS, and assets

## Why Teams Choose It

- content stays readable in Git
- structure is obvious without learning a framework
- design can be changed without replacing the content workflow
- AI tools can understand the project model quickly
- the generated output is portable and deployment-friendly

## Start In One Command

```bash
npx girky
```

Run that in a folder that contains Markdown files. Girk scans the project, derives routes from the structure, applies frontmatter and config, and writes the generated site to `public/`.

## How It Works

1. create a content tree with Markdown files
2. add frontmatter or config only where needed
3. run the generator
4. deploy the generated `public/` folder

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

## Core Features

- generated pages from Markdown
- archive layouts for grouped content
- copied media and assets
- multilingual support
- theme variables and styling hooks
- route and menu control through frontmatter
- optional static search with local query shards

## Good Fit If

- you want a content-first site without a CMS
- you want route structure to come from folders instead of config files
- you want a small setup that AI can reason about correctly
- you want to ship documentation or marketing content fast

## Stay Up To Date

If you want the shortest path to what changed recently, start with the release notes.

- [Release Notes](/release-notes/index.html) gives you versioned summaries for published releases.

## Explore Girk

- [Features](/features/index.html) explains the main product capabilities.
- [Examples](/examples/index.html) shows complete projects, live results, and source code.
- [How to Use](/how-to/index.html) explains how to structure, configure, and ship a project with Girk.
- [Release Notes](/release-notes/index.html) tracks user-facing changes across published versions.

## Why It Works Well With AI

Girk is easy for AI tools to understand because:

- the file tree is the route model
- the Markdown files are the content model
- frontmatter and config are the behavior model

That makes it much easier to ask an AI to generate or maintain a Girk project without introducing a second abstraction layer.
