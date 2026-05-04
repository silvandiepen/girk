# Girk SDK/CLI Split — 3-Package Workspace Refactor

## Repository Layout

```
packages/
  girk-sdk/       ← NEW: Pure build logic, zero CLI deps, zero filesystem
  girk-cli/       ← NEW: CLI layer, filesystem adapters, sharp, logging
  girk/           ← EXISTING: Becomes umbrella package, re-exports girk-sdk + girk-cli
  utils/          ← EXISTING: Unchanged
```

## What Each Package Does

### girk-sdk (new, `packages/girk-sdk/`)
- Pure build pipeline — takes in-memory input, returns in-memory output
- **NO** filesystem access (no readFile, writeFile, process.cwd, existsSync)
- **NO** CLI deps (no cli-block, @sil/args, express, sharp, iconator, fs-extra)
- Dependencies: pug, sass, markdown-it (+ plugins), date-fns, svgo, purgecss, @sil/case, node-fetch
- Templates ship with the package (src/template/ copied over)
- Exports `build(input: GirkBuildInput): Promise<GirkBuildResult>`

### girk-cli (new, `packages/girk-cli/`)
- Reads from filesystem → calls SDK → writes to filesystem
- Has the CLI entrypoint with #!/usr/bin/env node
- Dependencies: girk-sdk, sharp, cli-block, @sil/args, express, iconator, fs-extra
- Re-exports `build()` from girk-sdk for convenience
- Bin: `girk`, `gieter`

### girk (existing, becomes umbrella)
- package name stays `girky` on npm
- Re-exports everything from girk-sdk and girk-cli
- `import { build } from "girky"` → girk-sdk
- `npx girky` → girk-cli bin
- This preserves backward compatibility

## GirkBuildInput (SDK types)

```ts
export interface GirkInputFile {
  path: string;           // virtual path like "/index.md" or "/blog/post.md"
  content: string;        // raw markdown content
  created?: Date;         // file creation date (defaults to now)
}

export interface GirkInputAsset {
  path: string;           // virtual path like "/assets/logo.svg"
  content: string | Buffer;
  contentType?: string;   // e.g. "image/svg+xml"
}

export interface GirkBuildInput {
  files: GirkInputFile[];
  media?: GirkInputAsset[];
  assets?: GirkInputAsset[];
  config?: Record<string, unknown>;
  languages?: string[];   // explicit language list; omit to auto-detect from filenames
}
```

## GirkBuildResult (SDK output)

```ts
export interface GirkOutputFile {
  path: string;           // virtual output path like "/index.html" or "/style/app.css"
  content: string | Buffer;
  contentType: string;    // "text/html", "text/css", "application/json", etc.
}

export interface GirkOutputPage {
  title: string;
  path: string;           // URL path like "/" or "/blog/post/"
  language: string;
}

export interface GirkBuildResult {
  files: GirkOutputFile[];
  pages: GirkOutputPage[];
  project: Record<string, unknown>;
  languages: string[];
}
```

## File Mapping: What Goes Where

