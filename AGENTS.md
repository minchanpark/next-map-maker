# AGENTS.md

This file defines the default working contract for agents in this repository.
It is optimized for Codex-style implementation flow and aligned with:

- `dev/PRD_RouteScope_v2.0.md` (v3.0, Extension-first)
- `dev/TDD_RouteScope_v2.0.md` (v3.0, Extension-first)

Last updated: 2026-02-28 (Asia/Seoul)

---

## 1. Product Context

Project: **RouteScope for VSCode**

Goal:
- Analyze Next.js codebases statically (no runtime execution).
- Visualize route structure and code/data flow inside VSCode.
- Support App Router + Pages Router + hybrid projects.

Primary outputs:
- Route Tree (`exact`)
- Import Graph (`exact`)
- Render Graph (`best-effort`)
- Insights/Warnings
- Export artifacts (JSON, Mermaid, SVG/PNG)

---

## 2. Non-Negotiable Principles

1. Extension-first architecture.
- Do not redesign this as a web-upload SaaS in MVP scope.

2. Static analysis only.
- Never require `next dev`, `next build`, app runtime hooks, or project execution for analysis correctness.

3. Confidence separation is mandatory.
- Deterministic results must be labeled `exact`.
- Heuristic results must be labeled `best-effort`.

4. Local/privacy-first behavior.
- No source upload by default.
- Telemetry must be opt-in only and metadata-only.

5. Keep Analyzer Core reusable.
- Analyzer must stay independent of VSCode APIs.
- VSCode integration belongs in `packages/extension`.

---

## 3. Current Repository State

As of this file version:
- The repository currently contains planning docs under `dev/`.
- Production implementation packages are not scaffolded yet.

When bootstrapping code, follow the structure in section 4 exactly unless the user asks to change architecture.

---

## 4. Target Monorepo Structure

Use this as the default package layout:

```text
next-map-maker/
├─ AGENTS.md
├─ dev/
│  ├─ PRD_RouteScope_v2.0.md
│  └─ TDD_RouteScope_v2.0.md
├─ package.json
├─ package-lock.json
├─ tsconfig.base.json
├─ turbo.json
├─ fixtures/
└─ packages/
   ├─ shared-schema/
   ├─ analyzer-core/
   ├─ extension/
   └─ webview-app/
```

Package responsibilities:
- `shared-schema`: contracts/types for graph, route tree, warnings, bridge messages.
- `analyzer-core`: scan/parser/route/import/render/insight/incremental/export logic.
- `extension`: commands, tree providers, diagnostics, status bar, webview host bridge.
- `webview-app`: graph rendering UI (React Flow), filters, inspector, export UI.

---

## 5. Approved Tech Stack

Use these defaults unless explicitly overridden:

- Language: TypeScript (strict mode)
- Package manager: `npm` (required)
- Monorepo: `npm workspaces` (`turbo` optional)
- Analyzer parsing: `@swc/core` primary + TS Compiler API fallback
- File scan: `fast-glob`
- Graph: `graphlib` + internal utilities
- Extension: VSCode Extension API
- Webview UI: React 18 + React Flow + Zustand + Zod
- Tests: Vitest + `@vscode/test-electron`
- Build tooling: `tsup` or `esbuild` (package-specific)

Do not introduce alternative frameworks without clear benefit and user approval.
Do not use `pnpm`/`yarn`/`bun` commands in docs, scripts, or examples unless explicitly requested by the user.

---

## 6. Architecture Boundaries

1. `analyzer-core` must not import `vscode`.
2. `extension` must not reimplement parser/resolve logic from `analyzer-core`.
3. `webview-app` receives data via typed message protocol only.
4. Shared contracts live in `shared-schema` and are single source of truth.
5. Route mapping and resolve rules must be deterministic where specified.

---

## 7. Analysis Rules That Must Be Preserved

Route handling:
- App Router: `app/**/page.*`, `layout.*`, `template.*`, `loading.*`, `error.*`, `not-found.*`, `app/api/**/route.*`
- Pages Router: `pages/index.*`, dynamic segments, `pages/api/**`, `_app`, `_document`, `_error`, `404`
- Special segment handling: route groups, parallel routes, dynamic/catch-all, private folders

Import handling:
- Support static import, re-export, type-only import, require, static-string dynamic import
- Resolve order: relative -> `paths` -> `baseUrl` -> extension/index completion -> external

Render handling:
- JSX component tag collection is heuristic and always `best-effort`

Client boundary:
- `'use client'` detection is deterministic and part of `exact` metadata

---

## 8. Performance and Safety Budgets

