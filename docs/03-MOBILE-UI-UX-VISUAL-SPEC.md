# 03 — Mobile UI/UX Visual Specification

Primary QA viewport: **390 × 844**  
Also verify: **375 × 812**, **430 × 932**, narrow landscape.

Core principle:

> Mobile is not compressed desktop.

The spreadsheet grid remains a real horizontally scrollable workspace. Sidebars become drawers/sheets.

---

# Screen M01 — Home / Empty

```text
┌──────────────────────────────┐
│ ◫ Spreadsheet Inspector  ⚙  │
├──────────────────────────────┤
│                              │
│ Open a spreadsheet           │
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │ Drop a spreadsheet here  │ │
│ │                          │ │
│ │ [ Open Spreadsheet ]     │ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│ XLSX · XLS · CSV · ODS       │
│ + other supported formats    │
│                              │
│ 🔒 Processed on this device  │
│ Nothing is uploaded.         │
│                              │
└──────────────────────────────┘
```

Rules:
- Primary button ≥ 48px tall.
- File-format list can wrap.
- No horizontal page overflow.
- Topbar respects `safe-area-inset-top`.
- Main content respects bottom safe area.
- Input/control text should avoid iOS focus zoom.

---

# Screen M02 — Loading

```text
┌──────────────────────────────┐
│ ← sales-2026.xlsx            │
├──────────────────────────────┤
│                              │
│ Opening workbook             │
│                              │
│ ◌ Reading file…              │
│                              │
│ Discovering worksheets       │
│ Preparing structure          │
│                              │
│ [ Cancel ]                   │
│                              │
└──────────────────────────────┘
```

Do not block the entire browser thread.

---

# Screen M03 — Viewer / Worksheet

```text
┌──────────────────────────────┐
│ ☰ sales-2026.xlsx       ⋮    │
│ Sales                  🔍    │
├────┬──────────┬──────────────┤
│    │ A        │ B            │
├────┼──────────┼──────────────┤
│ 1  │ Date     │ Customer     │
│ 2  │ ...      │ ...          │
│ 3  │ ...      │ ...          │
│ .. │          │              │
│128 │          │ [selected]   │
│ .. │          │              │
│    │ ← horizontal grid →     │
│    │                         │
├──────────────────────────────┤
│ Sales ●  Stock  Customers →  │
└──────────────────────────────┘
```

## Topbar

Recommended two-line compact header where needed:

Line 1:
- menu button;
- truncated filename;
- overflow menu.

Line 2:
- active sheet;
- search action;
- optional Go To action.

Alternative one-line layouts are acceptable if 390px QA proves they remain clear.

Topbar should be solid/opaque and theme-aware.

## Grid

- Grid fills remaining viewport height.
- Sheet strip stays above bottom safe area.
- Horizontal grid scrolling must not move the whole page.
- Vertical grid scrolling must not scroll the top-level document.
- Prevent accidental body overscroll where practical without trapping accessibility.
- Row/column headers remain sticky inside grid.
- Pinch zoom must not be replaced with fake scaling that harms accessibility.

---

# Screen M04 — Workbook Navigator Drawer

```text
┌──────────────────────────────┐
│ Workbook                  ✕  │
│ sales-2026.xlsx              │
├──────────────────────────────┤
│ Overview                     │
│                              │
│ Sheets                       │
│ ● Sales              25,420  │
│   Stock               8,120  │
│   Customers           2,822  │
│   Archive       Hidden       │
│                              │
│ Warnings                 2   │
│ Workbook info                │
│                              │
└──────────────────────────────┘
```

Rules:
- Drawer is safe-area-aware.
- Background is inert while open.
- `Esc` closes on keyboard-capable devices.
- Opening drawer preserves selected cell and scroll position.
- Selecting a sheet closes drawer and focuses grid.
- Drawer should be full-height on 390px rather than a tiny floating panel.

---

# Screen M05 — Cell Inspector Bottom Sheet

## Collapsed affordance

After a cell selection, a small optional handle/status area may show:

```text
F128 · S$12,450.00     ↑ Inspect
```

Do not cover too much grid.

## Expanded

```text
╭──────────────────────────────╮
│ ─────                        │
│ F128                     ✕   │
│                              │
│ Displayed value              │
│ S$12,450.00                  │
│                              │
│ Raw value                    │
│ 12450                        │
│                              │
│ Formula                      │
│ =SUM(F120:F127)              │
│                              │
│ Type                         │
│ Number                       │
│                              │
│ [ Copy value ]               │
│ [ Copy formula ]             │
╰──────────────────────────────╯
```

