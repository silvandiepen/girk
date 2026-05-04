# Girk SDK

Build static sites from in-memory data. Zero filesystem access.

## Install

```bash
npm install girk-sdk
```

## Usage

```typescript
import { build } from "girk-sdk";

const result = await build({
  files: [
    {
      path: "/blog/hello.md",
      content: "# Hello World\n\nMy first post.",
    },
  ],
});

// result.files — array of output files (HTML, CSS, JSON, etc.)
// result.pages — array of page metadata
// result.languages — detected languages
// result.project — project configuration
```

## API

### `build(input: GirkBuildInput): Promise<GirkBuildResult>`

Main entry point. Takes in-memory input, returns in-memory output.

### `GirkBuildInput`

| Field | Type | Description |
|-------|------|-------------|
| `files` | `GirkInputFile[]` | Markdown files with `path` and `content` |
| `media` | `GirkInputAsset[]` | Media assets (images, etc.) |
| `assets` | `GirkInputAsset[]` | Other static assets |
| `config` | `Record<string, unknown>` | Project configuration |
| `languages` | `string[]` | Explicit language list (auto-detected if omitted) |

### `GirkBuildResult`

| Field | Type | Description |
|-------|------|-------------|
| `files` | `GirkOutputFile[]` | All output files (HTML, CSS, search JSON, robots.txt) |
| `pages` | `GirkOutputPage[]` | Page metadata (title, path, language) |
| `project` | `Record<string, unknown>` | Resolved project config |
| `languages` | `string[]` | Detected/used languages |

## No Filesystem

This package does not read or write files. It does not use `sharp`, `fs-extra`, or any CLI dependencies. Perfect for serverless functions, Workers, and programmatic use.
