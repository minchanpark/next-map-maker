---
name: routescope-shared-schema-contracts
description: Define and evolve shared RouteScope data contracts across analyzer, extension, and webview. Use when adding or changing graph, route tree, warnings, metadata, and message protocol types, especially before any producer or consumer changes.
---

# Shared Schema Contracts

1. Treat `packages/shared-schema` as the contract source of truth.
2. Apply contract changes in this exact order:
- Update shared schema types first
- Update analyzer producers second
- Update extension and webview consumers third
- Update fixtures/golden tests and docs last
3. Prefer additive changes; avoid field removal unless explicitly requested.
4. Reflect confidence semantics in schema (`exact` vs `best-effort`).

## Required Checks

- Message protocol types align with extension-webview payloads
- Graph/route types keep deterministic fields explicit
- Deprecated fields have migration note in task summary
- No duplicate contract definitions outside `shared-schema`

## Guardrails

- No silent schema drift.
- No analyzer-local type forks for shared payloads.
