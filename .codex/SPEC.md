# E2E Tests for Current Girk CLI Build Pipeline

## Goal

Add comprehensive end-to-end tests that exercise the full Girk build pipeline BEFORE any refactoring. These tests protect current behaviour and will be the safety net for the upcoming SDK/CLI split.

## Repository

- Location: `~/Repositories/_libs/girk` (branch: `docs/cli-sdk-api-refactor`)
- Package: `packages/girk/`
- Package name: `girky`
- Test runner: vitest
- Config: `packages/girk/vite.config.mts` (alias `@` → `src`)

## Current Architecture

The build pipeline is in `packages/girk/src/index.ts`. It runs automatically on import:

```
hello → settingsAndConfig → files → removeUrlParts → processPartials → media → generateSocials → generateTags → generateArchives → generateMenu → generateStyles → generateFavicon → generateSearchIndex → contentPages → createTagPages → createRobots
```

Each step takes a `Payload` object (defined in `src/types.ts`) and returns an updated `Payload`.

Key types: `Payload`, `File`, `Project`, `Settings`, `Page`, `Tag`, `MenuItem`, `Archive`

## What To Build

### 1. Test Fixtures

Create fixture directories under `packages/girk/tests/e2e/fixtures/`. Each fixture is a minimal Girk project (markdown files + optional config).

#### `fixtures/basic/`
```
README.md          → # Hello World\n\nThis is the homepage.
about.md           → # About\n\nAbout this site.
```

#### `fixtures/multilang/`
```
README.md          → # Home\n\nWelcome.
README:nl.md       → # Home\n\nWelkom.
about.md           → # About\n\nAbout this site.
about:nl.md        → # Over\n\nOver deze site.
```

#### `fixtures/config/`
```
girk.config.json   → { "projectTitle": "Config Test", "projectStyle": "body { color: red; }" }
README.md          → # Config Site\n\nTesting config.
page.md            → # A Page\n\nContent here.
```

#### `fixtures/tags/`
```
README.md          → # Tags Demo\n\nHome
coding.md          → ---\ntags: [javascript, typescript]\n---\n# Coding\n\nCode stuff.
design.md          → ---\ntags: [typescript, design]\n---\n# Design\n\nDesign stuff.
```

#### `fixtures/archives/`
```
blog/README.md     → ---\narchive: blog\n---\n# Blog\n\nBlog home
blog/post-one.md   → # Post One\n\nFirst post.
blog/post-two.md   → # Post Two\n\nSecond post.
```

#### `fixtures/search/`
```
girk.config.json   → { "projectSearch": true }
README.md          → # Search Demo\n\nHome page.
page1.md           → # Page One\n\nContent for search.
page2.md           → # Page Two\n\nMore content for search.
```

#### `fixtures/gieter/`
```
gieter.config.json → { "projectTitle": "Gieter compat" }
README.md          → # Gieter Site\n\nGieter compat test.
```

### 2. Test Helper

Create `packages/girk/tests/e2e/helpers.ts` with:

```ts
import { mkdtemp, cp, readFile, stat, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Copy a fixture to a temp dir and return the path
export async function setupFixture(name: string): Promise<string>;

// Recursively list all files in a directory
export async function listFiles(dir: string, prefix = ""): Promise<string[]>;

// Read a file from the output dir
export async function readOutput(outputDir: string, filePath: string): Promise<string>;

// Check if a file exists
export async function fileExists(path: string): Promise<boolean>;
```

### 3. Test: Build Runner

Create `packages/girk/tests/e2e/build-runner.ts` that:

1. Takes a fixture directory path
2. Changes `process.cwd()` to the fixture dir (save and restore original)
3. Sets up the settings (output to a temp dir)
4. Runs the pipeline functions in the correct order (same as index.ts)
5. Returns the output directory path and the final Payload

This is the core test utility. It should NOT spawn a child process or run `index.ts` directly (since that auto-runs). Instead it should import and call each pipeline function individually:

