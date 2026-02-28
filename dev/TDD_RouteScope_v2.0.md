# 기술 설계서 (v3.0) — RouteScope VSCode Extension System Design

- **문서 버전**: v3.0 (Extension-first)
- **최종 업데이트**: 2026-02-28 (Asia/Seoul)
- **대응 PRD**: PRD_RouteScope_v2.0.md v3.0
- **불변 전제**: 코드 실행 없이 정적 분석만 수행

---

## 1. 시스템 개요

### 1.1 핵심 산출물 (Artifacts)

| 산출물 | 파일 | 설명 | Confidence |
|--------|------|------|-----------|
| Route Tree | `routeTree.json` | URL 트리 + 라우터 타입 + 레이아웃 체인 + 특수 파일 메타 | exact |
| Graph | `graph.json` | nodes + edges (`contains`, `wraps`, `imports`, `renders`) | mixed |
| Insights | `insights.json` | 경고/통계/리스크(고아 컴포넌트, 순환 의존 등) | mixed |
| Metadata | `metadata.json` | 분석 시간, 파일 수, 실패율, 캐시 히트율 | exact |
| UI Snapshot | `snapshot.svg/png` | Graph 현재 뷰 내보내기 | — |

### 1.2 아키텍처 (확정)

```
┌──────────────────────────────────────────────────────────────┐
│ VSCode                                                       │
│  ┌──────────────────────┐         ┌───────────────────────┐ │
│  │ Extension Host       │         │ Webview (React)       │ │
│  │ - commands           │◀──────▶ │ - graph canvas         │ │
│  │ - tree providers     │ postMsg │ - inspector            │ │
│  │ - file watchers      │ bridge  │ - filters/search       │ │
│  │ - status/output      │         │ - export UI            │ │
│  └───────────┬──────────┘         └──────────┬────────────┘ │
│              │                                │              │
│              ▼                                │              │
│      ┌───────────────────┐                    │              │
│      │ Analyzer Core     │────────────────────┘              │
│      │ - scan            │    analysis snapshot               │
│      │ - route builder   │                                     │
│      │ - import graph    │                                     │
│      │ - render graph    │                                     │
│      │ - incremental     │                                     │
│      └─────────┬─────────┘                                     │
│                │                                               │
└────────────────┼───────────────────────────────────────────────┘
                 ▼
       Workspace File System
       + .routescope/cache (optional)
```

### 1.3 실행 모델

- 서버/DB/큐 없이 **단일 로컬 프로세스 모델**.
- 분석은 Extension Host에서 수행하되, 무거운 파싱/레이아웃 계산은 Worker Thread로 오프로드.
- 결과는 메모리 캐시 + 로컬 캐시(`.routescope/`)에 저장.

---

## 2. 기술 스택

### 2.1 모노레포/빌드

| 영역 | 기술 | 버전 가이드 | 선택 이유 |
|------|------|-------------|-----------|
| Package Manager | `npm` (고정) | 10+ | 프로젝트 표준 패키지 매니저 |
| Monorepo | `npm workspaces` + `turbo`(선택) | 최신 | 패키지 간 빌드 캐시 |
| Language | TypeScript | 5.6+ | 타입 안정성 |
| Lint | ESLint + typescript-eslint | 9+ | 품질 관리 |
| Format | Prettier | 3+ | 일관성 |
| Test Runner | Vitest | 2+ | TS 친화적 단위/통합 테스트 |

### 2.2 VSCode Extension

| 영역 | 기술 |
|------|------|
| API | `vscode` Extension API |
| 최소 엔진 | VSCode `^1.95.0` |
| 번들러 | `tsup` 또는 `esbuild` |
| 테스트 | `@vscode/test-electron` |
| 배포 | `vsce` + `ovsx` |

### 2.3 Analyzer Core

| 영역 | 기술 | 비고 |
|------|------|------|
| 파일 탐색 | `fast-glob` | ignore 패턴 성능 |
| AST 파싱(1순위) | `@swc/core` | 속도 우선 |
| AST 파싱(fallback) | TypeScript Compiler API | 파서 호환성 보강 |
| 경로 해석 | 자체 resolver (`paths`, `baseUrl`, index 확장자 보정) | Next 프로젝트에 특화 |
| 그래프 알고리즘 | `graphlib` + 자체 유틸 | SCC/역조회 |
| 해시 | `xxhash` 또는 `sha1` | 캐시 invalidation |

