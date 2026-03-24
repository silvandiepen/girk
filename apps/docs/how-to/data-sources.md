---
title: Use Data Sources
icon: /media/icon_settings.svg
tags: documentation
---

# Use Data Sources

Data sources let one Markdown file pull JSON at build time and either repeat over it inside the page or generate many sibling pages from one template.

## Source Types

- remote JSON endpoints such as `https://example.com/projects.json`
- local JSON files such as `data/projects.json`

Local files are resolved from the project root where you run Girk.

## Repeat Inside One Page

```markdown
---
dataSource: data/projects.json
dataItems: items
title: Projects
---

# Projects

{{#each result}}
## [{{result.title}}](/projects/{{result.slug}}/)

{{result.summary}}
{{/each}}
```

Use this when you want one static page to render a list, grid, or summary block from structured data.

## Use A Remote Endpoint

`dataSource` can also point at a real JSON endpoint. For example, JSONPlaceholder returns an array from `https://jsonplaceholder.typicode.com/posts`:

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

Girk fetches that endpoint during the build, not in the browser at runtime.

## Generate Detail Pages

Create a template file such as `projects/-detail.md`:

```markdown
---
dataSource: data/projects.json
dataItems: items
dataSlug: slug
title: {{result.title}}
description: {{result.summary}}
---

# {{result.title}}

{{result.summary}}
```

Girk will fetch the source, take each item from `dataItems`, and generate real pages such as `/projects/atlas/` and `/projects/beacon/`.

## Template Rules

- use `{{result.field}}` for replacements
- use dotted paths such as `{{result.author.name}}` when needed
- use `{{#each result}} ... {{/each}}` only when `result` is an array
- use a leading `-` in the template filename when the source file itself should not become a route

## Practical Advice

- prefer local JSON when you want deterministic builds and repository-backed content
- prefer remote JSON when the build should reflect an external system
- keep slugs stable, because `dataSlug` becomes the route
- expect remote builds to fail if the endpoint is unavailable or returns invalid JSON
