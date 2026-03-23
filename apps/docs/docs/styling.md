---
icon: /media/icon_style.svg
tags: documentation
---

# Styling

Girk generates a default stylesheet, but you can layer your own CSS on top of it or replace it entirely.

## Two Styling Hooks

- `projectStyle` adds a stylesheet after the generated default stylesheet
- `projectStyleOverrule` replaces the default stylesheet completely

## Design Tokens

The generated stylesheet exposes a token system built around:

- `--spacing` and the derived `--space-*` scale
- `--font-size` and the derived `--font-size-*` scale
- `--border-radius` and the derived `--border-radius-*` scale
- `--color-*` variables for project colors, backgrounds, foregrounds, and contrast colors

In most projects, you only need to override those values and a few layout rules.

```css
:root {
  --spacing: 1rem;
  --font-size: 1rem;
  --color-primary: #111111;
}
```

## Custom CSS Example

```markdown
---
projectStyle: /assets/custom.css
---
```

```css
body {
  letter-spacing: -0.01em;
}

.header {
  border-bottom-width: 2px;
}
```

## Sass

If you prefer Sass, point `projectStyle` to a compiled CSS file that is copied into your project assets. Girk itself does not need to understand your Sass source, it only needs the final CSS file it can link in the output.

If you want full visual control, use `projectStyleOverrule` and provide a complete stylesheet instead of layering on top of the generated one.

That split keeps simple projects simple while still allowing full overrides when needed.
