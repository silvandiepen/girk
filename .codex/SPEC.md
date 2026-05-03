# SDK/CLI Split Implementation

## Goal

Split the Girk build pipeline into a reusable SDK (`build()` function) and a CLI that wraps it. The CLI must keep working exactly as before. The SDK must work with in-memory data (no filesystem).

## Repository

- Location: `~/Repositories/_libs/girk` (branch: `docs/cli-sdk-api-refactor`)
- Package: `packages/girk/`
- Package name: `girky`
- Current entrypoint: `packages/girk/src/index.ts` (auto-runs on import)
- Test runner: vitest, config: `packages/girk/vite.config.mts`

## Architecture After This Change

```txt
src/
  sdk/
    index.ts          # re-exports build + types
    build.ts          # main build() function (in-memory, no fs)
    types.ts          # GirkBuildInput, GirkBuildResult, GirkOutputFile, etc.
    normalize.ts      # converts GirkBuildInput to internal Payload
    render.ts         # converts internal Payload to GirkBuildResult
  
  cli/
    index.ts          # CLI entrypoint (#!/usr/bin/env node, auto-runs)
    readInput.ts      # readGirkInputFromFileSystem(cwd) → GirkBuildInput
    writeOutput.ts    # writeGirkOutputToFileSystem(result, outputDir) → void

  libs/               # existing modules (adapted to not write directly)
    ...
```

## Step-by-Step

### Step 1: Create SDK types

Create `src/sdk/types.ts` with the types from the migration plan doc:

```ts
export interface GirkInputFile {
  path: string;
  content: string;
  created?: Date;
}

export interface GirkInputAsset {
  path: string;
  content: string | Uint8Array | ArrayBuffer;
  contentType?: string;
}

export interface GirkBuildInput {
  files: GirkInputFile[];
  media?: GirkInputAsset[];
  assets?: GirkInputAsset[];
  config?: Record<string, unknown>;
  args?: Record<string, unknown>;
  languages?: string[];
  dataSources?: Record<string, unknown>;
}

export interface GirkOutputFile {
  path: string;
  content: string | Uint8Array | ArrayBuffer;
  contentType: string;
}

export interface GirkBuildResult {
  files: GirkOutputFile[];
  pages: GirkOutputPage[];
  project: Record<string, unknown>;
  languages: string[];
  warnings: string[];
}

export interface GirkOutputPage {
  title: string;
  path: string;
  language: string;
}
```

### Step 2: Create SDK normalize

Create `src/sdk/normalize.ts` that converts `GirkBuildInput` to the internal `Payload` object.

This needs to:
- Convert `GirkInputFile[]` to `File[]` (the internal type from `src/types.ts`)
- Set up `Payload` with the correct settings
- Handle `config` (map to the internal `Project` type)
- Handle `languages` (either from input or detect from filenames)
- NOT read from filesystem
- NOT call `getConfig()` or `getFiles()`

Key mapping from GirkInputFile to internal File:
```ts
// GirkInputFile { path: "/index.md", content: "# Hello", created?: Date }
// → File { id, name, fileName, path, created, language, data, ext, ... }
```

The `path` in GirkInputFile is a virtual path like `/index.md`. The internal File needs:
- `id`: derived from path (like `fileId()` in files.ts)
- `name`: directory name or file name (like `isHomePath` checks)
- `fileName`: the filename without extension or language suffix
- `path`: the full path (can be the virtual path)
- `relativePath`: same as path for SDK mode
- `created`: from input or `new Date()`
- `language`: detected from filename (`getLangFromFilename`) or from explicit languages
- `data`: the markdown content
- `ext`: `.md`
- `parent`: derived from path (directory name)

For markdown rendering, each file needs to be processed through `toHtml()` to get HTML and metadata.

For project data, `getProjectData()` needs to be called on the files to extract project config from frontmatter. But it currently calls `getConfig()` which reads from disk. For SDK mode, we need to inject the config instead.

### Step 3: Create SDK build function

Create `src/sdk/build.ts`:

```ts
import { GirkBuildInput, GirkBuildResult } from "./types";

export async function build(input: GirkBuildInput): Promise<GirkBuildResult> {
  // 1. Normalize input to Payload
  // 2. Run the pipeline (files processing, rendering, etc.)
  // 3. Collect output (pages, CSS, search, robots, etc.)
  // 4. Return GirkBuildResult
}
```

The build function should:
- NOT write to disk
- NOT use cli-block logging
- NOT use process.cwd()
- NOT read from filesystem
- Collect all output as GirkOutputFile[]

For generators that currently write to disk (createPage, generateSearchIndex, createRobots, generateStyles, generateFavicon), they need to be adapted to either:
a) Return their output as data (preferred), or
b) Write to a buffer/collector that's passed in

The cleanest approach: create wrapper functions in the SDK that call the existing `buildPage` (returns Page data) instead of `createPage` (writes to disk). For search index, call the shard-building logic but collect the output instead of writing.

