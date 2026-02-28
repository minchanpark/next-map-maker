---
name: routescope-webview-graph-ui
description: Implement RouteScope webview graph UI using typed bridge messages. Use when building React Flow rendering, filters/search, inspector panels, confidence legend, large-graph fallback behavior, and extension message synchronization.
---

# Webview Graph UI

1. Work in `packages/webview-app/src/*`.
2. Accept data only through typed message contracts from shared-schema.
3. Preserve confidence visibility (`exact` vs `best-effort`) in legend and edge styles.

## UI Behavior Rules

- Deterministic filter state updates
- Search/filter by route, file, node type, confidence
- Selection sync with extension tree and source jump actions
- Large graph fallback triggers before freeze conditions

## Performance and Safety

- Avoid unbounded in-memory growth
- Reduce expensive rendering features in large mode
- Keep CSP-compatible webview patterns

## Validation

- Graph render sanity tests
- Filter/search behavior tests
- Message handling tests for open-source/export actions
