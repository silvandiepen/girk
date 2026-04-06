---
title: Icons
icon: ui/file-star
color: yellow
tags: documentation
---

# Icons

Girk lets a page define an `icon` in frontmatter so that the icon can appear anywhere the page is surfaced in generated UI.

## What Open Icon Is

Girk integrates with [Open Icon](https://open-icon.org/), which is a shared SVG icon catalog with:

- official icon names such as `ui/grid`
- generated lookup helpers
- a raw SVG package for build tooling

In Girk, that means you do not need to copy a custom icon file into every project just to get a consistent page icon.

## How Girk Uses It

When a page has an `icon`, Girk resolves it at build time and can render it in:

- navigation items
- archive cards
- related page cards

That means one frontmatter value drives the same page icon across the generated site.

Open Icon values are resolved to SVG during the build, so Girk can inline them directly into the generated HTML.

## Icon Sources

`icon` accepts either:

- an Open Icon lookup
- a normal asset path

Open Icon examples:

```markdown
---
icon: ADD
---
```

```markdown
---
icon: ui/grid
---
```

Asset path example:

```markdown
---
icon: /media/logo.svg
---
```

## Open Icon Values

Girk resolves Open Icon values through the official Open Icon catalog.

You can use:

- a direct catalog name such as `ui/grid`
- a catalog-style key such as `UI_GRID`
- a shorthand such as `ADD`, which resolves to the matching medium UI icon when one exists

Browse the icon catalog at [open-icon.org](https://open-icon.org/).

## Build Output

There are two main outcomes:

- Open Icon values are resolved to inline SVG
- local SVG assets can also be inlined when Girk can read them during the build

For raster files or normal non-SVG asset paths, Girk keeps them as regular file references instead.

## Example

```markdown
---
title: Install
icon: ui/folder-star
order: 10
---
```

## Choosing Between Open Icon And Assets

Use Open Icon when:

- you want shared UI symbols across projects
- you want icons in navigation and cards without maintaining custom SVG files
- the icon should fit the same visual language as the rest of the generated site

Use an asset path when:

- the icon is brand-specific
- the icon is not part of the shared catalog
- you need a project-owned illustration instead of a UI symbol

## Practical Advice

- use explicit names such as `ui/grid` when you know the exact icon you want
- use shorthand values such as `ADD` only when the medium UI default is what you want
- use local asset paths when the icon is project-specific and not part of the shared icon catalog
- prefer SVG assets over raster files when you want them to scale cleanly in the generated UI

## Related Features

- [Page Frontmatter](/features/metadata/index.html)
- [Media and Assets](/features/media/index.html)
