# 04 — Screen Interactions and States

This document defines behavior, not visual styling.

---

## 1. File open state machine

```text
IDLE
  ├─ choose/drop file
  ▼
VALIDATING
  ├─ unsupported → ERROR_UNSUPPORTED
  ├─ large/risky → LARGE_FILE_CONFIRM
  └─ accepted
      ▼
PARSING
  ├─ cancel → IDLE
  ├─ unreadable → ERROR_READ
  ├─ memory failure → ERROR_MEMORY
  └─ parsed
      ▼
WORKBOOK_READY
```

### Invariant

The app must never navigate to a fake viewer state before the workbook has a valid parsed structure.

---

## 2. Opening another file

From Viewer:

`Open Spreadsheet` → native picker.

On valid selection:
- stop/cancel active searches;
- close active inspector/dialog surfaces;
- terminate or reset old workbook Worker state safely;
- parse new workbook;
- replace current workbook only after new file validation begins.

Because V1 is read-only, there is no unsaved editing prompt.

If the current workbook was explicitly persisted locally, that stored copy is not deleted simply because another file is opened.

---

## 3. Sheet selection

When changing sheet:

Preserve:
- app theme;
- locale;
- left/right panel state;
- search query/results where relevant;
- workbook identity.

Reset by default:
- selected cell to first meaningful/previously remembered cell for that sheet;
- viewport to previous per-sheet position if maintained;
- formula bar to selected cell.

Recommended UX:
Maintain per-sheet viewport/selection during one workbook session.

---

## 4. Cell selection

### Mouse

Single click:
- select cell;
- update inspector;
- update address/formula bar.

Shift + click:
- extend range from anchor.

Click-drag:
- create range.

### Keyboard

Arrow keys:
- move active cell.

Shift + arrows:
- extend range.

Enter:
- open/focus Inspector details.

Escape:
- close transient panel first;
- otherwise collapse range to active cell if appropriate.

### Touch

Tap:
- select cell.

Second tap or Inspect affordance:
- open bottom Inspector.

Long press:
- optional contextual selection/copy menu.
- Do not depend on long press for essential functions.

---

## 5. Range selection

Inspector for multi-cell range should show:

```text
B4:F18
75 cells selected

[Copy]
[Export CSV]   // P1
```

Do not show a misleading single-cell raw value.

If range contains one cell, use normal cell inspector.

---

## 6. Search state machine

```text
SEARCH_CLOSED
  ↓ open
SEARCH_READY
  ↓ query
SEARCHING
  ├─ query changed → cancel prior search → SEARCHING
  ├─ cancel → SEARCH_READY
  └─ complete → RESULTS
                   ├─ result click → NAVIGATE_RESULT
                   └─ clear → SEARCH_READY
```

Worker search requests need request IDs so stale responses can be discarded.

### Search scopes

- Current Sheet.
- Entire Workbook.

Optional later:
- Formulas only.
- Values only.

V1 should not clutter UI with advanced modes unless needed.

---

## 7. Search result navigation

Result click order:

1. Confirm result still belongs to active workbook generation.
2. Switch sheet if required.
3. Ensure virtualizer can resolve target row/column.
4. Scroll target into comfortable viewport position.
5. Select cell.
6. Apply active match highlight.
7. Update inspector.
8. On mobile, return from fullscreen search to grid.

No arbitrary delays such as `setTimeout(500)` should be the primary coordination mechanism.

---

## 8. Go To behavior

Accepted examples:

```text
A1
F128
ZZ5000
Sales!F128
```

On valid input:
- switch sheet if specified;
- scroll cell into view;
- select it;
- close Go To surface;
- focus grid.

On invalid:
- keep surface open;
- show inline message;
- preserve entered value.

---

## 9. Hyperlink interaction

Spreadsheet hyperlink is untrusted input.

### Internal workbook link

Example:

```text
#Sales!F128
```

Action:
- navigate inside app;
- no browser navigation.

### Allowed external link

Protocols:
- `https:`
- `http:`
- `mailto:` if product chooses to support it.

Action:
- show confirmation unless user turned confirmation off.

### Blocked schemes

Examples:
- `javascript:`
- `vbscript:`
- `file:`
- `data:`
- unknown custom schemes.

Action:
- do not execute;
- show blocked-link message.

---

## 10. Macro warning

Macro detection is informational + security.

Never execute macros.

Recommended first-open flow for macro workbook:

```text
Workbook contains macros.
Macros are not executed by this viewer.

[Continue]
```

Do not block reading the workbook solely because macros exist.

---

## 11. Hidden content

Default:
- respect hidden row/column/sheet state.

Navigator:
- show hidden sheet with badge.

Warnings:
- surface hidden sheet count.

Optional user action:
- “Show hidden rows/columns” view toggle.

When showing hidden content:
- mark it as hidden in original workbook.

Do not silently change workbook visibility semantics.

---

## 12. Theme switching

Theme change:
- updates app chrome immediately;
- updates solid system/status bar surfaces;
- preserves workbook;
- preserves selection;
- preserves panels;
- preserves scroll.

Never globally invert workbook content using CSS filters.

---

## 13. Language switching

Sequence:

```text
request locale
→ load locale bundle
→ validate success
→ atomically apply UI strings
→ keep active workbook/sheet/cell/search/scroll
```

If bundle load fails:
- keep current locale;
- show non-destructive error;
- do not partially translate the UI.

Workbook content is never translated.

---

## 14. PWA update lifecycle

```text
NEW_SW_WAITING
  ↓
UPDATE_AVAILABLE_UI

User chooses Later
  → keep current app/session

User chooses Update now
  → safely close transient workbook Worker state
  → activate waiting worker
  → reload after controller change
```

Never call uncontrolled `skipWaiting` + reload while the user is actively inspecting a workbook without explicit action.

---

## 15. Offline behavior

Core offline journey:

1. App has been loaded once.
2. Network disconnected.
3. Launch app.
4. Home renders.
5. Open local workbook.
6. Parse.
7. Navigate sheets.
8. Search.
9. Inspect/copy.

This journey is a release gate.

---

## 16. Back/close behavior

Priority for Escape/Back:

1. Close nested confirmation/dialog.
2. Close search.
3. Close inspector/drawer.
4. Return from settings page.
5. Leave Viewer only when navigation explicitly requests Home.

Mobile browser Back must not unexpectedly destroy workbook state when simply closing an overlay.

---

## 17. Notifications

Use toasts for:
- “Copied”.
- “Recent item removed”.
- “Language unavailable; current language kept.”

Do not use toast-only UI for:
- update available;
- destructive local-data clear;
- unsafe external link;
- macro explanation;
- workbook read failure.

Important decisions require persistent surfaces.
