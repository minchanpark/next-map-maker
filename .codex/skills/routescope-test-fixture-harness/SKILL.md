---
name: routescope-test-fixture-harness
description: Build and maintain RouteScope test and fixture coverage. Use when adding unit, golden, integration, and extension E2E tests, creating required fixtures for app/pages/hybrid/alias/monorepo scenarios, and enforcing confidence/contract regressions.
---

# Test Fixture Harness

1. Add tests in the same task as behavior changes.
2. Maintain required fixture families:
- App advanced routing
- Pages routing
- Hybrid app/pages
- tsconfig alias/baseUrl
- Monorepo app selection
- Large-scale project

## Test Layers

- Unit: route rules, resolver, JSX collector, confidence labels
- Golden: route tree and graph snapshots
- Integration: analyzer pipeline behavior
- Extension E2E: command -> analysis -> view refresh -> open source

## Quality Rules

- Update snapshots intentionally with reason noted
- Fail on confidence-label regressions
- Prefer deterministic fixture outputs over brittle mocks
