---
title: Customisation
icon: /media/icon_style.svg
tags: documentation
---

# Customisation

Girk gives you a default stylesheet, but it does not trap you inside it.

## Why You Want It

You can start with a working default and then decide how much control you need:

- small tweaks with CSS variables
- project-specific CSS layered on top
- a full stylesheet override when you want complete control
- custom JavaScript for behavior, web components, or client-side mounts

## Main Hooks

- `projectStyle` adds a stylesheet after the generated one
- `projectStyleOverrule` replaces the generated stylesheet completely
- `projectScript` adds classic scripts before `</body>`
- `projectScriptModule` adds `type="module"` scripts before `</body>`

## Config Example

```json
{
  "project": {
    "style": "/assets/site.css",
    "script": "/assets/site.js",
    "scriptModule": "/assets/components.js"
  },
  "colors": {
    "primary": "gray",
    "secondary": "beige"
  }
}
```

## Web Components And Vue

Markdown content allows raw HTML, so you can place a custom element directly in a page and register it from a script.

```md
# Dashboard

<status-panel></status-panel>
```

Use `projectScript` when the file is a browser-ready script. Use `projectScriptModule` when you want an ES module, such as a custom-element bundle or Vue code loaded through the browser module system.

That means you can:

- register custom web components and use them in Markdown
- mount a small Vue app into a placeholder element
- load Vue-based custom elements from a standalone module build

Girk does not compile Vue for you. You still need to ship browser-ready files in `assets/`.

## Live Examples

- [example-basic.girk.dev](https://example-basic.girk.dev/) layers custom CSS on top of the generated stylesheet and shows both a native custom element and a Vue-mounted block
- [example-config.girk.dev](https://example-config.girk.dev/) uses config-driven color roles

## Source Examples

- [`apps/example-basic`](https://github.com/silvandiepen/girk/tree/main/apps/example-basic)
- [`apps/example-config`](https://github.com/silvandiepen/girk/tree/main/apps/example-config)
