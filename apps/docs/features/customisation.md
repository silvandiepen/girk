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

## Colors

Girk ships with a generated color system. You define project colors in `girk.config.json`, and Girk turns them into CSS variables such as `--color-primary`, `--color-primary-contrast`, `--color-background`, and `--color-foreground`.

### Semantic tokens

These are the main project-level tokens:

- `primary`
- `secondary`
- `background`
- `foreground`
- `error`
- `info`
- `warning`
- `success`

### Palette tokens

These are the built-in palette names you can map the semantic tokens to:

- `red`
- `blue`
- `green`
- `yellow`
- `orange`
- `purple`
- `pink`
- `lime`
- `brown`
- `gray`
- `magenta`
- `beige`
- `dark`
- `light`

### Project color config

You can map semantic roles to palette tokens:

```json
{
  "colors": {
    "primary": "gray",
    "secondary": "beige",
    "background": "light",
    "foreground": "dark",
    "warning": "orange",
    "success": "green"
  }
}
```

You can also override palette values directly:

```json
{
  "colors": {
    "blue": "#2b59ff",
    "beige": "#efe2cf",
    "primary": "blue",
    "secondary": "beige"
  }
}
```

That means:

- `blue` becomes a real project color token
- `primary` resolves to that `blue`
- Girk also generates `--color-blue-contrast` and `--color-primary-contrast`

### What Girk generates

For each configured color token, Girk generates:

- `--color-[token]`
- `--color-[token]-contrast`

Examples:

- `--color-primary`
- `--color-primary-contrast`
- `--color-blue`
- `--color-blue-contrast`

Use those variables in your own CSS:

```css
.hero {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
```

### Section colors from frontmatter

Page and section frontmatter can now use `color` to apply a section-local background and text color.

```md
---
title: Highlighted Section
color: blue
---
```

That maps to:

```css
--section-background-color: var(--color-blue);
--section-text-color: var(--color-blue-contrast);
```

By default, sections fall back to the project theme. When `color` is present, only that section gets the alternate background and text colors.

You can combine it with `style`:

```md
---
title: Callout
color: primary
style: scroll-margin-top: calc(var(--space-xxl) * 2);
---
```

## Default Style Variables

The generated stylesheet is designed to be overridden with CSS variables first, before you reach for selector overrides.

### Core layout and type variables

These variables are defined on `:root` by default:

```css
:root {
  --spacing: clamp(0.95rem, 0.7rem + 0.9vw, 1.25rem);
  --space: var(--spacing);
  --space-xxs: calc(var(--space) * 0.25);
  --space-xs: calc(var(--space) * 0.5);
  --space-s: calc(var(--space) * 0.75);
  --space-l: calc(var(--space) * 1.5);
  --space-xl: calc(var(--space) * 2.5);
  --space-xxl: calc(var(--space) * 4);

  --font-size: 1.0625rem;
  --font-size-xs: calc(var(--font-size) * 0.75);
  --font-size-s: calc(var(--font-size) * 0.875);
  --font-size-l: calc(var(--font-size) * 1.125);
  --font-size-xl: calc(var(--font-size) * 1.35);
  --font-size-xxl: calc(var(--font-size) * 2.4);
  --font-size-xxxl: calc(var(--font-size) * 4.5);
  --font-size-lead: calc(var(--font-size) * 1.4);

  --border-radius: 0.375rem;
  --border-radius-s: calc(var(--border-radius) * 0.5);
  --border-radius-m: var(--border-radius);
  --border-radius-l: calc(var(--border-radius) * 2);
  --border-radius-round: 999px;

  --border-width: 1px;
  --border-width-s: var(--border-width);
  --border-width-m: calc(var(--border-width) * 2);

  --layout-width: calc(var(--font-size) * 82);
  --content-width: 72ch;
}
```

### Form control variables

The default content form styles expose a dedicated variable contract on `.content`. Override these in your project stylesheet when you want to change native inputs without replacing the whole form layer.

