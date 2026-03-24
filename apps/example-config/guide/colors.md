---
title: Color Roles
order: 10
color: primary
---

# Color Roles

This page exists to show config-driven color roles such as `primary`, `secondary`, `background`, and `foreground`.

## Project Theme

The example config maps semantic project tokens in `girk.config.json`.

```json
{
  "colors": {
    "primary": "gray",
    "secondary": "beige",
    "background": "light",
    "foreground": "dark"
  }
}
```

## Section Color

This section uses frontmatter `color: primary`, so only this section picks up the project primary color and its contrast text color.