### girk-sdk gets (from packages/girk/src/):
```
libs/archives.ts           — pure data transform (remove cli-block imports)
libs/buildStyle/compile.ts — color/CSS logic (change readFile to accept content param)
libs/buildStyle/style.ts   — split: SDK version returns CSS string, CLI version writes
libs/data.ts               — data interpolation logic (filesystem parts become CLI concern)
libs/download.ts           — gist fetching (uses node-fetch, no fs)
libs/files.ts              — split: fileId, isHomePath, buildHtml, makePath, makeLink go to SDK
                              getFileTree, getFiles stay CLI-only
libs/helpers.ts            — pure helpers
libs/icon.ts               — split: resolveFileIcons core logic to SDK, filesystem parts to CLI
libs/language.ts           — pure data
libs/markdown-imports.test.ts — test
libs/markdown-it-article/  — markdown-it plugin
libs/markdown-it-svg/      — markdown-it plugin
libs/markdown.ts           — toHtml, resolveImports, etc (remove local file reading, make it accept content)
libs/markdown-meta.ts      — pure frontmatter parsing
libs/media.ts              — split: getThumbnail, getSvgThumbnail to SDK; getMedia, createThumbnails, copyToAssets to CLI
libs/menu.ts               — split: core menu generation to SDK (remove cli-block), CLI wraps with logging
libs/page.ts               — split: buildPage to SDK (remove fs writes); createPage to CLI
libs/partials.ts           — pass-through, goes to SDK
libs/project.ts            — split: getProjectData logic to SDK (accept config param); getConfig to CLI
libs/robots.ts             — split: content generation to SDK; file writing to CLI
libs/search.ts             — split: shard/index building to SDK; file writing to CLI
libs/section-style.ts      — pure helper
libs/socials.ts            — split: getSocials to SDK; logging to CLI
libs/tags.ts               — split: generateTags to SDK; createTagPages to SDK (using buildPage); CLI wraps with logging
libs/utils.ts              — split: asyncForEach, nthIndex, renamePath, removeTag, getStringFromTag to SDK; createDir, getFileData, fileExists to CLI
template/                  — ALL pug templates and scripts (ships with girk-sdk package)
data/                      — language data etc.
types.ts                   — shared types (File, Payload, Project, etc.) — goes to SDK, re-exported by CLI
```

### girk-cli gets:
```
index.ts                   — CLI entrypoint (#!/usr/bin/env node, auto-runs)
libs/filesystem.ts         — getFileTree, getFiles (from files.ts)
libs/config.ts             — getConfig (from project.ts)
libs/media-fs.ts           — getMedia, createThumbnails, copyToAssets (from media.ts)
libs/write.ts              — createPage wrapper, writeSearchIndex, writeRobots, writeStyles
libs/utils.ts              — createDir, getFileData, fileExists, hello
```

### girk (umbrella) gets:
```
index.js                   — re-exports from girk-sdk
package.json               — depends on girk-sdk + girk-cli
```

## Implementation Strategy

**Phase 1: Create package structure**
1. Create `packages/girk-sdk/` with package.json, tsconfig.json, vite.config.mts
2. Create `packages/girk-cli/` with package.json, tsconfig.json
3. Update `packages/girk/package.json` to become umbrella

**Phase 2: Move shared code to girk-sdk**
1. Copy `src/types.ts` → `packages/girk-sdk/src/types.ts` (also export SDK types)
2. Copy all template files → `packages/girk-sdk/src/template/`
3. Copy pure data transform libs (no fs, no cli-block)
4. For libs that have mixed concerns, create SDK versions that:
   - Accept data as parameters instead of reading from filesystem
   - Return data instead of writing to filesystem
   - Accept a `virtualRoot` string instead of using `process.cwd()`

**Phase 3: Create girk-cli**
1. CLI imports `build()` from girk-sdk
2. CLI reads filesystem → constructs GirkBuildInput → calls build() → writes GirkBuildResult to disk
3. CLI handles logging (cli-block), thumbnails (sharp), favicon generation (iconator)
4. CLI bin entrypoint with auto-run

**Phase 4: Update girk umbrella**
1. Re-exports from girk-sdk
2. Bins point to girk-cli
3. Existing tests stay in girk package (they test the full pipeline)

## Key Refactoring Patterns

### Pattern 1: Function split (build vs create)
Already exists in page.ts — `buildPage()` returns data, `createPage()` writes to disk.
Apply same pattern everywhere:

```ts
// girk-sdk: returns string
export const buildRobots = (config: Record<string, unknown>): string | null => {
  if (config.noRobots) return null;
  return `User-agent: *\nAllow: /`;
};

// girk-cli: writes to disk
export const writeRobots = async (payload: Payload): Promise<Payload> => {
  const content = buildRobots(payload.settings.config);
  if (content) await writeFile(join(payload.settings.output, "robots.txt"), content);
  return payload;
};
```

