# Girk CLI, SDK, API and UI migration

## Architecture

Girk is split into three packages that share the same version number:

```
packages/
  girk-sdk/       Pure build logic, zero filesystem deps
  girk-cli/       CLI layer — filesystem adapters, sharp, logging
  girk/           Umbrella package (girky on npm) — re-exports SDK + CLI
```

All three are version `1.25.4` and move in lockstep.

### Dependency graph

```
girky  ──→  girk-sdk
       ──→  girk-cli  ──→  girk-sdk
```

`girky` is the public-facing name. It re-exports everything from `girk-sdk` and `girk-cli` so users can install one package and get both CLI and SDK.

## Installation

```bash
npm install girky
```

This gives you:
- CLI binaries: `girk`, `gieter`
- SDK: `import { build } from "girky"` or `import { build } from "girky/sdk"`

You can also install SDK or CLI individually:

```bash
npm install girk-sdk    # SDK only, no CLI
npm install girk-cli    # CLI only, depends on girk-sdk
```

## CLI usage

The CLI works exactly as before:

```bash
npx girky          # build from markdown in current directory
girk               # same
gieter             # same (alternative name)
```

What the CLI does:
1. Scans `process.cwd()` for `.md` files
2. Reads `girk.config.json` or `gieter.config.json`
3. Copies media/assets folders
4. Generates thumbnails via `sharp`
5. Calls the SDK build pipeline
6. Writes output to `public/`
7. Shows terminal output via `cli-block`

## SDK usage

The SDK builds sites from in-memory data. No filesystem access.

```ts
import { build } from "girky";
// or
import { build } from "girk-sdk";

const result = await build({
  files: [
    { path: "/index.md", content: "# Hello world" },
    { path: "/about.md", content: "# About us" },
    { path: "/blog/post:nl.md", content: "# Blogpost" },
  ],
  media: [
    { path: "/media/photo.jpg", content: imageBuffer, contentType: "image/jpeg" },
  ],
  config: {
    projectTitle: "My site",
  },
  languages: ["en", "nl"],
});
```

### SDK input — `GirkBuildInput`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | `GirkInputFile[]` | yes | Markdown files with `path` and `content` |
| `media` | `GirkInputAsset[]` | no | Media assets (images, etc.) — passed through as-is |
| `assets` | `GirkInputAsset[]` | no | Other static assets |
| `config` | `Record<string, unknown>` | no | Project configuration |
| `languages` | `string[]` | no | Explicit languages; auto-detected from filenames if omitted |

### `GirkInputFile`

```ts
interface GirkInputFile {
  path: string;       // virtual path, e.g. "/blog/hello.md"
  content: string;    // markdown content
  created?: Date;     // optional creation date
}
```

### `GirkInputAsset`

```ts
interface GirkInputAsset {
  path: string;                    // virtual path, e.g. "/media/photo.jpg"
  content: string | Buffer;        // file content
  contentType?: string;            // MIME type
}
```

### SDK output — `GirkBuildResult`

```ts
interface GirkBuildResult {
  files: GirkOutputFile[];     // all generated files
  pages: GirkOutputPage[];     // page metadata
  project: Record<string, unknown>;
  languages: string[];
}
```

### `GirkOutputFile`

```ts
interface GirkOutputFile {
  path: string;                       // e.g. "/index.html", "/style/app.css"
  content: string | Buffer;
  contentType: string;                // MIME type
}
```

### `GirkOutputPage`

```ts
interface GirkOutputPage {
  title: string;
  path: string;          // e.g. "/about/index.html"
  language: string;      // e.g. "en", "nl"
}
```

### Output files

A typical build produces:

| Path | Type | Description |
|------|------|-------------|
| `/index.html` | text/html | Home page |
| `/about/index.html` | text/html | Content pages |
| `/tag/my-tag/index.html` | text/html | Tag pages |
| `/style/app.css` | text/css | Generated stylesheet |
| `/search/manifest.json` | application/json | Search manifest |
| `/search/en.json` | application/json | Search shards |
| `/robots.txt` | text/plain | Robots file |
| `/media/photo.jpg` | image/jpeg | Media passthrough |

