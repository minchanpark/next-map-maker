---
name: routescope-incremental-cache
description: Implement incremental analysis and cache invalidation for RouteScope analyzer-core and extension watch flow. Use when adding file hash indexes, dependency indexes, rebuild planners, cache persistence, and watcher-triggered partial reanalysis behavior.
---

# Incremental Cache Engine

1. Keep core logic in `packages/analyzer-core/src/incremental/*`.
2. Use stable file hash and dependency indexes for invalidation.
3. Rebuild minimally; fallback to full analysis only when dependency scope is unsafe.

## Cache Rules

- Cache keys must include relevant config/version dimensions
- Persist cache under project-local safe path (for example `.routescope/`)
- Treat cache corruption as recoverable (rebuild, warn, continue)

## Watch Flow Rules

- File save triggers targeted incremental analysis
- Maintain consistent snapshot semantics after partial updates
- Do not block UI thread on heavy recomputation

## Validation

- Single-file update budget checks
- Invalidation rule tests
- Integration tests for cache hit/miss behavior
