# Girk Sites Worker

This workspace deploys the docs site and all example sites through a single Cloudflare Worker.

## Routes

- `girk.dev/*` -> docs
- `www.girk.dev/*` -> docs
- `example-basic.girk.dev/*` -> `apps/example-basic`
- `example-multilang.girk.dev/*` -> `apps/example-multilang`

## Commands

```bash
npm run cf:build:sites
npm run deploy:sites
```

The Worker serves static assets from its generated `public/__sites` bundle and dispatches requests by hostname.
