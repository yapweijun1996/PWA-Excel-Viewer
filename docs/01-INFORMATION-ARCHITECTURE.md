# 01 — Information Architecture

## 1. App-level routes

Use GitHub-Pages-safe client navigation. Hash routes are acceptable for V1.

Recommended routes:

```text
#/                      Home
#/viewer                Active workbook viewer
#/settings/general
#/settings/appearance
#/settings/language
#/settings/privacy
#/settings/about
```

The active workbook is runtime state, not encoded into the public URL.

## 2. Main navigation model

The product has two modes:

### Home mode

Purpose:
- open a workbook;
- show privacy promise;
- optionally show recent file metadata;
- reach settings.

### Viewer mode

Purpose:
- inspect the active workbook.

Desktop viewer contains:

```text
Topbar
├─ Workbook Navigator
├─ Spreadsheet Workspace
└─ Inspector Panel
```

Mobile viewer contains:

```text
Topbar
Spreadsheet Workspace
Bottom Sheet / Fullscreen Surfaces
```

Do not force desktop sidebars into mobile.

## 3. Desktop information zones

```text
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR                                                       │
├──────────────┬─────────────────────────────┬─────────────────┤
│ WORKBOOK     │ SPREADSHEET WORKSPACE       │ INSPECTOR       │
│ NAVIGATOR    │                             │                 │
│              │                             │                 │
├──────────────┴─────────────────────────────┴─────────────────┤
│ SHEET TABS / STATUS                                          │
└──────────────────────────────────────────────────────────────┘
```

### Workbook Navigator

Contains:
- Overview.
- Sheets.
- Workbook Info / Warnings.
- Sheet visibility badges.
- Row/column dimensions summary when useful.

### Spreadsheet Workspace

Contains:
- optional formula/name bar;
- row/column headers;
- virtualized cells;
- selection overlay;
- search match highlight.

### Inspector

Contains:
- selected address/range;
- displayed value;
- raw value;
- formula;
- type;
- format;
- hyperlink/comment;
- copy actions.

## 4. Mobile information zones

```text
┌──────────────────────┐
│ TOPBAR               │
├──────────────────────┤
│ OPTIONAL SEARCH BAR  │
├──────────────────────┤
│                      │
│ VIRTUAL GRID         │
│                      │
├──────────────────────┤
│ SHEET TAB STRIP      │
└──────────────────────┘
```

Supplemental surfaces:

- Workbook navigator → left/full-height drawer.
- Inspector → bottom sheet.
- Search → fullscreen surface.
- Settings → full page.
- Warnings → full page or bottom sheet based on content size.
- Update prompt → modal/sheet, never hidden toast-only.

## 5. Single-page navigation rule

Settings must NOT be one long page with anchor links.

Each sidebar/menu item opens one dedicated settings route.

This maintains:
- stable focus;
- predictable browser history;
- easier mobile rendering;
- easier i18n QA;
- less cognitive overload.

## 6. Screen inventory

### Primary screens

1. Home — Empty.
2. Home — Recent metadata present.
3. Loading / Parsing.
4. Viewer — Overview selected.
5. Viewer — Worksheet selected.
6. Viewer — Search.
7. Viewer — Go to Cell.
8. Viewer — Cell Inspector.
9. Viewer — Workbook Warnings.
10. Settings — General.
11. Settings — Appearance.
12. Settings — Language.
13. Settings — Privacy.
14. Settings — About.

### System states

15. Unsupported file.
16. Corrupt/unreadable file.
17. Password-protected/unsupported encryption state.
18. Large workbook warning.
19. Browser memory failure.
20. Macro detected.
21. Unsafe link confirmation/block.
22. Offline app state.
23. Update available.
24. Install guidance where applicable.

## 7. Navigation invariants

- A workbook can be open while settings are viewed.
- Returning from settings must restore the same workbook state.
- Theme/language changes must not reset the workbook.
- Mobile drawer/sheet opening must not mutate selection.
- Search result navigation may change active sheet, but must preserve query/results.
- Browser Back from a settings page returns to prior app surface without losing workbook runtime state.
