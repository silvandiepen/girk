---
title: Styling
icon: /media/icon_style.svg
tags: documentation
---

# Styling

Girk gives you a default stylesheet, but it does not trap you inside it.

## Why You Want It

You can start with a working default and then decide how much control you need:

- small tweaks with CSS variables
- project-specific CSS layered on top
- a full stylesheet override when you want complete control

## Main Hooks

- `projectStyle` adds a stylesheet after the generated one
- `projectStyleOverrule` replaces the generated stylesheet completely

## Config Example

```json
{
  "project": {
    "style": "/assets/site.css"
  },
  "colors": {
    "primary": "gray",
    "secondary": "beige"
  }
}
```

## Live Examples

- [example-basic.girk.dev](https://example-basic.girk.dev/) layers custom CSS on top of the generated stylesheet
- [example-multilang.girk.dev](https://example-multilang.girk.dev/) replaces the default stylesheet entirely
- [example-config.girk.dev](https://example-config.girk.dev/) uses config-driven color roles

## Source Examples

- [`apps/example-basic`](https://github.com/silvandiepen/girk/tree/main/apps/example-basic)
- [`apps/example-multilang`](https://github.com/silvandiepen/girk/tree/main/apps/example-multilang)
- [`apps/example-config`](https://github.com/silvandiepen/girk/tree/main/apps/example-config)