Default engineering budgets:
- 500 files full analysis: <= 15s
- 3000 files full analysis: <= 45s
- Single file incremental update: <= 2s
- Graph 2000 nodes render: <= 2s

Guardrails:
- Warn when node count grows too large.
- Enable partial/compact mode for large graphs.
- Avoid unbounded memory growth in webview and parser caches.

Security/privacy:
- No code content in logs.
- CSP for webview must be strict.
- Telemetry must default to off.

---

## 9. Testing Requirements

Minimum test layers:
- Unit: route mapping, resolver, JSX collector, confidence labels
- Golden: route tree and core graph snapshots
- Integration: analyzer pipeline with fixtures
- Extension E2E: command -> analysis -> view refresh -> open source
- Performance benchmark: large fixture baseline

Required fixture coverage:
- App advanced routing
- Pages routing
- Hybrid app/pages
- tsconfig alias/baseUrl
- Monorepo app selection
- Large-scale project

---

## 10. Implementation Priority (Default)

Follow this order for new builds:

1. Monorepo scaffold + shared schema
2. Analyzer core: scan + route tree + layout chain
3. Analyzer core: import graph + resolver
4. Extension host: commands + tree view + status/output
5. Webview graph + inspector + source jump
6. Render graph + reverse lookup + warnings/insights
7. Incremental analysis + cache invalidation
8. Export (JSON/Mermaid/SVG/PNG)
9. Full test hardening + performance tuning

---

## 11. Code Style and Review Rules

1. Keep modules small and single-responsibility.
2. Prefer explicit types at boundaries (I/O, bridge, public APIs).
3. Avoid `any`; if unavoidable, isolate and document.
4. Add comments only where logic is non-obvious.
5. Keep error codes stable and user-facing messages actionable.
6. Respect confidence labels in UI and data model.
7. Avoid hidden coupling between packages.

When changing schemas:
- Update `shared-schema` first.
- Then update analyzer output + extension/webview consumers.
- Add migration notes in PR description or docs.

---

## 12. Operational Workflow for Agents

At the start of every new Codex session in this repository:

1. Open and read `dev/PRD_RouteScope_v2.0.md`.
2. Open and read `dev/TDD_RouteScope_v2.0.md`.
3. Extract task-relevant constraints before proposing or editing code.

Then, for each substantial task:

1. Confirm scope against PRD/TDD.
2. Update or add code in the correct package boundary.
3. Run relevant tests.
4. Validate no architectural drift from this file.
5. If behavior or contract changes, update docs in `dev/`.

If blocked by missing scaffold:
- Create the minimal scaffold needed in the target package.
- Do not over-generate unrelated files.

---

## 13. Suggested Commands (After Scaffold Exists)

Use `npm` commands as defaults:

```bash
npm install
npm run build -ws
npm run test -ws
npm run test -w @routescope/analyzer-core
npm run test -w @routescope/extension
npm run build -w @routescope/webview-app
```

Command convention:
- Single workspace: `npm run <script> -w <workspace>`
- All workspaces: `npm run <script> -ws`

Optional quality checks:

```bash
npm run lint -ws
npm run typecheck -ws
```

---

## 14. Definition of Done for Typical Changes

A change is done when:

1. It stays within the package boundary rules.
2. It preserves `exact` vs `best-effort` semantics.
3. It includes adequate tests or updates existing fixtures.
4. It keeps VSCode UX coherent (tree/webview/inspector/source jump).
5. It updates docs if contract, architecture, or workflow changed.

---

## 15. Change Control

If a task conflicts with this file:

1. Follow direct user instruction first.
2. State the conflict explicitly.
3. Propose the minimum viable adjustment.
4. Update `AGENTS.md` if the new direction should become default.

---

## 16. Always-Reference Checklist (Use Every Task)

Before coding:

1. Re-check `dev/PRD_RouteScope_v2.0.md` and `dev/TDD_RouteScope_v2.0.md` for the current task scope.
2. Identify target package first (`shared-schema`, `analyzer-core`, `extension`, `webview-app`).
3. Confirm if change affects `exact` vs `best-effort` semantics.
4. Confirm whether schema/message contract changes are required.
5. Confirm fixture/test impact before implementation starts.

While coding:

1. Keep package boundary clean (no cross-layer leakage).
2. Preserve route/resolve deterministic behavior.
3. Keep error code + warning code consistent with existing naming.
4. Add/update tests in the same task, not later.

Before closing task:

1. Run minimal package-specific tests.
2. Validate VSCode flow: analyze -> view refresh -> selection -> source jump.
3. Verify docs impact (`dev/PRD_*`, `dev/TDD_*`, `AGENTS.md`).
4. Note performance impact if parser, graph, layout, or cache changed.

