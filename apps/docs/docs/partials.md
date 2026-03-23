# Partials

Every Markdown file normally creates its own page. Files starting with `-` are skipped during standalone page generation, which makes them useful for keeping supporting content or work-in-progress content next to a page without publishing it directly.

```text
docs/
  README.md
  -draft-notes.md
  intro.md
```

Today, Girk treats the `-` prefix primarily as an exclusion from page generation. If you want one long page assembled from several child files, use an archive with `archive: sections` instead.

Use this for:

- notes that should live next to a page
- fragments you want to keep in the repo
- source material that should not become a route
