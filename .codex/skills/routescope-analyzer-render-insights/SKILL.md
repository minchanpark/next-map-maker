---
name: routescope-analyzer-render-insights
description: Build heuristic render graph and insight generation in analyzer-core. Use when implementing JSX tag collection, component matching, best-effort render edges, warning generation, and risk/statistics insights while preserving confidence separation.
---

# Analyzer Render Insights

1. Implement in `packages/analyzer-core/src/renders/*` and `src/insights/*`.
2. Label render edges as `best-effort` only.
3. Never upgrade heuristic matches to `exact`.

## Render Heuristic Rules

- Collect JSX component tags conservatively
- Match components using deterministic fallback order
- Record ambiguity or misses as warnings
- Keep pipeline resilient to parse failures

## Insight Rules

- Include actionable warning codes/messages
- Keep code content out of logs
- Surface high-risk patterns (orphan components, cycles) without crashing

## Validation

- Unit tests for matcher behavior
- Integration tests for mixed-confidence graph output
- Snapshot updates for edge metadata and legend expectations
