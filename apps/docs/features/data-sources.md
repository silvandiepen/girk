---
title: Data Sources
icon: /media/icon_settings.svg
tags: documentation
---

# Data Sources

Girk can pull JSON in at build time and use it either to repeat content inside a page or to generate many detail pages from one Markdown template.

## Why You Want It

Use data sources when you want static output without hand-writing the same page structure hundreds of times.

Typical uses:

- product, project, or case-study detail pages
- landing pages that repeat cards or summaries from structured data
- builds that should stay deterministic with local JSON checked into the repo

## What It Gives You

- `dataSource` to load remote JSON or a local JSON file
- `dataItems` to point at the array or object you want to use
- `{{result.field}}` replacements in frontmatter and Markdown
- `{{#each result}} ... {{/each}}` repeated blocks inside a page
- `dataSlug` to fan one template file out into many real routes

Both local files and remote endpoints are resolved during the build, so the final site still deploys as plain static files.

Remote endpoint example:

```markdown
---
dataSource: https://jsonplaceholder.typicode.com/posts
title: Posts
---

{{#each result}}
## {{result.title}}
{{result.body}}
{{/each}}
```

## Example

```markdown
---
dataSource: data/projects.json
dataItems: items
dataSlug: slug
title: {{result.title}}
---

# {{result.title}}

{{result.summary}}
```

## Live Example

- [example-data.girk.dev/projects/](https://example-data.girk.dev/projects/)

## Source Example

- [`apps/example-data`](https://github.com/silvandiepen/girk/tree/main/apps/example-data)
