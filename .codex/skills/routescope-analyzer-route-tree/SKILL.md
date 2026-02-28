---
name: routescope-analyzer-route-tree
description: Build deterministic Next.js route mapping in analyzer-core. Use when implementing or updating App Router and Pages Router route discovery, URL normalization, segment handling, layout chain construction, and route metadata extraction labeled as exact.
---

# Analyzer Route Tree

1. Implement route logic only in `packages/analyzer-core/src/routes/*`.
2. Keep route outputs deterministic and labeled `exact`.
3. Cover both routers and hybrid projects:
- App: `app/**/page.*`, layout/template/loading/error/not-found, `app/api/**/route.*`
- Pages: `pages/index.*`, dynamic/catch-all, `pages/api/**`, `_app`, `_document`, `_error`, `404`
4. Preserve special segment behavior:
- Route groups
- Parallel routes
- Private folders
- Dynamic and catch-all segments

## Layout Chain Rules

- Build chain in root-to-nearest order.
- Keep ordering deterministic and testable.
- Report missing/ambiguous layout files as warnings, not crashes.

## Validation

- Unit tests for mapping edge cases
- Fixture and golden snapshot updates
- Hybrid router integration test coverage
