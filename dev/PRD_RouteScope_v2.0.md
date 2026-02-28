# PRD (v3.0) — RouteScope VSCode Extension: Next.js Route & Data Flow Visualizer

- **문서 버전**: v3.0 (Extension-first)
- **최종 업데이트**: 2026-02-28 (Asia/Seoul)
- **제품명**: RouteScope for VSCode
- **대응 기술 설계서**: TDD_RouteScope_v2.0.md (v3.0 기준으로 동기화)

---

## 1. 제품 한 줄 정의

로컬 Next.js 코드베이스를 **실행 없이 정적 분석**해서, VSCode 안에서 **라우트 구조(App/Pages Router)**, **레이아웃 체인**, **컴포넌트/모듈 데이터 플로우**를 시각화하고 탐색하는 개발자용 익스텐션.

---

## 2. 제품 방향 결정

### 2.1 결정

MVP는 웹 서비스가 아니라 **VSCode Extension**으로 출시한다.

### 2.2 결정 이유

| 기준 | VSCode Extension | 웹 서비스 |
|------|------------------|-----------|
| 코드 접근 | 로컬 워크스페이스 직접 접근 | 업로드/동기화 필요 |
| 보안/프라이버시 | 코드 외부 전송 없이 동작 가능 | 업로드 정책/보안 심사 필요 |
| 개발 맥락 | 코드 편집 중 즉시 확인/점프 가능 | 컨텍스트 전환 필요 |
| MVP 난이도 | 분석기 + IDE UI에 집중 가능 | 인프라/계정/스토리지 추가 필요 |
| 협업 공유 | 상대적으로 약함 | 링크 공유 강함 |

### 2.3 제품 전략

1. `Analyzer Core`를 독립 패키지로 구현한다.
2. 1차 릴리즈는 VSCode Extension으로 제공한다.
3. 이후 웹 서비스는 Core 결과(JSON) 렌더링 계층으로 확장한다.

---

## 3. 배경과 문제

### 3.1 사용자 문제

| 문제 | 상세 | 심각도 |
|------|------|--------|
| 라우트 추적 어려움 | App Router의 route group/parallel/intercepting으로 실제 URL 추적이 어려움 | 높음 |
| 레이아웃 영향 범위 불명확 | `layout.tsx`, `template.tsx` 적용 순서를 수동 탐색해야 함 | 높음 |
| 영향도 파악 지연 | 공통 컴포넌트 수정 시 어떤 페이지가 영향 받는지 즉시 확인 어려움 | 높음 |
| 하이브리드 라우터 복잡성 | `app/` + `pages/` 혼재 프로젝트에서 구조 가시성 저하 | 중간 |
| AI 코드 증가 | 코드 파일 급증으로 구조 이해 비용 급격히 증가 | 높음 |

### 3.2 불변 원칙

1. **코드를 실행하지 않는다.**
   - `npm install`, `next build`, `next dev`, 테스트 실행을 요구하지 않는다.
2. **정확도 레벨을 분리한다.**

| 레벨 | 대상 | 표시 |
|------|------|------|
| `exact` | Route Tree, Layout Chain, Import Graph, Client Boundary | 실선/기본 뱃지 |
| `best-effort` | Render Graph, Navigation Graph | 점선/추정 뱃지 |

3. **오프라인 우선 설계**
   - 네트워크가 없어도 핵심 기능이 동작해야 한다.
4. **npm 기준 운영**
   - 문서/스크립트/예시는 `npm` + `npm workspaces`를 기준으로 유지한다.
   - 락파일 기준은 `package-lock.json`으로 통일한다.

---

## 4. 목표 / 비목표

### 4.1 MVP Goals

| ID | 목표 | 수용 기준 |
|----|------|----------|
| G1 | App Router + Pages Router 동시 지원 | 하이브리드 프로젝트에서 두 라우터가 하나의 트리로 표시되고 `routerType`으로 구분됨 |
| G2 | URL 라우트 트리 시각화 | Route Tree View에서 검색/접기/필터/클릭 이동 가능 |
| G3 | 페이지 상세 인스펙터 | URL, 파일 경로, 레이아웃 체인, 특수 파일, `use client`, import/render 요약 표시 |
| G4 | 컴포넌트 역조회 | 특정 컴포넌트를 사용하는 페이지 목록(빈도순) 제공 |
| G5 | IDE 통합 탐색 | 트리/그래프에서 클릭 시 해당 파일 라인으로 점프 가능 |
| G6 | Export 지원 | Mermaid, JSON, SVG/PNG(현재 뷰) 내보내기 가능 |
| G7 | 증분 재분석 | 파일 저장 후 변경 영향 범위만 우선 재분석(전체 재분석 fallback) |

