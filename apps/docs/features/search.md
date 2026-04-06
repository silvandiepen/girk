---
title: Search
icon: ui/file-info
color: blue
tags: documentation
---

# Search

Girk can generate a fully static search index at build time and attach a built-in search UI, so a project can offer local search without a database or any external service.

## Turn It On

Enable it once in `girk.config.json`:

```json
{
  "projectSearch": true
}
```

That is enough to make Girk generate search assets for any normal content tree and add the default search control to the site header.

You can also enable search more narrowly in frontmatter:

```markdown
---
search: true
---
```

That enables the built-in search UI on just that page.

```markdown
---
archiveSearch: true
archive: sections
---
```

When placed on an archive landing page, that enables the search UI on the archive page and on the pages inside that archive.

## What It Builds

When search is enabled, Girk writes:

- `/assets/search/manifest.json`
- one or more JSON shards with the indexed pages
- `/assets/search/client.js`

The build only indexes routable content pages. Hidden pages, redirects, and section-archive child pages are skipped automatically.

## How The Index Stays Generic

The search index is built from the same data every Girk project already has:

- page title
- description
- first paragraph or excerpt
- headings
- tags
- a capped plain-text body extract

That means search does not depend on a docs-specific layout, custom taxonomy, or a separate content registry.

## Default UI

When `projectSearch` is enabled, Girk automatically adds:

- a small search icon button in the header
- a centered search overlay when that button is clicked
- focused input on open
- live result links while you type

That means search does not need its own route or a visible search input in the page content by default.

## Optional Tuning

You can keep the default behavior, or tune it when a project grows:

```json
{
  "projectSearch": true,
  "projectSearchSharding": "section",
  "projectSearchBodyLimit": 1600
}
```

- `projectSearchSharding` accepts `auto`, `language`, or `section`
- `projectSearchBodyLimit` controls how much plain-text body content each page contributes to the index

Pages can also opt out or override their search label:

```markdown
---
search: false
searchTitle: Search Setup
searchExcerpt: Build a local search index for a static Girk site.
---
```

## Query Scope

By default, the built-in client searches the current page language across the whole project.

You can optionally narrow that with `searchScope`:

```markdown
---
search: true
searchScope: archive
---
```

Available values:

- `project` searches the full project for the current language
- `archive` narrows results to the current archive branch
- `page` narrows results to the current page

## Why This Works Well

- the generated site stays fully static
- there is no crawler step after the build
- large sites can split the index into shards
- the built-in client is optional, so projects can still build a custom UI on top of the same static files

## Related Features

- [Page Metadata](/features/metadata/index.html)
- [Data Sources](/features/data-sources/index.html)
- [Customisation](/features/customisation/index.html)
