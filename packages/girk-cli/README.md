# girk-runner

CLI runner for building static sites from markdown files.

Part of the [Girk](https://github.com/silvandiepen/girk) static site generator.

## Status

This is a skeleton package. The full CLI implementation still lives in the `girky` umbrella package and will be migrated here in a future release.

## What it will do

- Scan directories for `.md` files
- Read `girk.config.json` or `gieter.config.json`
- Copy media and asset folders
- Generate thumbnails via `sharp`
- Call `girk-sdk` to build pages
- Write output to `public/`
- Show terminal output via `cli-block`
- Optional dev server via `express`

## Install

```bash
npm install girk-runner
```

Or use the umbrella package which includes everything:

```bash
npm install girky
```

## Related packages

- [`girk-sdk`](https://www.npmjs.com/package/girk-sdk) — Pure build logic, zero filesystem deps
- [`girky`](https://www.npmjs.com/package/girky) — Umbrella package with CLI + SDK

## License

MIT