### 4.2 Non-goals (MVP)

| 비목표 | 이유 |
|--------|------|
| 클라우드 업로드/공유 링크 | Extension-first 범위 외 |
| 런타임 렌더 추적 | 코드 실행 금지 원칙 |
| 상태 전파/Hook 동적 흐름 완전 분석 | 정적 분석 범위 외 |
| 프레임워크 범용 지원(Remix/Nuxt 등) | Next.js 우선 전략 |
| 모바일 IDE 최적화 | VSCode Desktop 우선 |

---

## 5. 대상 사용자

### P1. AI 기반 솔로 개발자
- 구조가 무너진 프로젝트를 빠르게 파악하고 리팩토링 영향을 예측하려는 사용자

### P2. 팀 리드/리뷰어
- 변경 파일이 라우트/공통 컴포넌트에 미치는 영향을 리뷰 전에 확인하려는 사용자

### P3. 신규 온보딩 개발자
- 라우트/레이아웃/핵심 컴포넌트 관계를 1~2시간 내 파악하려는 사용자

---

## 6. 핵심 사용자 시나리오 (User Stories)

| ID | Story | 수용 기준 |
|----|-------|----------|
| US1 | 워크스페이스를 열고 `RouteScope: Analyze Workspace`를 실행한다 | 30초 내 첫 Route Tree 결과 표시(중형 프로젝트) |
| US2 | `/dashboard/settings` 페이지의 레이아웃 체인을 확인한다 | Inspector에 루트→하위 순으로 체인 표시 |
| US3 | 특정 컴포넌트의 영향 페이지를 본다 | Reverse Lookup 목록 + 파일 점프 가능 |
| US4 | 외부 모듈을 숨기고 내부 흐름만 본다 | External 토글 기본 OFF, 켜면 external node 표시 |
| US5 | 파일 수정 후 자동 업데이트를 본다 | 저장 후 변경 노드/엣지 반영, 실패 시 경고 표시 |
| US6 | 모노레포에서 대상 앱을 선택한다 | 앱 후보 Quick Pick 제공, 선택한 앱만 분석 |
| US7 | 분석 결과를 문서화한다 | Mermaid/JSON/SVG 저장 성공 |

---

## 7. 범위 (Scope)

### 7.1 지원 대상

| 항목 | MVP |
|------|-----|
| Next.js App Router (`app/`) | ✅ |
| Next.js Pages Router (`pages/`) | ✅ |
| 하이브리드 프로젝트 | ✅ |
| TypeScript/JavaScript | ✅ (`.ts/.tsx/.js/.jsx`) |
| tsconfig alias/baseUrl | ✅ |
| 모노레포(수동 선택) | ✅ |
| turborepo/nx 자동 인식 | ⚠️ 기본 패턴만 (고급 파싱은 v1) |

### 7.2 분석 제외 대상

- `node_modules/`, `.next/`, `dist/`, `build/`, `out/`, `.git/`
- `*.test.*`, `*.spec.*`, `__tests__/`, `__mocks__/`
- `*.stories.*`, `.storybook/`
- `*.d.ts`, 바이너리 파일

### 7.3 배포 범위

| 채널 | MVP |
|------|-----|
| VSCode Marketplace Public | ✅ |
| OpenVSX | ✅ |
| Cursor/기타 VSCode 호환 에디터 | ⚠️ 호환성 테스트 후 지원 |

### 7.4 개발 환경 기준 (npm)

| 항목 | 기준 |
|------|------|
| 패키지 매니저 | `npm` (10+) |
| 모노레포 워크스페이스 | `npm workspaces` |
| 락파일 단일 기준 | `package-lock.json` |
| 워크스페이스 실행 규약 | `npm run <script> -w <workspace>` / `npm run <script> -ws` |
| 비허용 예시 | `pnpm`, `yarn`, `bun` 기준 명령 |

---

## 8. 기능 요구사항

### 8.1 Extension 진입점

| 기능 | 설명 |
|------|------|
| Command Palette 명령 | `RouteScope: Analyze Workspace`, `Open Graph`, `Export`, `Rebuild Cache`, `Select App Root` |
| Activity Bar View | Route Tree, Insights, Warnings 패널 제공 |
| Webview Panel | Graph Canvas + Inspector + Filter Bar |
| Status Bar | 분석 상태(Idle/Analyzing/Done/Warning) + 클릭 시 Graph 열기 |