### 2.4 Graph Webview

| 영역 | 기술 | 이유 |
|------|------|------|
| UI 프레임워크 | React 18 | 유지보수성 |
| 그래프 렌더링 | React Flow 12 | 커스텀 노드/엣지, minimap |
| 레이아웃 | dagre(MVP), elkjs(v1 옵션) | 성능 vs 품질 균형 |
| 상태관리 | Zustand | 경량 |
| 스키마 검증 | Zod | 메시지 브리지 안전성 |
| 스타일 | CSS Variables + Tailwind(선택) | 테마 대응 |

### 2.5 관측/품질

| 영역 | 기술 | 정책 |
|------|------|------|
| 로그 | VSCode OutputChannel | 코드 내용 미로그 |
| 진단 | DiagnosticCollection | 파싱/resolve 문제 표시 |
| Telemetry | opt-in only | 기본 OFF |
| 성능 계측 | `performance.now()` + phase timers | 로컬 리포트 저장 |

### 2.6 npm 명령 규약

모든 로컬/CI 스크립트와 문서 예시는 `npm` 명령으로 통일한다.

```bash
npm install
npm run build -ws
npm run test -ws
npm run test -w @routescope/analyzer-core
npm run test -w @routescope/extension
npm run build -w @routescope/webview-app
```

- 워크스페이스 단일 실행: `npm run <script> -w <workspace>`
- 워크스페이스 전체 실행: `npm run <script> -ws`
- 배포 도구 실행: `npm exec vsce`, `npm exec ovsx`
- `pnpm`/`yarn`/`bun` 기준 명령은 사용하지 않는다.

---

## 3. 프로젝트 구조 (권장 모노레포)

### 3.1 최상위 구조

```text
next-map-maker/
├─ dev/
│  ├─ PRD_RouteScope_v2.0.md
│  └─ TDD_RouteScope_v2.0.md
├─ package.json
├─ package-lock.json
├─ tsconfig.base.json
├─ turbo.json                      # 선택
├─ .eslintrc.cjs
├─ .prettierrc
├─ .vscodeignore
├─ scripts/
│  ├─ clean.mjs
│  ├─ benchmark.mjs
│  └─ release.mjs
├─ fixtures/
│  ├─ app-basic/
│  ├─ app-advanced/
│  ├─ pages-basic/
│  ├─ hybrid/
│  ├─ alias/
│  └─ monorepo/
└─ packages/
   ├─ shared-schema/
   ├─ analyzer-core/
   ├─ extension/
   └─ webview-app/
```

### 3.2 `packages/shared-schema`

```text
packages/shared-schema/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ graph.ts            # Node/Edge 타입
   ├─ route-tree.ts       # RouteTree 타입
   ├─ insights.ts         # 경고/통계 타입
   ├─ metadata.ts         # 분석 메타 타입
   ├─ messages.ts         # extension↔webview 메시지 계약
   └─ index.ts
```

- 역할: 데이터 계약 단일화.
- Extension Host, Analyzer, Webview가 동일 타입을 공유.

### 3.3 `packages/analyzer-core`

```text
packages/analyzer-core/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts
│  ├─ config/
│  │  ├─ defaults.ts
│  │  └─ ignore-patterns.ts
│  ├─ domain/
│  │  ├─ nodes.ts
│  │  ├─ edges.ts
│  │  └─ warnings.ts
│  ├─ workspace/
│  │  ├─ detect-next-app.ts
│  │  ├─ resolve-workspace-root.ts
│  │  └─ load-tsconfig.ts
│  ├─ scanner/
│  │  ├─ scan-files.ts
│  │  └─ classify-file-kind.ts
│  ├─ routes/
│  │  ├─ app-router.ts
│  │  ├─ pages-router.ts
│  │  ├─ special-segments.ts
│  │  └─ layout-chain.ts
│  ├─ parser/
│  │  ├─ parse-file.ts
│  │  ├─ swc-parser.ts
│  │  ├─ ts-fallback.ts
│  │  └─ ast-cache.ts
│  ├─ imports/
│  │  ├─ extract-imports.ts
│  │  ├─ resolve-import.ts
│  │  └─ alias-resolver.ts
│  ├─ renders/
│  │  ├─ jsx-tag-collector.ts
│  │  ├─ component-matcher.ts
│  │  └─ build-render-edges.ts
│  ├─ insights/
│  │  ├─ orphan-components.ts
│  │  ├─ circular-deps.ts
│  │  └─ client-boundary-stats.ts
│  ├─ incremental/
│  │  ├─ file-hash-index.ts
│  │  ├─ dependency-index.ts
│  │  └─ rebuild-planner.ts
│  ├─ export/
│  │  ├─ to-mermaid.ts
│  │  ├─ to-json.ts
│  │  └─ sanitize-output.ts
│  └─ pipeline/
│     ├─ analyze-workspace.ts
│     ├─ analyze-incremental.ts
│     └─ phases.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ golden/
└─ benchmarks/
```