### Step 4: Create SDK render/output collector

Create `src/sdk/render.ts` that takes the final Payload and converts it to GirkBuildResult:

- Extract all generated Page objects → GirkOutputFile[] entries
- Extract search index files → GirkOutputFile[] entries
- Extract robots.txt → GirkOutputFile[] entry
- Extract CSS → GirkOutputFile[] entry
- Extract favicon → GirkOutputFile[] entry
- Build pages list (title, path, language)
- Include media/assets from input as pass-through

### Step 5: Create CLI readInput adapter

Create `src/cli/readInput.ts`:

```ts
export async function readGirkInputFromFileSystem(cwd: string): Promise<GirkBuildInput> {
  // 1. getFiles(cwd, ".md") → GirkInputFile[]
  // 2. getConfig() → config
  // 3. getMedia() → media/assets
  // 4. prepareDataFiles() → data sources
  // 5. Return GirkBuildInput
}
```

### Step 6: Create CLI writeOutput adapter

Create `src/cli/writeOutput.ts`:

```ts
export async function writeGirkOutputToFileSystem(result: GirkBuildResult, outputDir: string): Promise<void> {
  // For each GirkOutputFile, write to disk at join(outputDir, file.path)
}
```

### Step 7: Create CLI entrypoint

Create `src/cli/index.ts`:

```ts
#!/usr/bin/env node
"use strict";

import { readGirkInputFromFileSystem } from "./readInput";
import { writeGirkOutputToFileSystem } from "./writeOutput";
import { build } from "../sdk/build";
import { blockHeader, blockFooter, blockSettings } from "cli-block";
// ... CLI logging, hello(), version display, etc.

async function main() {
  hello(); // greeting
  // ... blockHeader, display version, args, config
  const input = await readGirkInputFromFileSystem(process.cwd());
  const result = await build(input);
  await writeGirkOutputToFileSystem(result, join(process.cwd(), "public"));
  // ... blockFooter
}

main();
```

### Step 8: Update package.json

```json
{
  "exports": {
    ".": "./dist/sdk/index.js",
    "./sdk": "./dist/sdk/index.js"
  },
  "bin": {
    "girk": "dist/cli/index.js",
    "gieter": "dist/cli/index.js"
  }
}
```

### Step 9: Keep backward compatibility

The old `src/index.ts` currently auto-runs and is the bin target. After the split:
- `src/index.ts` should be replaced with a re-export from SDK for `import { build } from "girky"` to work
- The bin targets point to `src/cli/index.ts` which auto-runs

IMPORTANT: The current `src/index.ts` must NOT auto-run when imported. The auto-run logic moves to `src/cli/index.ts` only.

## Key Implementation Details

### Markdown processing

In SDK mode, files come as `{ path: "/index.md", content: "# Hello" }`. The normalize step needs to:
1. Parse the path to extract filename, language suffix, parent directory
2. Run `toHtml(content, path)` to get HTML and metadata
3. Build the full File object with all required fields

### Project config

In SDK mode, config comes as a plain object. The normalize step needs to:
1. NOT call `getConfig()` (reads from disk)
2. Use the provided config directly
3. Still call `getProjectData()` on files to extract per-file project overrides from frontmatter
4. But `getProjectData()` currently calls `getConfig()` internally — this needs to be bypassed for SDK mode

Solution: Create a `getProjectDataFromConfig(files, config)` variant that takes config as parameter instead of reading it.

### Page rendering

`buildPage()` already returns a Page object with HTML and CSS data. The SDK calls `buildPage()` and collects the output. `createPage()` (which writes to disk) is only used in CLI mode.

### Templates

`buildHtml()` in `files.ts` currently uses `pug.renderFile`. For SDK mode, this needs to work from `__dirname` (templates ship with the package). This should already work since the templates are in `src/template/` and the compiled JS is in `dist/`. The `pug.renderFile` paths use `join(__dirname, ...)` which resolves relative to the compiled output. This should work for SDK mode too.

### Search index

`generateSearchIndex()` currently writes to disk. For SDK mode, create a variant that returns the data:
- manifest JSON
- shard JSON files
- client.js source

These become GirkOutputFile entries.

### Styles

`generateStyles()` currently writes CSS to disk. For SDK mode, return the CSS data as a GirkOutputFile.

### Favicon

`generateFavicon()` currently writes to disk. For SDK mode, return the favicon data as GirkOutputFile(s).

### Robots

`createRobots()` currently writes to disk. For SDK mode, return robots.txt content as a GirkOutputFile.

### Media

In SDK mode, media comes as GirkInputAsset[] in the input. The build function passes them through as GirkOutputFile entries in the output.

## Constraints

- All existing tests must pass (120 unit + 9 e2e)
- CLI behaviour unchanged (npx girky, girk, gieter all work)
- The package is CommonJS (type: "commonjs")
- Uses @/ path alias mapped to src/
- Do NOT modify the existing libs unless necessary — prefer wrapping
- Keep the changes minimal and incremental