### 8.2 Analyzer 기능

#### A. 프로젝트 탐지
1. workspace에서 Next 앱 후보를 스캔
2. `package.json`의 `next` 의존성 + `app/` 또는 `pages/` 유무로 후보 추출
3. 다중 후보면 Quick Pick으로 사용자 선택

#### B. Route Tree (exact)
- App Router 규칙:
  - `page.*` → URL 노드
  - `layout.*`/`template.*` → 레이아웃 체인
  - `loading.*`, `error.*`, `not-found.*` → 라우트 메타
  - `(group)`/`@slot`/`intercepting`/`_private` 규칙 반영
- Pages Router 규칙:
  - `pages/index.*`, `pages/[slug].*`, `pages/api/**` 처리
  - `_app`, `_document`, `_error`, `404`는 메타 노드

#### C. 데이터 플로우 그래프

| 그래프 | 정확도 | 내용 |
|--------|--------|------|
| Import Graph | `exact` | 파일 간 import/re-export/require/dynamic import(정적 문자열) |
| Render Graph | `best-effort` | JSX 태그 기반 컴포넌트 렌더 추정 |
| Navigation Graph | `best-effort` (v1) | `Link href`, `router.push`, `redirect` 정적 경로 추출 |

#### D. 역조회
- 컴포넌트 선택 시:
  - 사용 페이지 목록
  - import하는 파일 목록
  - unresolved 여부

### 8.3 탐색/필터

| 항목 | 요구사항 |
|------|----------|
| 검색 | URL/파일/컴포넌트 부분일치, 대소문자 무시 |
| 필터 | RouterType, NodeType, Depth(1~10), External, `use client`, Confidence |
| 상호작용 | 클릭=Inspector, 더블클릭=중심 재배치, hover=메타 표시 |
| 코드 점프 | 노드 선택 후 `Open Source`로 파일/라인 이동 |

### 8.4 Export

| 포맷 | 범위 | 설명 |
|------|------|------|
| JSON | 전체/서브그래프 | `routeTree.json`, `graph.json`, `metadata.json` |
| Mermaid | routes/components/combined | md 파일로 저장 |
| SVG/PNG | 현재 뷰 | 문서화/PR 첨부용 |

### 8.5 진단/경고

| 코드 | 의미 | 동작 |
|------|------|------|
| `NO_NEXT_PROJECT` | Next 프로젝트 미감지 | 경고 + 재스캔 유도 |
| `MULTIPLE_APPS` | 다중 앱 후보 | 앱 선택 요청 |
| `PARSE_ERROR` | 파일 파싱 실패 | 부분 결과 + 문제 파일 목록 |
| `RESOLVE_ERROR` | import resolve 실패 다수 | unresolved 엣지 표시 |
| `GRAPH_OVERFLOW` | 노드 과다 | depth 자동 축소 |

---

## 9. UX 요구사항

### 9.1 기본 화면 구성

1. 좌측: `RouteScope Explorer` (Tree + Insights + Warnings)
2. 중앙: Graph Webview
3. 우측: Inspector (노드/엣지 상세)

### 9.2 사용 흐름

1. `Analyze Workspace` 실행
2. 앱 선택(필요 시)
3. Route Tree 자동 표시
4. `Open Graph`로 그래프 분석
5. 필터/검색/역조회
6. `Export`로 산출물 저장

### 9.3 접근성/사용성

- 단축키 기본 제공:
  - `Cmd/Ctrl+Alt+R`: Analyze
  - `Cmd/Ctrl+Alt+G`: Open Graph
  - `Cmd/Ctrl+Alt+F`: Graph Search
- 그래프 의미 전달은 색상 + 아이콘 + 라벨 병행
- 고대비 테마 대응(라이트/다크 둘 다)

---

## 10. 비기능 요구사항 (NFR)

### 10.1 성능 목표

| 메트릭 | 목표 |
|--------|------|
| 초기 분석 (200~500 파일) | ≤ 15초 |
| 초기 분석 (1000~3000 파일) | ≤ 45초 |
| 증분 분석 (단일 파일 수정) | ≤ 2초 |
| Graph 렌더 (2000 노드) | ≤ 2초 |
| Graph 렌더 (5000 노드) | ≤ 5초 |

### 10.2 리소스 제한