- 역할: 순수 분석 엔진.
- VSCode API 의존 금지.

### 3.4 `packages/extension`

```text
packages/extension/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ extension.ts
│  ├─ commands/
│  │  ├─ analyze-workspace.ts
│  │  ├─ open-graph.ts
│  │  ├─ export-report.ts
│  │  ├─ rebuild-cache.ts
│  │  └─ select-app-root.ts
│  ├─ services/
│  │  ├─ analyzer-service.ts
│  │  ├─ snapshot-store.ts
│  │  ├─ cache-store.ts
│  │  └─ diagnostics-service.ts
│  ├─ views/
│  │  ├─ route-tree-provider.ts
│  │  ├─ insights-provider.ts
│  │  └─ warnings-provider.ts
│  ├─ webview/
│  │  ├─ panel-provider.ts
│  │  ├─ message-bridge.ts
│  │  └─ csp.ts
│  ├─ state/
│  │  ├─ session-state.ts
│  │  ├─ workspace-state.ts
│  │  └─ command-context.ts
│  ├─ watcher/
│  │  ├─ file-watcher.ts
│  │  └─ debounce-queue.ts
│  ├─ logging/
│  │  ├─ output-channel.ts
│  │  └─ telemetry.ts
│  └─ util/
│     ├─ uri.ts
│     ├─ path.ts
│     └─ time.ts
├─ media/
│  ├─ icon.png
│  └─ codicons.css
└─ syntaxes/
```

- 역할: VSCode 통합, command/view/status/diagnostics 관리.

### 3.5 `packages/webview-app`

```text
packages/webview-app/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ bridge/
   │  ├─ vscode-api.ts
   │  ├─ event-bus.ts
   │  └─ protocol.ts
   ├─ components/
   │  ├─ GraphCanvas.tsx
   │  ├─ FilterBar.tsx
   │  ├─ InspectorPanel.tsx
   │  ├─ NodeLegend.tsx
   │  └─ SearchBar.tsx
   ├─ graph/
   │  ├─ node-factory.ts
   │  ├─ edge-factory.ts
   │  ├─ layout-dagre.ts
   │  └─ layout-elk.ts
   ├─ stores/
   │  ├─ graph-store.ts
   │  ├─ filter-store.ts
   │  └─ selection-store.ts
   ├─ hooks/
   │  ├─ useGraphFilters.ts
   │  └─ useExport.ts
   ├─ styles/
   │  ├─ tokens.css
   │  └─ app.css
   └─ types/
```

- 역할: 그래프 렌더/사용자 상호작용.

---

## 4. VSCode 기여 포인트 설계

### 4.1 `package.json` Contributions (요약)