```css
.content {
  --form-accent-color: var(--color-primary);
  --form-width: min(100%, 42rem);
  --form-gap: var(--space);
  --form-help-font-size: var(--font-size-s);
  --form-help-opacity: 0.68;
  --form-fieldset-padding: calc(var(--space-s) + var(--space-xs));
  --form-fieldset-gap: var(--space-s);
  --form-fieldset-border-color: color-mix(in srgb, currentColor 12%, transparent);
  --form-fieldset-radius: var(--border-radius-m);
  --form-fieldset-background: color-mix(in srgb, currentColor 2%, transparent);
  --form-legend-padding-x: var(--space-xs);
  --form-legend-font-weight: 650;
  --form-label-gap: var(--space-xs);
  --form-label-font-weight: 600;
  --form-choice-gap: var(--space-s);
  --form-choice-font-weight: 500;
  --form-control-width: min(100%, 42rem);
  --form-control-min-height: calc(var(--space-xl) + var(--space-xs));
  --form-control-padding-y: calc(var(--space-s) + var(--border-width-s));
  --form-control-padding-x: var(--space);
  --form-control-border-color: color-mix(in srgb, currentColor 14%, transparent);
  --form-control-radius: var(--border-radius-m);
  --form-control-background: var(--color-background);
  --form-control-transition-duration: 160ms;
  --form-control-transition-easing: ease;
  --form-control-transition:
    border-color var(--form-control-transition-duration) var(--form-control-transition-easing),
    box-shadow var(--form-control-transition-duration) var(--form-control-transition-easing),
    color var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-select-padding-right: calc(var(--space-xl) + var(--space-s));
  --form-select-indicator-size: 0.35rem;
  --form-select-indicator-offset-y: calc(50% - 0.12rem);
  --form-select-indicator-first-offset-x: 1rem;
  --form-select-indicator-second-offset-x: 0.65rem;
  --form-multiselect-min-height: 9rem;
  --form-multiselect-padding: var(--space-xs);
  --form-multiselect-background: color-mix(
    in srgb,
    var(--color-background) 92%,
    var(--color-foreground) 8%
  );
  --form-multiselect-option-padding-y: calc(var(--space-xxs) + 1px);
  --form-multiselect-option-padding-x: var(--space-s);
  --form-multiselect-selected-background: color-mix(
    in srgb,
    var(--color-primary) 18%,
    var(--color-background)
  );
  --form-textarea-min-height: 8rem;
  --form-color-input-size: calc(var(--space-xl) * 0.5);
  --form-color-input-padding: 0.16rem;
  --form-color-input-radius: var(--border-radius-round);
  --form-color-input-background: color-mix(
    in srgb,
    var(--color-background) 94%,
    var(--color-foreground) 6%
  );
  --form-color-input-transition:
    border-color var(--form-control-transition-duration) var(--form-control-transition-easing),
    box-shadow var(--form-control-transition-duration) var(--form-control-transition-easing),
    background-color var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-range-track-height: 0.45rem;
  --form-range-track-background: color-mix(in srgb, currentColor 14%, transparent);
  --form-range-thumb-size: 1rem;
  --form-range-thumb-offset: -0.275rem;
  --form-range-thumb-border-color: var(--color-primary);
  --form-range-thumb-background: var(--color-background);
  --form-range-thumb-transition:
    box-shadow var(--form-control-transition-duration) var(--form-control-transition-easing),
    border-color var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-choice-size: 1.15rem;
  --form-choice-border-color: color-mix(in srgb, currentColor 22%, transparent);
  --form-choice-background: var(--color-background);
  --form-choice-transition:
    border-color var(--form-control-transition-duration) var(--form-control-transition-easing),
    box-shadow var(--form-control-transition-duration) var(--form-control-transition-easing),
    background-color var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-checkbox-radius: calc(var(--border-radius-s) + 1px);
  --form-checkmark-width: 0.6rem;
  --form-checkmark-height: 0.35rem;
  --form-checkmark-stroke: 0.14rem;
  --form-checkmark-color: var(--color-primary);
  --form-checkmark-offset-y: -0.03rem;
  --form-checkmark-transition:
    transform var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-radio-dot-size: 0.5rem;
  --form-radio-dot-color: var(--color-primary);
  --form-radio-transition:
    transform var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-choice-checked-border-color: var(--color-primary);
  --form-choice-file-width: min(100%, 42rem);
  --form-choice-file-padding: 0.3rem;
  --form-choice-file-border-color: var(--form-control-border-color);
  --form-choice-file-radius: var(--form-control-radius);
  --form-choice-file-background: var(--form-control-background);
  --form-button-min-height: calc(var(--space) * 2.3);
  --form-button-padding-y: calc(var(--space-xs) + var(--border-width-s));
  --form-button-padding-x: var(--space);
  --form-button-radius: var(--border-radius-round);
  --form-button-background: var(--color-primary);
  --form-button-border-color: var(--color-primary);
  --form-button-color: var(--color-primary-contrast);
  --form-button-font-weight: 650;
  --form-button-transition:
    border-color var(--form-control-transition-duration) var(--form-control-transition-easing),
    box-shadow var(--form-control-transition-duration) var(--form-control-transition-easing),
    color var(--form-control-transition-duration) var(--form-control-transition-easing),
    background-color var(--form-control-transition-duration) var(--form-control-transition-easing);
  --form-output-min-height: calc(var(--space-xl) + var(--space-xs));
  --form-output-padding-x: var(--space);
  --form-output-border-color: color-mix(in srgb, currentColor 12%, transparent);
  --form-output-radius: var(--border-radius-m);
  --form-output-background: color-mix(in srgb, currentColor 3%, transparent);
  --form-output-font-weight: 600;
  --form-focus-border-color: var(--color-primary);
  --form-focus-ring-width: calc(var(--border-width-m) + 1px);
  --form-focus-ring-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
  --form-placeholder-color: color-mix(in srgb, currentColor 42%, transparent);
  --form-disabled-opacity: 0.56;
}
```

Example override:

```css
.content {
  --form-control-radius: calc(var(--border-radius) * 1.5);
  --form-control-background: color-mix(in srgb, var(--color-background) 96%, var(--color-primary) 4%);
  --form-button-background: var(--color-secondary);
  --form-button-border-color: var(--color-secondary);
  --form-button-color: var(--color-secondary-contrast);
  --form-color-input-size: calc(var(--space-xl) * 0.9);
  --form-multiselect-selected-background: color-mix(
    in srgb,
    var(--color-secondary) 18%,
    var(--color-background)
  );
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
