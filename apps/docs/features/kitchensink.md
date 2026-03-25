---
title: Kitchen Sink
icon: /media/icon_kitchensink.svg
tags: documentation
---

# Kitchen Sink

This page shows how Girk renders common content and native HTML controls before you add any project-specific components or CSS.

## Why You Want It

Use this page when you need a quick visual check for the generated defaults:

- headings and body copy
- lists, quotes, and tables
- inline code and fenced code blocks
- native HTML forms with `--color-primary` as the accent color

## Typography And Content

This paragraph is normal body copy. It shows the default measure, spacing, and tone of the generated stylesheet. If you need a callout, a table, or a form right inside Markdown, this is the baseline you are starting from.

> Girk aims to make plain HTML look deliberate before you start layering project styles on top.

### Mixed content

- one list item with enough text to show line length and spacing
- a second item with `inline code` and a [standard link](/features/customisation/index.html)
- a third item that exists only to show consistent defaults across elements

#### Small data table

| Element | What it demonstrates | Why it matters |
| --- | --- | --- |
| Heading | scale and spacing | sets the visual hierarchy |
| Table | responsive table defaults | keeps structured content readable |
| Form control | native input styling | gives plain HTML a usable baseline |

## Code

```html
<label for="email">Email</label>
<input id="email" name="email" type="email" placeholder="hello@example.com" />
```

## Semantic Elements

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

## Form Controls

The form below is intentionally plain HTML. No framework classes, no custom components, just the generated defaults for native controls.

<form action="#" method="post">
<input type="hidden" name="source" value="kitchensink" />

<label for="kitchen-name">
Name
<input id="kitchen-name" name="name" type="text" placeholder="John Doe" />
</label>

<label for="kitchen-search">
Search
<input id="kitchen-search" name="search" type="search" placeholder="Search docs" />
</label>

<label for="kitchen-email">
Email
<input id="kitchen-email" name="email" type="email" autocomplete="email" placeholder="john@example.com" />
</label>

<label for="kitchen-password">
Password
<input id="kitchen-password" name="password" type="password" value="password123" />
</label>

<label for="kitchen-phone">
Telephone
<input id="kitchen-phone" name="phone" type="tel" placeholder="+356 9999 0000" />
</label>

<label for="kitchen-url">
URL
<input id="kitchen-url" name="website" type="url" placeholder="https://example.com" />
</label>

<label for="kitchen-number">
Number
<input id="kitchen-number" name="team-size" type="number" min="1" max="50" value="12" />
</label>

<label for="kitchen-date">
Date
<input id="kitchen-date" name="launch-date" type="date" value="2026-03-25" />
</label>

<label for="kitchen-time">
Time
<input id="kitchen-time" name="launch-time" type="time" value="09:30" />
</label>

<label for="kitchen-datetime">
Datetime Local
<input id="kitchen-datetime" name="launch-datetime" type="datetime-local" value="2026-03-25T09:30" />
</label>

<label for="kitchen-month">
Month
<input id="kitchen-month" name="billing-month" type="month" value="2026-03" />
</label>

<label for="kitchen-week">
Week
<input id="kitchen-week" name="sprint-week" type="week" value="2026-W13" />
</label>

<label for="kitchen-role">
Select
<select id="kitchen-role" name="role">
<option value="">Choose one</option>
<option>Designer</option>
<option>Developer</option>
<option>Content editor</option>
</select>
</label>

<label for="kitchen-stack">
Multi Select
<select id="kitchen-stack" name="stack" multiple size="4">
<option selected>HTML</option>
<option selected>CSS</option>
<option>JavaScript</option>
<option>TypeScript</option>
</select>
</label>

<label for="kitchen-country">
Datalist
<input id="kitchen-country" name="country" list="kitchen-country-list" placeholder="Start typing a country" />
</label>
<datalist id="kitchen-country-list">
<option value="Malta"></option>
<option value="Netherlands"></option>
<option value="Portugal"></option>
<option value="Sweden"></option>
</datalist>

<label for="kitchen-message">
Textarea
<textarea id="kitchen-message" name="message" placeholder="Describe what you want to publish."></textarea>
</label>

<label for="kitchen-color">
Color
<input id="kitchen-color" name="accent" type="color" value="#e2921b" />
</label>

<label for="kitchen-range">
Range
<input id="kitchen-range" name="volume" type="range" min="0" max="100" value="72" />
</label>

<label for="kitchen-output">
Output
<output id="kitchen-output" name="summary" for="kitchen-number kitchen-range">12 seats, 72% ready</output>
</label>

<label for="kitchen-file">
File
<input id="kitchen-file" name="attachment" type="file" />
</label>

<fieldset>
<legend>Checkboxes</legend>
<label>
<input type="checkbox" name="updates" checked />
<span>
Send product updates
<small>One short summary each month.</small>
</span>
</label>
<label>
<input type="checkbox" name="security" />
<span>
Send security notices
<small>Only when action is required.</small>
</span>
</label>
</fieldset>

<fieldset>
<legend>Radios</legend>
<label>
<input type="radio" name="format" value="email" checked />
<span>Email</span>
</label>
<label>
<input type="radio" name="format" value="rss" />
<span>RSS</span>
</label>
</fieldset>

<label for="kitchen-disabled">
Disabled
<input id="kitchen-disabled" name="disabled" type="text" value="Not editable yet" disabled />
</label>

<label for="kitchen-readonly">
Readonly
<input id="kitchen-readonly" name="readonly" type="text" value="Preview only" readonly />
</label>

<input type="submit" value="Submit form" />
<input type="reset" value="Reset form" />
<button type="button">Plain button</button>
</form>