```ts
import { settingsAndConfig, files, contentPages, media } from "@/index";
import { processPartials } from "@/libs/partials";
import { generateSocials } from "@/libs/socials";
import { generateTags, createTagPages } from "@/libs/tags";
import { generateArchives } from "@/libs/archives";
import { generateMenu } from "@/libs/menu";
import { generateStyles } from "@/libs/buildStyle/style";
import { generateFavicon } from "@/libs/favicon";
import { generateSearchIndex } from "@/libs/search";
import { createRobots } from "@/libs/robots";
```

Note: `hello()` is just a greeting function and can be skipped. `settingsAndConfig` reads config and sets output dir. The `removeUrlParts` function is defined in index.ts but is simple (replaces `/src/` in paths).

### 4. Test Files

Create these test files under `packages/girk/tests/e2e/`:

#### `cli-build.test.ts` — Basic build output

For each basic fixture:
- Run the build pipeline
- Verify `public/` directory was created
- Verify `index.html` exists (for README.md home pages)
- Verify HTML contains `<!doctype html>` or `<!DOCTYPE html>`
- Verify HTML contains the page title
- Verify `style/app.css` exists
- Verify `robots.txt` exists with `User-agent: *`

#### `cli-pages.test.ts` — Page generation

- Build `basic` fixture
- Verify `/about/index.html` exists
- Verify about page contains "About" in the HTML
- Build `config` fixture
- Verify config pages are generated

#### `cli-multilang.test.ts` — Language handling

- Build `multilang` fixture
- Verify English and Dutch pages exist
- Verify file structure has language-specific paths or pages

#### `cli-tags.test.ts` — Tag pages

- Build `tags` fixture
- Verify tag pages are generated under `/tag/`
- Verify tag page lists files that have that tag

#### `cli-archives.test.ts` — Archive pages

- Build `archives` fixture
- Verify blog archive page exists
- Verify archive lists child posts

#### `cli-search.test.ts` — Search index

- Build `search` fixture
- Verify `assets/search/manifest.json` exists
- Verify manifest contains shard entries
- Verify search shard JSON exists with document entries

#### `cli-config.test.ts` — Config loading

- Build `config` fixture
- Verify project title appears in the HTML
- Build `gieter` fixture
- Verify gieter.config.json is picked up (title in HTML)

### 5. Vitest Config Update

Update `packages/girk/vite.config.mts` to include the new test directory:

```ts
test: {
  environment: "node",
  globals: false,
  include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  exclude: ["dist/**", "node_modules/**"],
  testTimeout: 30000,
},
```

## Important Notes

- The current `index.ts` auto-runs on import. Do NOT import `index.ts` directly in tests — import individual pipeline functions instead.
- `settingsAndConfig` calls `getConfig()` which reads config files from `process.cwd()`. Tests must `process.chdir()` to the fixture dir.
- `settingsAndConfig` also calls `getArgs()` which parses CLI args. In test context this may return empty args — that's fine.
- `files()` calls `getFiles(process.cwd(), ".md")` — this is why we need the fixture on disk.
- The `media()` function calls `getMedia()` which tries to read `assets/` and `media/` dirs — it should not crash if these don't exist.
- `generateStyles` compiles SASS — it reads from `src/style/app.scss` relative to the package, not the fixture.
- `generateFavicon` generates inline SVG — no file deps.
- `createPage` writes HTML to `payload.settings.output` — which `settingsAndConfig` sets to `join(process.cwd(), "public")`.
- After each test, restore `process.cwd()` and clean up temp dirs.
- Use `afterEach` to restore cwd. Save original cwd before each test.
- The package uses `@/` path alias which maps to `src/`. The vitest config already handles this.

## Constraints

- Use vitest only (already configured)
- No Playwright — these are build-time tests, not browser tests
- Tests must work with the current code structure (pre-refactor)
- Each test file should be independent (setup/teardown per test)
- Keep fixture content minimal but realistic
- Don't test implementation details — test observable output (files on disk, their content)
