---
title: SDK
icon: ui/code
tags: documentation
---

# SDK

Girk can be used as an SDK to build sites from in-memory data, without any filesystem access.

## When to use the SDK

- Serverless functions and edge workers
- Building sites from uploaded documents
- Programmatic site generation in other Node.js projects
- Testing and CI pipelines

## Install

```bash
npm install girky
```

Or install the SDK only (no CLI):

```bash
npm install girk-sdk
```

## Basic usage

```ts
import { build } from "girky";

const result = await build({
  files: [
    { path: "/index.md", content: "# Hello world\n\nWelcome to my site." },
    { path: "/about.md", content: "# About\n\nSome about text." },
  ],
});

console.log(result.files);   // array of output files
console.log(result.pages);   // array of page metadata
console.log(result.languages); // ["en"]
```

## With media

```ts
const result = await build({
  files: [
    { path: "/index.md", content: "# Hello\n\n![Photo](/media/photo.jpg)" },
  ],
  media: [
    { path: "/media/photo.jpg", content: imageBuffer, contentType: "image/jpeg" },
  ],
});
```

Media is passed through as-is. No image processing, no thumbnails.

## With config

```ts
const result = await build({
  files: [
    { path: "/index.md", content: "# My Site" },
  ],
  config: {
    projectTitle: "My Site",
    projectUrl: "https://example.com",
  },
});
```

## Multilingual

Explicit languages:

```ts
const result = await build({
  files: [
    { path: "/index.md", content: "# Home" },
    { path: "/index:nl.md", content: "# Home" },
  ],
  languages: ["en", "nl"],
});
```

Or auto-detect from filenames — files with `:nl` suffix are parsed as Dutch:

```ts
const result = await build({
  files: [
    { path: "/index.md", content: "# Home" },
    { path: "/index:nl.md", content: "# Welkom" },
  ],
});
// result.languages → ["en", "nl"]
```

## Output

The `build()` function returns a `GirkBuildResult`:

```ts
{
  files: [
    { path: "/index.html", content: "<!doctype html>...", contentType: "text/html" },
    { path: "/about/index.html", content: "...", contentType: "text/html" },
    { path: "/style/app.css", content: "...", contentType: "text/css" },
    { path: "/robots.txt", content: "User-agent: *\nAllow: /", contentType: "text/plain" },
  ],
  pages: [
    { title: "Hello world", path: "/index.html", language: "en" },
    { title: "About", path: "/about/index.html", language: "en" },
  ],
  project: {},
  languages: ["en"],
}
```

## What you get

The SDK produces the same output as the CLI:

- Rendered HTML pages from your Markdown
- Generated CSS from the built-in stylesheet
- Search index (when enabled via config)
- Tag pages
- Archive pages
- Robots.txt
- Navigation menus
- Social links

## What the SDK does NOT do

- Read or write files to disk
- Process images (no sharp)
- Fetch remote data sources
- Show terminal output

If you need these features, use the CLI (`npx girky`) or add your own adapters around the SDK output.
