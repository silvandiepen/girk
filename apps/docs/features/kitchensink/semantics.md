---
title: Code And Semantic Elements
order: 2
color: beige
---

## Code And Semantic Elements

```html
<label for="email">Email</label>
<input id="email" name="email" type="email" placeholder="hello@example.com" />
```

Use <abbr title="Application Programming Interface">API</abbr> labels, highlight text with <mark>mark</mark>, and show shortcuts like <kbd>Cmd</kbd> + <kbd>K</kbd> without reaching for custom classes.

H<sub>2</sub>O and E = mc<sup>2</sup> should also look sane out of the box.

<details>
  <summary>Expandable content with native details/summary</summary>
  <p>
    This block uses the browser's native disclosure element, but it should still
    feel like it belongs in the generated design system.
  </p>
</details>

<figure>
  <svg viewBox="0 0 280 120" role="img" aria-labelledby="kitchen-figure-title">
    <title id="kitchen-figure-title">Example figure</title>
    <rect
      x="0"
      y="0"
      width="280"
      height="120"
      rx="12"
      fill="none"
      stroke="currentColor"
      opacity="0.2"
    ></rect>
    <circle cx="60" cy="60" r="24" fill="var(--color-primary)"></circle>
    <path
      d="M120 34h112M120 60h84M120 86h96"
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      opacity="0.38"
    ></path>
  </svg>
  <figcaption>A plain figure with figcaption should inherit the same visual language.</figcaption>
</figure>

<p>
  Progress
  <progress max="100" value="72">72%</progress>
</p>

<p>
  Meter
  <meter min="0" max="100" low="35" high="80" optimum="90" value="68">68</meter>
</p>

### Articles

Semantic article markup should also inherit the default content styling.

<article>
  <h3>Raw HTML article</h3>
  <p>
    This uses a plain <code>article</code> tag inside Markdown content.
  </p>
  <p>
    That keeps long-form pages semantic without needing custom CSS first.
  </p>
</article>

You can also generate the same element directly from Markdown:

```markdown
:::article type="info" title="Note" subtitle="Authoring pattern" date="2026-03-27" description="Use article containers when a block needs a semantic wrapper and shared color styling."
This article assumes basic Markdown knowledge.

Add `color="warning"` when you want a direct palette token, or `class="editorial-note"` when you need an extra project hook.
:::
```

:::article type="info" title="Note" subtitle="Authoring pattern" date="2026-03-27" description="Use article containers when a block needs a semantic wrapper and shared color styling."
This article assumes basic Markdown knowledge.

Add `color="warning"` when you want a direct palette token, or `class="editorial-note"` when you need an extra project hook.
:::