## What the SDK does

- Markdown → HTML rendering
- Route generation from file paths
- Language detection from filenames (`page:nl.md`)
- Project config extraction from frontmatter
- Menu, tags, archives, socials generation
- Page rendering via Pug templates
- CSS generation via SASS (in-memory)
- Search index generation
- Robots.txt generation
- Media passthrough (no processing)

## What the SDK does NOT do

- Read or write files to disk
- Use `sharp` for image processing
- Fetch remote data sources
- Run CLI logging
- Generate resized thumbnails
- Scan `process.cwd()`

## Languages

Languages can be specified in two ways:

1. **Explicit**: Pass `languages: ["en", "nl"]` in the input
2. **Auto-detected**: Filenames like `page:nl.md` are parsed for language suffixes

Both approaches work. Explicit takes priority.

## Build pipeline

The SDK runs this pipeline internally:

```
normalize input → Payload
  ↓
removeUrlParts
  ↓
processPartials
  ↓
generateSocials
  ↓
generateTags
  ↓
generateArchives
  ↓
generateMenu
  ↓
generateStyles
  ↓
buildSearchIndex
  ↓
buildContentPages
  ↓
createTagPages
  ↓
generateRobots
  ↓
extractResult → GirkBuildResult
```

The internal `Payload` type is mutable shared state that flows through every stage. The SDK wraps it — users never see `Payload`, only `GirkBuildInput` and `GirkBuildResult`.

## Package contents

### girk-sdk

Dependencies: `pug`, `sass`, `markdown-it`, `svgo`, `date-fns`, `purgecss`, `@sil/case`, `node-fetch`, `open-icon`, markdown-it plugins

No: `sharp`, `cli-block`, `@sil/args`, `express`, `fs-extra`, `iconator`

Includes: templates (`src/template/*.pug`), styles (`src/style/`)

### girk-cli

Dependencies: `girk-sdk`, `sharp`, `cli-block`, `@sil/args`, `express`, `fs-extra`, `iconator`

Adds: filesystem I/O, thumbnail generation, terminal output, config file discovery

### girky (umbrella)

Dependencies: `girk-sdk`, `girk-cli` + all original deps (for now, until CLI migration completes)

Currently the CLI code still lives in `packages/girk/src/index.ts`. It will be migrated to use `girk-sdk` internally in a follow-up.

## Non-breaking rule

These must keep working:

```bash
npx girky
girk
gieter
```

Existing docs, examples, release flow and Cloudflare deployment must keep working.

## Test coverage

### Existing tests (unchanged, all passing)

- 129 unit tests in `packages/girk/src/libs/` — individual function tests
- 9 e2e tests in `packages/girk/tests/e2e/` — full build pipeline tests
- Playwright e2e for docs and example-basic sites
- Worker host-to-site mapping tests

### SDK tests

- 3 smoke tests in `packages/girk-sdk/tests/`:
  - Build compiles without errors
  - Produces HTML output files
  - Produces CSS output

### Running tests

```bash
# All girky tests
npm run test -w girky

# SDK tests only
npm run test -w girk-sdk

# Full e2e (build + playwright)
npm run test:e2e
```

## Publishing

All packages are published to npm under the `girky` org scope (unscoped names):

```bash
npm publish girk-sdk    # girk-sdk
npm publish girk-cli    # girk-cli
npm publish girky       # girky (umbrella)
```

All packages have `publishConfig.access: "public"` and `provenance: true` for npm provenance.

To publish for the first time:

```bash
npm login
cd packages/girk-sdk && npm publish
```

After initial publish, enable GitHub Actions source deployment on npmjs.com for each package.

## Future work

- **CLI migration**: Make `girk-cli` use `girk-sdk` internally instead of duplicated pipeline code
- **Individual function exports**: Expose `toHtml`, `generateMenu`, etc. from the SDK
- **API mode**: HTTP endpoint wrapping the SDK (nice-to-have)
- **Data sources**: Pre-resolved `dataSources` input for SDK mode
- **Worker bundle**: Bundle SDK for Cloudflare Workers