```json
{
  "activationEvents": [
    "workspaceContains:**/next.config.*",
    "workspaceContains:**/app/**",
    "workspaceContains:**/pages/**",
    "onCommand:routescope.analyzeWorkspace",
    "onView:routescope.routeTree"
  ],
  "contributes": {
    "commands": [
      { "command": "routescope.analyzeWorkspace", "title": "RouteScope: Analyze Workspace" },
      { "command": "routescope.openGraph", "title": "RouteScope: Open Graph" },
      { "command": "routescope.export", "title": "RouteScope: Export" },
      { "command": "routescope.selectAppRoot", "title": "RouteScope: Select App Root" },
      { "command": "routescope.rebuildCache", "title": "RouteScope: Rebuild Cache" }
    ],
    "viewsContainers": {
      "activitybar": [
        { "id": "routescope", "title": "RouteScope", "icon": "media/icon.png" }
      ]
    },
    "views": {
      "routescope": [
        { "id": "routescope.routeTree", "name": "Route Tree" },
        { "id": "routescope.insights", "name": "Insights" },
        { "id": "routescope.warnings", "name": "Warnings" }
      ]
    },
    "configuration": {
      "title": "RouteScope",
      "properties": {
        "routescope.autoAnalyzeOnSave": { "type": "boolean", "default": true },
        "routescope.maxNodes": { "type": "number", "default": 10000 },
        "routescope.defaultDepth": { "type": "number", "default": 3 },
        "routescope.enableTelemetry": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### 4.2 Command 동작 정의

| Command ID | 동작 | 예외 처리 |
|------------|------|----------|
| `routescope.analyzeWorkspace` | 전체 분석 실행 | Next 앱 미감지 시 경고 |
| `routescope.openGraph` | Webview 열기 + 최신 스냅샷 표시 | 스냅샷 없으면 분석 유도 |
| `routescope.export` | Export QuickPick(JSON/Mermaid/SVG/PNG) | 경로 선택 실패 처리 |
| `routescope.selectAppRoot` | 앱 후보 선택 저장 | 취소 시 기존 설정 유지 |
| `routescope.rebuildCache` | 캐시 삭제 후 전체 재분석 | 실패 시 롤백 |

---

## 5. 데이터 모델

### 5.1 Graph Schema

```ts
export type NodeType = 'route' | 'file' | 'component' | 'external';
export type EdgeType = 'contains' | 'wraps' | 'imports' | 'renders' | 'navigates';

export interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
}

export interface RouteNode extends BaseNode {
  type: 'route';
  id: `route:${string}`;
  url: string;
  routerType: 'app' | 'pages';
  filePath: string | null;
  isApi: boolean;
  isDynamic: boolean;
  layoutChain: string[];
  specialFiles: {
    loading?: string;
    error?: string;
    notFound?: string;
    template?: string;
  };
}

export interface FileNode extends BaseNode {
  type: 'file';
  id: `file:${string}`;
  filePath: string;
  kind:
    | 'page'
    | 'layout'
    | 'template'
    | 'loading'
    | 'error'
    | 'not-found'
    | 'route-handler'
    | 'api'
    | 'component'
    | 'util'
    | 'unknown';
  clientBoundary: boolean;
}

export interface ComponentNode extends BaseNode {
  type: 'component';
  id: `component:${string}#${string}`;
  filePath: string;
  name: string;
  isDefault: boolean;
  usedByCount: number;
}

export interface BaseEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  confidence: 'exact' | 'best-effort';
  meta?: {
    reason?: string;
    line?: number;
    importType?: 'static' | 'dynamic' | 'type-only' | 're-export';
    specifiers?: string[];
  };
}
```

### 5.2 Route Tree Schema

```ts
export interface RouteTreeJSON {
  version: '3.0';
  generatedAt: string;
  routerTypes: Array<'app' | 'pages'>;
  tree: RouteTreeNode;
  flatRoutes: FlatRoute[];
}

export interface RouteTreeNode {
  url: string;
  segment: string;
  routerType: 'app' | 'pages';
  filePath: string | null;
  children: RouteTreeNode[];
}

export interface FlatRoute {
  url: string;
  routerType: 'app' | 'pages';
  filePath: string | null;
  isApi: boolean;
  depth: number;
}
```

### 5.3 Snapshot 저장 포맷

```ts
export interface AnalysisSnapshot {
  id: string;                         // timestamp + hash
  workspaceRoot: string;
  appRoot: string;
  generatedAt: string;
  routeTree: RouteTreeJSON;
  graph: {
    nodes: Array<RouteNode | FileNode | ComponentNode | BaseNode>;
    edges: BaseEdge[];
  };
  insights: {
    warnings: AnalysisWarning[];
    stats: Record<string, number>;
  };
  metadata: {
    analysisTimeMs: number;
    filesScanned: number;
    parseFailures: number;
    resolveFailures: number;
    cacheHitRate: number;
  };
}
```

---

## 6. 분석 파이프라인

### 6.1 전체 흐름

```
Command: analyzeWorkspace
  -> detect app root
  -> scan target files
  -> build route tree
  -> parse AST & build import graph
  -> build render graph
  -> compute insights
  -> store snapshot/cache
  -> publish to TreeView + Webview
