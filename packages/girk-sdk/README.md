# girk-sdk

Build static sites from in-memory data. Zero filesystem access.

Part of the [Girk](https://github.com/silvandiepen/girk) static site generator.

## Install

```bash
npm install girk-sdk
```

## Usage

```ts
import { build } from "girk-sdk";

const result = await build({
  files: [
    { path: "/index.md", content: "# Hello world\nWelcome to my site." },
    { path: "/about.md", content: "# About\nSome about text." },
    { path: "/blog/post:nl.md", content: "# Blogpost\nDit is een blogpost." },
  ],
  media: [
    { path: "/media/photo.jpg", content: imageBuffer, contentType: "image/jpeg" },
  ],
  config: {
    projectTitle: "My Site",
  },
  languages: ["en", "nl"],
});

// result.files — array of generated files (HTML, CSS, JSON, etc.)
// result.pages — array of page metadata
// result.project — resolved project config
// result.languages — detected or provided languages
```

## Input

`build()` takes a `GirkBuildInput` object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | `GirkInputFile[]` | yes | Markdown files with `path` and `content` |
| `media` | `GirkInputAsset[]` | no | Media assets — passed through as-is |
| `assets` | `GirkInputAsset[]` | no | Static assets — passed through as-is |
| `config` | `object` | no | Project configuration |
| `languages` | `string[]` | no | Explicit languages; auto-detected from filenames if omitted |

## Output

`build()` returns a `GirkBuildResult`:

```ts
{
  files: GirkOutputFile[];     // all generated files
  pages: GirkOutputPage[];     // page metadata (title, path, language)
  project: Project;            // resolved project config
  languages: string[];         // detected languages
}
```

Each `GirkOutputFile` has `path`, `content`, and `contentType`.

## What it does

- Markdown to HTML rendering with syntax highlighting
- Route generation from file paths
- Language detection from filenames (`page:nl.md`)
- Menu, tags, archives, socials generation
- Page rendering via Pug templates
- CSS generation via SASS
- Search index generation
- Robots.txt generation
- Media passthrough (no processing)

## What it does NOT do

- Read or write files to disk
- Image processing or thumbnail generation
- Fetch remote data sources
- CLI logging or terminal output
- Scan directories

## Languages

Languages are detected from filename suffixes (`page:nl.md`) or passed explicitly via `languages: ["en", "nl"]`.

## License

MIT