Rules:
- Max expanded height ~80–90vh.
- Internal sheet content scrolls.
- Bottom padding includes `safe-area-inset-bottom`.
- Background grid selection remains visually visible where possible.
- Drag-to-dismiss is optional; explicit close control is mandatory.
- Focus moves into sheet and returns to invoking grid cell/action when closed.

---

# Screen M06 — Fullscreen Search

```text
┌──────────────────────────────┐
│ ← Find in workbook           │
├──────────────────────────────┤
│ [ BAN LEONG______________ ]  │
│                              │
│ Entire workbook ▾            │
│                              │
│ 23 matches                   │
│                              │
│ Sales!B328                   │
│ BAN LEONG TECHNOLOGIES...    │
│                              │
│ Sales!B821                   │
│ BAN LEONG TECHNOLOGIES...    │
│                              │
│ Customers!A42                │
│ BAN LEONG TECHNOLOGIES...    │
│                              │
└──────────────────────────────┘
```

Rules:
- Mobile search is fullscreen, not a tiny dropdown.
- Search input `type=search`, 16px+ text.
- Results list owns vertical scrolling.
- Selecting result returns to viewer, selects/highlights result.
- Query remains available when reopening search.
- Clear button clears query/results without closing.

---

# Screen M07 — Workbook Overview

```text
┌──────────────────────────────┐
│ ← Workbook overview          │
├──────────────────────────────┤
│ sales-2026.xlsx              │
│ XLSX · 12.8 MB               │
│                              │
│ 6 worksheets                 │
│ 42,508 rows                  │
│ 184,221 used cells           │
│                              │
│ ┌────────┐ ┌────────┐        │
│ │342     │ │18      │        │
│ │Formula │ │Merged  │        │
│ └────────┘ └────────┘        │
│                              │
│ Warnings                     │
│ ⚠ Hidden sheets · 3          │
│ ⚠ Macro detected             │
│                              │
│ Sheets                       │
│ Sales               25,420   │
│ Stock                8,120   │
│ Customers            2,822   │
└──────────────────────────────┘
```

Overview is allowed to be a normal vertically scrolling page.

Use cards sparingly. The overview is a report, not a dashboard with decorative KPI tiles everywhere.

---

# Screen M08 — Go To Cell

Mobile uses bottom sheet:

```text
╭──────────────────────────────╮
│ Go to cell               ✕   │
│                              │
│ [ Sales!F128_____________ ]  │
│                              │
│ A1 · F128 · Sales!B42        │
│                              │
│ [ Go ]                       │
╰──────────────────────────────╯
```

Keyboard should not hide the action button; surface must adapt to visual viewport.

---

# Screen M09 — Settings

Use dedicated full pages.

```text
┌──────────────────────────────┐
│ ← Settings                   │
├──────────────────────────────┤
│ General                    › │
│ Appearance                 › │
│ Language                   › │
│ Privacy                    › │
│ About                      › │
└──────────────────────────────┘
```

Then:

```text
┌──────────────────────────────┐
│ ← Appearance                 │
├──────────────────────────────┤
│ Theme                        │
│                              │
│ ○ System                     │
│ ● Light                      │
│ ○ Dark                       │
│                              │
│ Workbook rendering           │
│ Preserve appearance      ON  │
└──────────────────────────────┘
```

Do not turn settings into an accordion-only single page.

---

# Screen M10 — Update Available

```text
╭──────────────────────────────╮
│ Update available             │
│                              │
│ A new version of             │
│ Spreadsheet Inspector is     │
│ ready.                       │
│                              │
│ Your open workbook is not    │
│ uploaded.                    │
│                              │
│ [ Later ]                    │
│ [ Update now ]               │
╰──────────────────────────────╯
```

Rules:
- Never auto-reload an active workbook session.
- Button area remains above bottom safe area.
- Update prompt is an explicit decision surface, not a disappearing toast.

---

# Screen M11 — Error State

```text
┌──────────────────────────────┐
│ ← Spreadsheet Inspector      │
├──────────────────────────────┤
│                              │
│ We could not read this file  │
│                              │
│ report.xlsx                  │
│                              │
│ The workbook may be damaged  │
│ or use an unsupported        │
│ feature.                     │
│                              │
│ [ Try another file ]         │
│                              │
└──────────────────────────────┘
```

Error copy must:
- state what happened;
- avoid blaming the user;
- provide one clear recovery action;
- avoid offering cloud-upload fallbacks.
