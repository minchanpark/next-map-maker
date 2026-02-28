---
name: routescope-extension-host-ux
description: Build VSCode extension host features for RouteScope. Use when implementing command registration, analyze workflow, tree providers, diagnostics, status/output updates, and source-jump interactions backed by analyzer-core outputs.
---

# Extension Host UX

1. Work in `packages/extension/src/*`.
2. Keep analyzer logic in analyzer-core; extension orchestrates only.
3. Implement command palette flows:
- Analyze workspace
- Open graph
- Export
- Rebuild cache
- Select app root

## UX Integration Rules

- Tree selection and webview selection must stay synchronized
- Source jump should fallback to file-open when line info is missing
- Status bar reflects Idle/Analyzing/Done/Warning states
- Diagnostics and output channel must stay actionable and privacy-safe

## Validation

- Command registration tests
- Tree provider update tests
- Bridge payload validation tests
- E2E smoke: analyze -> refresh -> select -> open source
