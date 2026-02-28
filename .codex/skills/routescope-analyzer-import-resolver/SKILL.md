---
name: routescope-analyzer-import-resolver
description: Implement exact import graph extraction and resolution in analyzer-core. Use when adding or changing import extraction, re-export handling, type-only imports, require/static dynamic import support, and tsconfig-aware resolve order behavior.
---

# Analyzer Import Resolver

1. Work in `packages/analyzer-core/src/imports/*` and `src/workspace/load-tsconfig.ts`.
2. Keep import graph confidence as `exact` for deterministic extraction.
3. Extract supported forms:
- `import`
- re-export (`export ... from`)
- type-only imports
- `require()`
- static-string `import()`
4. Preserve resolve order:
- relative
- tsconfig `paths`
- `baseUrl`
- extension/index completion
- external fallback

## Resolver Quality Bar

- Emit unresolved imports explicitly
- Keep reason/debug metadata diagnosable
- Avoid VSCode runtime assumptions inside analyzer-core

## Validation

- Alias/baseUrl fixtures
- Hybrid and monorepo path coverage
- Regression tests for extension/index completion