```

### 6.2 Phase 0: 프로젝트 탐지

1. workspace 폴더 순회
2. `package.json` + `next` 의존성 확인
3. `app/`, `pages/` 존재 확인
4. 후보가 복수이면 Quick Pick
5. 선택 결과를 `workspaceState`에 저장

```ts
interface AppCandidate {
  root: string;
  name: string;
  hasAppRouter: boolean;
  hasPagesRouter: boolean;
}
```

### 6.3 Phase 1: 파일 스캔

```ts
const SCAN_PATTERNS = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.git/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',
  '**/*.stories.*',
  '**/*.d.ts'
];
```

- 결과는 `ScannedFile[]`로 정규화.
- 파일 해시를 계산해 캐시 인덱스에 저장.

### 6.4 Phase 2: Route Tree 생성 (exact)

#### App Router 규칙

| 패턴 | URL 처리 |
|------|---------|
| `app/**/page.*` | URL 노드 생성 |
| `app/api/**/route.*` | `/api/**`로 생성 |
| `(group)` | URL에서 제거 |
| `@slot` | URL에서 제거, `parallelSlots` 메타 |
| `[id]`, `[...slug]`, `[[...slug]]` | 원형 보존 |
| `_private` | 라우트 생성 제외 |

#### Pages Router 규칙

| 패턴 | URL 처리 |
|------|---------|
| `pages/index.*` | `/` |
| `pages/**/[slug].*` | 동적 세그먼트 보존 |
| `pages/api/**` | API 라우트 |
| `_app`, `_document`, `_error`, `404` | 메타 |

#### Layout Chain

- page 파일 디렉토리에서 루트까지 상향 탐색.
- `layout.*`, `template.*`를 발견 순서 역전하여 `[root ... nearest]`로 저장.

### 6.5 Phase 3: Import Graph 생성 (exact)

#### 파싱 전략

1. SWC 파싱 시도
2. 실패 시 TS Compiler API fallback
3. 둘 다 실패하면 warning 기록

#### 추출 대상

- `import`, `export from`, `export * from`
- `import type`
- `require("...")`
- `import("...")`에서 정적 문자열

#### resolve 순서

1. 상대경로
2. tsconfig `paths`
3. tsconfig `baseUrl`
4. 확장자 보정 (`.tsx`, `.ts`, `.jsx`, `.js`)
5. 디렉토리 index 보정
6. 외부 모듈 분류

### 6.6 Phase 4: Render Graph (best-effort)

1. JSX opening tag 수집
2. 대문자 시작 태그만 컴포넌트 후보
3. import 테이블 매칭
4. unresolved는 가상 노드로 처리

### 6.7 Phase 5: Insights

- 고아 컴포넌트: page/route에서 도달되지 않는 component
- 순환 의존: SCC 탐지
- client boundary 비율: `'use client'` 파일 비율
- 라우트 depth 통계

### 6.8 Phase 6: Snapshot 조립

- Graph/Route/Insights/Metadata를 단일 객체로 묶고 스키마 검증
- TreeView/Webview로 배포
- `.routescope/cache/latest.snapshot.json` 저장(설정 가능)

---

## 7. Extension ↔ Webview 데이터 플로우

### 7.1 메시지 프로토콜

```ts
type HostToWebviewMessage =
  | { type: 'snapshot:loaded'; payload: AnalysisSnapshot }
  | { type: 'selection:changed'; payload: { nodeId: string } }
  | { type: 'analysis:progress'; payload: { phase: string; percent: number } }
  | { type: 'analysis:error'; payload: { code: string; message: string } };

type WebviewToHostMessage =
  | { type: 'node:open-source'; payload: { filePath: string; line?: number } }
  | { type: 'export:request'; payload: ExportRequest }
  | { type: 'reverse-lookup:request'; payload: { nodeId: string } }
  | { type: 'filter:changed'; payload: GraphFilterState };
```

### 7.2 시퀀스

```
User -> Command Palette: Analyze Workspace
Extension -> Analyzer Core: run phases
Analyzer Core -> Extension: snapshot
Extension -> TreeView: refresh
Extension -> Webview: postMessage(snapshot:loaded)
User click node in Webview -> message(node:open-source)
Extension -> VSCode: revealTextDocument
```

---

## 8. 캐시/증분 분석 설계

### 8.1 캐시 키

| 키 | 생성 방식 |
|----|-----------|
| 파일 해시 | `hash(relativePath + content)` |
| 라우트 스냅샷 키 | `appRootHash + routeFilesHash` |
| import 그래프 키 | `allSourceHashes + tsconfigHash` |

### 8.2 저장 위치

1. 우선: `<workspace>/.routescope/cache/`
2. fallback: `ExtensionContext.globalStorageUri`

### 8.3 무효화 규칙

| 변경 파일 | 영향 |
|----------|------|
| `app/**/page.*`, `pages/**` | route tree + graph 일부 재계산 |
| `layout.*`, `template.*` | layout chain 재계산 |
| `tsconfig*.json`, `jsconfig.json` | 전체 resolve 캐시 무효화 |
| 일반 컴포넌트 | import/render/insights 부분 재계산 |

### 8.4 감시 전략

- `createFileSystemWatcher('**/*.{ts,tsx,js,jsx,json}')`
- 300~800ms debounce
- 변경 묶음(batch) 단위로 rebuild planner 실행

