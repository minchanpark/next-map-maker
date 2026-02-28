---
name: routescope-session-bootstrap
description: Mandatory startup workflow for the next-map-maker repository. Use for every new Codex session or resumed session in this repository, before any analysis, design, coding, or review task. Read dev/PRD_RouteScope_v2.0.md and dev/TDD_RouteScope_v2.0.md first, extract task-relevant constraints, and apply them as the execution baseline.
---

# Session Startup Contract

1. Open and read:
- `dev/PRD_RouteScope_v2.0.md`
- `dev/TDD_RouteScope_v2.0.md`

2. Extract and state constraints that affect the current task:
- Extension-first architecture
- Static analysis only (no runtime execution dependency)
- Confidence separation (`exact` vs `best-effort`)
- Package boundaries (`shared-schema`, `analyzer-core`, `extension`, `webview-app`)
- npm workspace conventions and required test scope

3. Before making changes, map the task to target package and contract impact:
- Confirm whether schema or message contracts change
- Confirm whether fixtures/golden/tests must change
- Identify docs that must be updated (`TDD`, `PRD`, `AGENTS.md`) if behavior or contract changes

4. During implementation:
- Keep `analyzer-core` free of VSCode API dependencies
- Keep extension and webview consuming shared contracts instead of redefining shapes
- Preserve deterministic route/resolve behavior where specified as `exact`
- Label heuristic outputs as `best-effort`

5. Before closing:
- Run relevant workspace or package tests
- Verify no architecture drift from PRD/TDD/AGENTS
- Report constraint checks and any deliberate exceptions

## Response Template

Use this compact template in the first working update of each session:

```text
Startup checks completed:
- PRD read: dev/PRD_RouteScope_v2.0.md
- TDD read: dev/TDD_RouteScope_v2.0.md
- Task scope: <target package + feature area>
- Contract impact: <none | schema/message + details>
- Confidence impact: <exact | best-effort | both>
```
