---
title: Upcoming
order: 1
---

# Upcoming

These notes describe the changes currently on `main` that will land in the next tagged release.

## Added

- `projectScriptModule` now outputs real module scripts, so you can load ES module entrypoints alongside classic `projectScript` assets.
- `example-basic` now demonstrates both a native custom element and a Vue-mounted block loaded through module scripts.
- Browser integration tests now verify that those example integrations actually execute and render after page load.
- The docs now include guidance for custom CSS, custom JavaScript, web components, and Vue-powered enhancements.
- The docs now have a dedicated release notes section so user-facing changes stay visible outside the generated changelog.

## Changed

- Supported Node versions are now documented and enforced as `20.19+`, `22.12+`, and `24` through `25`.
- CI now verifies the repo across Node `20`, `22`, `24`, and `25`.