---

## 9. UI/렌더링 설계

### 9.1 Graph 노드 시각 규칙

| 노드 타입 | 스타일 |
|----------|--------|
| route(page) | 파랑 계열 + URL 라벨 |
| route(api) | 보라 계열 + `API` 배지 |
| file(layout/template) | 초록 계열 |
| component | 주황 계열 |
| external | 회색 계열(기본 숨김) |
| unresolved | 회색 점선 테두리 |

### 9.2 Edge 규칙

| confidence | 스타일 |
|-----------|--------|
| exact | 실선 |
| best-effort | 점선 + `추정` 툴팁 |

### 9.3 대형 그래프 대응

| 노드 수 | 동작 |
|--------|------|
| < 2000 | 전체 렌더 |
| 2000~5000 | 뷰포트 최적화 + 애니메이션 off |
| > 5000 | depth 자동 축소 + collapse 기본 on |
| > 10000 | partial mode + 경고 |

---

## 10. Export 설계

### 10.1 Export 타입

| 타입 | 구현 방식 |
|------|-----------|
| JSON | Snapshot 직렬화 저장 |
| Mermaid | analyzer-core `to-mermaid` 변환 |
| SVG | Webview 캔버스 벡터 export |
| PNG | SVG -> canvas rasterize |

### 10.2 저장 경로

기본: `<workspace>/.routescope/exports/{timestamp}/`

산출 파일 예시:

```text
.routescope/exports/2026-02-27T14-30-00/
├─ routeTree.json
├─ graph.json
├─ insights.json
├─ combined.mmd
├─ graph.svg
└─ graph.png
```

---

## 11. 보안 설계

### 11.1 원칙

- 코드/분석 데이터 외부 전송 없음(기본).
- telemetry는 명시적 opt-in 시 집계 메타데이터만 전송.

### 11.2 Webview 보안

- 엄격한 CSP:
  - `default-src 'none'`
  - `img-src ${webview.cspSource} data:`
  - `script-src ${webview.cspSource}`
  - `style-src ${webview.cspSource} 'unsafe-inline'`
- `acquireVsCodeApi()` 외 브리지 금지.

### 11.3 로그 정책

| 허용 | 금지 |
|------|------|
| 파일 수, 소요시간, 에러 코드 | 소스 코드 본문, 민감 문자열 |

---

## 12. 에러 처리 정책

| 코드 | 조건 | 처리 |
|------|------|------|
| `NO_WORKSPACE` | 열린 폴더 없음 | 명령 중단 + 안내 |
| `NO_NEXT_PROJECT` | Next 앱 미감지 | 경고 + 문서 링크 |
| `MULTIPLE_APPS` | 후보 2개 이상 | Quick Pick |
| `PARSE_ERROR` | 개별 파일 파싱 실패 | 경고 + 부분 결과 |
| `TOO_MANY_PARSE_ERRORS` | 실패율 > 30% | 분석 실패 |
| `RESOLVE_ERROR` | unresolved 비율 과다 | 경고 + 결과 유지 |
| `GRAPH_OVERFLOW` | 노드 과다 | partial mode 전환 |