### Pattern 2: Inject dependencies instead of process.cwd()
```ts
// SDK version: accepts virtualRoot
export const makeLink = (path: string, virtualRoot: string = ""): string => {
  const uri = fixLangInPath(
    path.replace(virtualRoot, "").toLowerCase()...
  );
};

// CLI version: uses process.cwd()
export const makeLinkFs = (path: string): string => makeLink(path, process.cwd());
```

### Pattern 3: Template reading
Templates are in `src/template/` and compiled to `dist/template/`. In SDK:
```ts
const templatePath = join(__dirname, "../template/page.pug");
const html = pug.renderFile(templatePath, options);
```
This works because templates ship with the npm package (already in `files` array).

### Pattern 4: CSS compilation
```ts
// girk-sdk: buildCss accepts the CSS content string instead of reading file
export const buildCss = async (baseCss: string, colors: ColorConfig | null): Promise<string> => {
  const lightMode = buildModeColorVariables(colors, "light");
  const darkMode = buildModeColorVariables(colors, "dark");
  return baseCss
    .replaceAll("content: \"[DARKMODE]\";", `${darkMode}`)
    .replaceAll("content: \"[LIGHTMODE]\";", `${lightMode}`)
    .replaceAll("content:\"[DARKMODE]\"", `${darkMode}`)
    .replaceAll("content:\"[LIGHTMODE]\"", `${lightMode}`);
};
```

## Important Constraints

1. **All 120 existing unit tests + 9 e2e tests must pass** after refactor
2. **CLI behaviour is unchanged** — `npx girky`, `girk`, `gieter` all work identically
3. **Backward compatible** — `import { build } from "girky"` works (via umbrella re-export)
4. **CommonJS** — all packages are `"type": "commonjs"`
5. **Node engines** — `"^20.19.0 || >=22.12.0 <26"`
6. **Workspace** — all three packages in the monorepo workspace
7. **Tests stay in packages/girk** for now — they test the full pipeline via the umbrella
8. **The e2e tests use the filesystem-based pipeline** — they should keep working via girk-cli
9. **SDK tests will be new** — they test the in-memory build path

## What NOT to do

- Don't change the existing unit test files' import paths yet (they'll import from the umbrella)
- Don't remove the existing `packages/girk/src/` until everything works
- Don't change the published package name (`girky`) or bin names (`girk`, `gieter`)
- Don't break `import { build } from "girky"` — the umbrella must re-export it

## Step-by-step for Codex

### Step 1: Create packages/girk-sdk/
Create the directory structure:
```
packages/girk-sdk/
  package.json
  tsconfig.json
  vite.config.mts
  src/
    index.ts
    types.ts
    sdk-types.ts    (GirkBuildInput, GirkBuildResult, etc.)
    build.ts        (main build() function)
    normalize.ts    (convert GirkBuildInput → internal Payload)
    render.ts       (convert Payload → GirkBuildResult)
    template/       (copy from packages/girk/src/template/)
    libs/           (copy and adapt from packages/girk/src/libs/)
    data/           (copy from packages/girk/src/data/)
```

### Step 2: Create packages/girk-cli/
```
packages/girk-cli/
  package.json
  tsconfig.json
  src/
    index.ts        (#!/usr/bin/env node, auto-run CLI)
    read-input.ts   (filesystem → GirkBuildInput)
    write-output.ts (GirkBuildResult → filesystem)
    libs/
      files.ts      (getFileTree, getFiles from original)
      config.ts     (getConfig from original)
      media-fs.ts   (getMedia, createThumbnails, copyToAssets)
      utils.ts      (createDir, getFileData, fileExists, hello)
```

### Step 3: Update packages/girk/
- Update package.json to be umbrella
- Keep existing tests
- Remove old src/ (or repoint to new packages)
- Update vite.config.mts to resolve imports to the new packages

### Step 4: Run tests
- `npm run build` in all packages
- Run existing unit tests
- Run e2e tests
- Fix any broken imports