| 항목 | 기준 |
|------|------|
| 메모리 사용량 | 기본 1GB 이하 권장 (초과 시 경고) |
| 동시 파싱 워커 | CPU 코어 수 기반 2~6 |
| 노드 수 보호장치 | 10k 경고, 30k 강제 축소 |

### 10.3 보안/프라이버시

- 코드 외부 전송 기본 비활성(텔레메트리 opt-in).
- 분석 로그에는 코드 본문 저장 금지.
- Webview는 CSP 적용, 외부 스크립트 로딩 금지.

### 10.4 신뢰성

- 파싱 실패율 30% 이하면 부분 결과 제공
- 자동 재분석 실패 시 수동 재시도 버튼 제공
- 치명 오류 발생 시 Output Channel에 에러 ID 기록

---

## 11. 성공 지표 (KPI)

| 지표 | 목표 | 측정 방식 |
|------|------|----------|
| 분석 성공률 | ≥ 97% | `done/(done+failed)` (로컬 세션 기준) |
| 증분 분석 성공률 | ≥ 95% | 파일 변경 후 그래프 반영 성공률 |
| 역조회 사용률 | ≥ 20% | 분석 세션 중 reverse lookup 실행 비율 |
| Export 사용률 | ≥ 15% | 분석 세션 중 export 실행 비율 |
| 사용자 만족도 | 평균 4.2/5+ | 마켓플레이스 평점 + 이슈 피드백 |

---

## 12. 릴리즈 기준 (Definition of Done)

| # | 항목 | 검증 방법 |
|---|------|----------|
| 1 | App/Pages/Hybrid fixture 분석 성공 | 자동 통합 테스트 |
| 2 | Route Tree 규칙 정확도 | Golden snapshot 테스트 |
| 3 | Layout Chain 정확도 | Golden + 수동 검증 |
| 4 | Import Graph 정확도 | 핵심 엣지 검증 |
| 5 | Render Graph 추정 라벨 | confidence 검증 |
| 6 | VSCode Tree View + Graph 연동 | `@vscode/test-electron` E2E |
| 7 | 코드 점프 동작 | command integration test |
| 8 | Export 4종(JSON/Mermaid/SVG/PNG) | 파일 생성 + 내용 검증 |
| 9 | 모노레포 앱 선택 | Quick Pick 시나리오 테스트 |
| 10 | 증분 재분석 | 파일 변경 시 캐시 무효화 검증 |
| 11 | 대형 프로젝트 성능 기준 충족 | benchmark fixture |
| 12 | 보안 기준(Webview CSP/로그 정책) | 릴리즈 체크리스트 |

---

## 13. 위험 요소 및 완화

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| AST 파싱 호환성 이슈 | 일부 파일 누락 | SWC 1차 + TypeScript fallback |
| 그래프 과대화 | UI 멈춤 | depth 제한, cluster/collapse, worker layout |
| alias/monorepo resolve 실패 | 관계도 정확도 하락 | tsconfig 계층 병합 + unresolved 명시 |
| 파일 변경 폭주 | 재분석 지연 | debounce + 변경 범위 기반 재계산 |
| Webview 메모리 증가 | IDE 성능 저하 | 노드 가상화 + 강제 간소화 모드 |

---

## 14. 릴리즈 로드맵

### MVP (v0.1)
- Route Tree
- Import/Render Graph
- VSCode Explorer + Webview
- Export(JSON/Mermaid/SVG)

### v0.2
- Navigation Graph (`Link/router.push`)
- Insights 대시보드(고아 컴포넌트, 순환 의존)
- PNG Export 개선(고해상도)

### v1.0
- 멀티 워크스페이스 안정화
- 협업 공유용 `routescope report` CLI 출력
- 웹 뷰어(읽기 전용) 연동 시작

---

## 15. 용어 사전

| 용어 | 정의 |
|------|------|
| Route Tree | URL 구조를 트리로 표현한 결과 |
| Layout Chain | 페이지에 적용되는 레이아웃/템플릿 순서 |
| Import Graph | 파일 간 의존 관계 그래프 |
| Render Graph | JSX 기반 렌더 관계 추정 그래프 |
| Reverse Lookup | 컴포넌트 기준 사용 페이지 역추적 |
| Client Boundary | `'use client'` 지시어 경계 |
| Confidence | 결과 정확도 레벨(`exact`/`best-effort`) |
| Incremental Analysis | 변경 파일 기준 재분석 최적화 방식 |
