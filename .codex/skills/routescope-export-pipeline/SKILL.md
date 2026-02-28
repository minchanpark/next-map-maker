---
name: routescope-export-pipeline
description: Implement RouteScope export features across analyzer and extension/webview layers. Use when adding or updating JSON, Mermaid, and SVG/PNG export paths, payload shaping, file naming, and UI-to-host export command flow.
---

# Export Pipeline

1. Keep core conversion logic in `packages/analyzer-core/src/export/*`.
2. Keep extension/webview export UI and file write orchestration separated.
3. Support outputs:
- JSON artifacts (`routeTree`, `graph`, `metadata`, optional insights)
- Mermaid text output
- SVG/PNG snapshot from current graph view

## Contract Rules

- Export payload schemas must come from shared-schema
- File content must respect confidence metadata
- Export failures should be diagnosable and non-destructive

## Validation

- Unit tests for conversion output
- Integration test for UI event -> host export -> file output
- Snapshot checks for stable Mermaid formatting
