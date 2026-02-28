---
name: routescope-release-readiness
description: Execute RouteScope release gates before publishing extension artifacts. Use when preparing a release candidate, validating build/test baselines, performance budgets, privacy/security defaults, export behavior, and docs/changelog synchronization.
---

# Release Readiness Gate

1. Run workspace and package build/test gates with npm workspace commands.
2. Verify release checklist alignment:
- Build and core tests pass
- Golden snapshots expected and reviewed
- Extension E2E smoke passes
- Telemetry default is off
- Webview CSP is strict
- Export outputs (JSON/Mermaid/SVG/PNG) verified

## Budget Checks

- Full analysis latency within documented targets
- Incremental update budget within target
- Large graph rendering fallback behaves correctly

## Documentation Sync

- Reflect permanent behavior changes in `dev/TDD_RouteScope_v2.0.md`
- Reflect user-facing behavior changes in `dev/PRD_RouteScope_v2.0.md`
- Keep `AGENTS.md` default workflow consistent