---

## 17. Source-of-Truth and Decision Order

Use this order when requirements conflict:

1. Explicit user instruction in current task
2. `AGENTS.md` (repo default execution policy)
3. `dev/TDD_RouteScope_v2.0.md` (technical design baseline)
4. `dev/PRD_RouteScope_v2.0.md` (product requirement baseline)

If a higher-priority source invalidates a lower one:

1. Implement requested behavior.
2. Record the mismatch in task notes.
3. Update the affected doc in the same change if the decision is permanent.

---

## 18. Task Playbooks (Day-to-Day Reference)

### A) Adding/Changing Route Rules

Touch points:

1. `packages/analyzer-core/src/routes/*`
2. `packages/shared-schema/src/route-tree.ts` (if data shape changes)
3. `fixtures/*` + golden tests
4. `packages/extension` tree labels and inspector output
5. `packages/webview-app` node metadata rendering

Must verify:

1. URL mapping is deterministic.
2. Layout chain ordering remains root -> nearest.
3. Confidence remains `exact`.

### B) Import/Resolve Logic Changes

Touch points:

1. `packages/analyzer-core/src/imports/*`
2. `packages/analyzer-core/src/workspace/load-tsconfig.ts`
3. `fixtures/alias`, `fixtures/hybrid`, `fixtures/monorepo`

Must verify:

1. Resolve order is preserved.
2. Unresolved imports remain explicit and diagnosable.
3. No VSCode-specific logic enters analyzer core.

### C) Render Graph Changes

Touch points:

1. `packages/analyzer-core/src/renders/*`
2. `packages/shared-schema/src/graph.ts` (if edge meta changes)
3. webview edge legend/label

Must verify:

1. All render edges stay `best-effort`.
2. Heuristic misses produce warnings, not crashes.

### D) Extension UX Changes

Touch points:

1. `packages/extension/src/commands/*`
2. `packages/extension/src/views/*`
3. `packages/extension/src/webview/*`

Must verify:

1. Command palette entry works.
2. Tree selection syncs with webview selection.
3. Open source jump works with missing line fallback.

### E) Webview/Graph Changes

Touch points:

1. `packages/webview-app/src/components/*`
2. `packages/webview-app/src/stores/*`
3. `packages/webview-app/src/graph/*`

Must verify:

1. Filter state sync remains deterministic.
2. Large graph fallback mode still triggers.
3. Accessibility labels and confidence legend remain visible.

---

## 19. Contract Change Protocol (Schema/Message)

Any schema or message change requires this exact sequence:

1. Update `packages/shared-schema` first.
2. Update analyzer producer next.
3. Update extension/webview consumers.
4. Update fixtures/golden snapshots.
5. Update docs (`TDD`, then `PRD` if user-visible behavior changed).

Rules:

1. No silent schema drift.
2. Keep fields additive when possible.
3. Remove fields only with explicit migration note in commit/PR description.

---

## 20. Package-Level Quality Gates

`shared-schema`:

1. Build passes with strict TS.
2. No circular type dependencies.

`analyzer-core`:

1. Unit + integration + golden pass.
2. Parse failure behavior tested.
3. Alias/baseUrl resolution tested.

`extension`:

1. Command registration tests pass.
2. Tree provider render/update tests pass.
3. Webview bridge message validation passes.

`webview-app`:

1. Graph render sanity test passes.
2. Filter/search behavior test passes.
3. Export path from UI event to host message passes.

---

## 21. Debugging Quick Reference

Symptom: routes missing

1. Verify selected app root.
2. Verify route-group/private-folder filtering logic.
3. Verify ignored glob patterns are not over-matching.

Symptom: unresolved imports spike

1. Recheck `tsconfig` load/merge.
2. Recheck path alias wildcard replacement.
3. Recheck extension/index resolution order.

Symptom: webview freezes

1. Check node count and depth settings.
2. Ensure partial mode triggers as designed.
3. Disable expensive labels/animation in large mode.

Symptom: selection/open-source mismatch

1. Validate message payload path normalization.
2. Validate URI conversion for workspace root.
3. Fallback to file open without line when line info is absent.

---

## 22. Release Checklist (Reference)

1. Run package builds and core tests.
2. Run fixture golden tests and verify expected snapshot changes.
3. Run extension E2E smoke tests.
4. Verify settings defaults (`telemetry=false`, safe budgets).
5. Verify webview CSP and no external script dependency.
6. Verify export outputs (JSON/Mermaid/SVG/PNG).
7. Update changelog/release notes with user-visible changes.
8. Confirm docs are synchronized (`PRD`, `TDD`, `AGENTS`).