---

## 13. 성능 목표 및 튜닝

### 13.1 성능 목표

| 시나리오 | 목표 |
|---------|------|
| 500 파일 전체 분석 | 15초 이내 |
| 3000 파일 전체 분석 | 45초 이내 |
| 단일 파일 증분 분석 | 2초 이내 |
| 2000 노드 그래프 렌더 | 2초 이내 |

### 13.2 튜닝 포인트

1. SWC 파싱 병렬화(Worker Thread Pool)
2. resolve 캐시(Map) 재사용
3. graph layout 디바운스
4. webview 노드 컴포넌트 `memo` 적용
5. large graph에서 minimap/label 렌더 단순화

---

## 14. 테스트 전략

### 14.1 테스트 레벨

| 레벨 | 대상 | 도구 |
|------|------|------|
| Unit | URL 매핑, resolve, JSX 수집 | Vitest |
| Golden | `routeTree.json`, `graph.json` | Vitest Snapshot |
| Integration | analyzer pipeline 전체 | Vitest + fixtures |
| Extension E2E | command/view/webview/message | `@vscode/test-electron` |
| Perf | 대형 fixture | benchmark 스크립트 |

### 14.2 필수 Fixture

| Fixture | 목적 |
|---------|------|
| `app-advanced` | route group/parallel/intercepting 검증 |
| `pages-basic` | pages router 매핑 검증 |
| `hybrid` | app+pages 통합 검증 |
| `alias` | tsconfig paths/baseUrl 검증 |
| `monorepo` | 앱 선택 로직 검증 |
| `large` | 성능/메모리 측정 |

### 14.3 릴리즈 게이트

- Golden 테스트 모두 통과
- Extension E2E 주요 8개 시나리오 통과
- 3000 파일 fixture 기준 성능 목표 통과
- CSP/로그 정책 수동 점검 통과

---

## 15. 구현 단계 계획

### M1 (1주)
- 모노레포 초기화
- shared-schema/analyzer-core 뼈대
- Extension command/status/output 기본

### M2 (2주)
- Route Tree + Layout Chain
- TreeView 렌더
- 앱 선택/설정 저장

### M3 (2주)
- Import Graph + resolve
- Webview Graph 기본
- 파일 점프 연동

### M4 (2주)
- Render Graph + reverse lookup
- 필터/검색/depth
- warnings/insights 뷰

### M5 (1.5주)
- 증분 분석 + 파일 watcher
- 캐시 저장/무효화
- 성능 튜닝 1차

### M6 (1.5주)
- Export(JSON/Mermaid/SVG/PNG)
- 테스트/문서/마켓플레이스 패키징

총 예상: **약 10주**

---

## 16. 부록 A — 권장 설정 키

| 설정 키 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `routescope.autoAnalyzeOnOpen` | boolean | true | 워크스페이스 오픈 시 자동 분석 |
| `routescope.autoAnalyzeOnSave` | boolean | true | 파일 저장 시 증분 분석 |
| `routescope.appRoot` | string | `""` | 분석할 앱 루트(모노레포용) |
| `routescope.defaultDepth` | number | 3 | 그래프 기본 depth |
| `routescope.maxNodes` | number | 10000 | 그래프 최대 노드 |
| `routescope.hideExternalByDefault` | boolean | true | 외부 모듈 기본 숨김 |
| `routescope.enableTelemetry` | boolean | false | 텔레메트리 opt-in |

## 17. 부록 B — Output Channel 로그 예시

```text
[RouteScope] Analyze started: /workspace/apps/web
[RouteScope] Phase scan done: files=1248 (1.2s)
[RouteScope] Phase routes done: routes=86 (0.4s)
[RouteScope] Phase imports done: edges=4721 unresolved=132 (7.8s)
[RouteScope] Phase renders done: edges=890 (2.3s)
[RouteScope] Insights: orphanComponents=24 circularGroups=3
[RouteScope] Analyze completed in 12.6s (cacheHit=71%)
```
