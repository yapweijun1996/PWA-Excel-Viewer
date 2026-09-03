# 08 — AI Coding Agent Implementation Brief

This document is the implementation contract.

## Role

Act as a senior frontend/PWA engineer building a privacy-first Spreadsheet Viewer / Inspector.

Prioritize correctness, local-only privacy, performance, accessibility, and real-browser verification over decorative UI.

## Target repository

`https://github.com/yapweijun1996/PWA-Excel-Viewer`

## Before coding

Read all documents in `/docs` in numeric order.

Inspect the existing repository before changing files.

Do not blindly replace existing work if the repository already contains an implementation.

Establish:
- current branch;
- current build system;
- current dependencies;
- existing PWA files;
- existing tests;
- existing deployment workflow;
- existing UI.

Record the baseline.

## Mandatory product constraints

1. Static GitHub Pages-compatible PWA.
2. No backend required for core.
3. Workbook stays local by default.
4. Viewer + Inspector, not editor.
5. Heavy workbook parsing/search work runs in a Worker.
6. Spreadsheet grid is virtualized.
7. Five UI locales.
8. System/Light/Dark.
9. Product-grade Service Worker lifecycle.
10. No VBA execution.
11. Unsafe hyperlinks blocked.
12. Mobile installed-PWA safe-area behavior verified.
13. No runtime CDN dependencies.

## Recommended stack

- TypeScript.
- Vite.
- SheetJS CE.
- Web Worker.
- Virtualization library/core or a carefully tested custom virtualizer.
- Vitest.
- Playwright.

Framework choice is secondary. Avoid adding React/Vue solely because it is familiar.

## Architectural boundary

UI must not depend everywhere on raw SheetJS worksheet internals.

Implement an adapter/domain boundary such as:

```text
SheetJS
  ↓
Workbook Adapter
  ↓
Normalized domain model / Worker protocol
  ↓
UI
```

Worker protocol should include bounded operations such as:

```text
OPEN_WORKBOOK
CLOSE_WORKBOOK
GET_WORKBOOK_SUMMARY
GET_SHEET_SUMMARY
GET_CELL
GET_RANGE
GET_VIEWPORT
SEARCH
CANCEL_SEARCH
```

Use request/generation IDs to reject stale responses.

## Suggested implementation phases

### Phase 0 — Baseline + documentation gate

- inspect repo;
- preserve working behavior;
- ensure docs are present;
- define test fixtures;
- establish GitHub Pages base-path requirements.

Exit:
- baseline documented;
- build/test commands known.

### Phase 1 — App shell

Build:
- Home;
- settings shell;
- theme engine;
- i18n engine;
- router;
- base responsive layout.

Exit:
- all five locales boot;
- all three theme modes work;
- 390×844 no overflow.

### Phase 2 — Workbook Worker

Build:
- file validation;
- Worker creation;
- SheetJS adapter;
- open/close lifecycle;
- workbook/sheet summaries;
- macro/hidden/link diagnostics.

Exit:
- representative files parse off main thread;
- cancel works;
- malformed file handled safely.

### Phase 3 — Desktop viewer

Build:
- tri-pane app shell;
- navigator;
- overview;
- virtualized grid;
- sheet tabs;
- cell selection;
- inspector;
- formula/name bar.

Exit:
- large fixture DOM stays viewport-bound;
- smooth basic navigation.

### Phase 4 — Search + Go To

Build:
- current-sheet search;
- workbook search;
- cancel/stale request handling;
- result navigation;
- Go To grammar.

Exit:
- result click lands on exact sheet/cell;
- UI does not freeze on large search fixture.

### Phase 5 — Mobile UX

Build:
- mobile viewer shell;
- navigator drawer;
- Inspector bottom sheet;
- fullscreen search;
- mobile settings;
- safe-area handling.

Exit:
- 390×844, 375×812, 430×932 pass;
- no whole-page horizontal overflow;
- grid remains usable.

### Phase 6 — Security/privacy

Build:
- safe link resolver;
- external confirmation;
- macro warning;
- no workbook HTML injection;
- privacy UI;
- recent metadata rules.

Exit:
- malicious fixture regression passes;
- network privacy test passes.

### Phase 7 — PWA lifecycle

Build:
- manifest;
- icons;
- offline caching;
- update prompt;
- deterministic cache versioning;
- file handler progressive enhancement where supported.

Exit:
- offline core journey passes;
- update never silently destroys active session.

### Phase 8 — Release QA

- cross-theme;
- cross-locale;
- keyboard;
- accessibility;
- mobile/desktop;
- performance;
- security;
- offline;
- GitHub Pages production path.

Do not claim PASS without test evidence.

## Coding rules

- No fake loading percentage.
- No huge DOM tables.
- No `innerHTML` from workbook values.
- No global spreadsheet invert for dark mode.
- No automatic file upload.
- No silent workbook persistence.
- No macro execution.
- No Service Worker silent reload while workbook active.
- No hardcoded user-facing strings outside i18n exceptions.
- No desktop sidebars forced onto mobile.
- No single long settings page.

## UX rules

- Grid is always the dominant viewer surface.
- Desktop: Topbar + Navigator + Grid + Inspector.
- Mobile: Topbar + Grid + drawer/sheet surfaces.
- Search is app-level, not browser find.
- Important decisions use modal/sheet, not transient toast.
- Empty states always include one clear next action.

## Browser verification requirement

After each major UI phase:
- run the app in a real browser;
- inspect desktop and mobile viewport;
- interact with the relevant flow;
- capture evidence/screenshot if the agent environment supports it;
- fix visual overflow before proceeding.

Compilation alone is not UI verification.

## Completion report format

At the end, report:

```text
Implemented
- ...

Not implemented / deferred
- ...

Verification
- unit:
- e2e:
- desktop:
- mobile:
- offline:
- security/privacy:

Known limitations
- ...

Repository
- branch:
- commit:
- deployment:
```

Never describe untested functionality as verified.
