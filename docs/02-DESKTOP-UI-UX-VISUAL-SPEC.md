# 02 — Desktop UI/UX Visual Specification

Target reference viewport: **1440 × 900**  
Secondary desktop QA: **1280 × 800**, **1920 × 1080**

Desktop should feel like a focused productivity tool, not a marketing dashboard and not an Excel ribbon clone.

---

# Screen D01 — Home / Empty

## Wireframe

```text
┌────────────────────────────────────────────────────────────────────┐
│ ◫ Spreadsheet Inspector                         ?   ◐   ⚙          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                     Open a spreadsheet                             │
│                                                                    │
│       ┌────────────────────────────────────────────────────┐       │
│       │                                                    │       │
│       │      Drop a spreadsheet anywhere in this area      │       │
│       │                                                    │       │
│       │              [ Open Spreadsheet ]                  │       │
│       │                                                    │       │
│       │ XLSX · XLS · XLSM · XLSB · CSV · TSV · ODS        │       │
│       │                                                    │       │
│       └────────────────────────────────────────────────────┘       │
│                                                                    │
│       🔒 Processed on this device. Nothing is uploaded.            │
│                                                                    │
│                 [ Learn how privacy works ]                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Layout

- Topbar height: 56px.
- Main content max-width: 960px.
- Drop zone ideal width: 680–760px.
- Do not make the drop zone full-screen.
- Main action must be visible without scrolling at 1280×800.

## Interaction

- Click `Open Spreadsheet` → native file picker.
- Drag valid file over window → whole drop surface gains active state.
- Drop invalid/unsupported type → inline error below drop zone.
- Settings icon → `#/settings/general`.
- Theme icon → compact menu: System / Light / Dark.
- Privacy link → `#/settings/privacy`.

## Empty-state copy rule

Do not say “Upload Excel”.
Use “Open Spreadsheet” or “Choose Spreadsheet”.

This reinforces local processing.

---

# Screen D02 — Home / Recent

```text
┌────────────────────────────────────────────────────────────────────┐
│ ◫ Spreadsheet Inspector                         ?   ◐   ⚙          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│              [ Open Spreadsheet ]                                  │
│                                                                    │
│  Recent                                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ sales-2026.xlsx    XLSX    12.8 MB     Yesterday 14:20      │  │
│  │ stock.xlsx         XLSX     4.1 MB     2 Sep 2026           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Recent items store metadata only unless a file was explicitly     │
│  kept on this device.                                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Recent row interaction:

- If only metadata exists, clicking row opens file picker and explains that the original file must be selected again.
- If an OPFS-persisted copy exists, clicking can reopen directly.
- Provide row overflow menu: remove from recent / remove stored local copy where applicable.

Never imply metadata-only recent history can reopen a file automatically.

---

# Screen D03 — Parsing / Loading

```text
┌────────────────────────────────────────────────────────────────────┐
│ ◫ sales-2026.xlsx                                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                       Opening workbook                             │
│                                                                    │
│                       ◌ Reading file…                              │
│                                                                    │
│                       Discovering worksheets                       │
│                       Preparing structure                          │
│                       Building search index                        │
│                                                                    │
│                           [ Cancel ]                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

Rules:

- Use stage-based progress, not fake percentages.
- UI thread must remain interactive.
- `Cancel` cancels Worker operation and returns to Home.
- If parsing completes before indexing, Viewer may open and indexing can continue with a clear “Search index preparing…” status if architecture supports it safely.

---

# Screen D04 — Viewer / Workbook Overview

## Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☰  sales-2026.xlsx   XLSX · 12.8 MB     [Find] [Go to]       ◐  ⋮        │
├───────────────┬───────────────────────────────────────┬─────────────────────┤
│ Workbook      │ Overview                              │ Workbook details    │
│               │                                       │                     │
│ ● Overview    │ sales-2026.xlsx                       │ Type    XLSX         │
│               │                                       │ Size    12.8 MB      │
│ Sheets        │ 6 worksheets     42,508 rows          │ Sheets  6            │
│   Sales       │ 184,221 cells    38 columns           │                     │
│   Stock       │                                       │ Warnings             │
│   Customers   │ Workbook structure                    │ ⚠ Hidden sheets  3   │
│   Archive [H] │ ┌────────┐ ┌────────┐ ┌────────┐      │ ⚠ Macros         1   │
│               │ │342     │ │18      │ │17      │      │                     │
│ Warnings  2   │ │Formula │ │Merged  │ │Links   │      │ [View warnings]     │
│               │ └────────┘ └────────┘ └────────┘      │                     │
│               │                                       │                     │
├───────────────┴───────────────────────────────────────┴─────────────────────┤
│ Sales   Stock   Customers   Archive                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Layout

- Topbar: 56px.
- Left rail: default 236px; min 200; max 320.
- Right inspector: default 320px; min 280; max 420.
- Bottom sheet tabs/status strip: 36–40px.
- Center is flexible.
- Both side panels independently collapsible.
- Center overview content can scroll vertically; the document itself should not create horizontal page scroll.

## Interaction

- Click sheet in left rail → opens Worksheet mode.
- Click warning → opens warning detail surface.
- Click collapse left rail → center expands.
- Right panel in Overview mode displays workbook metadata, not cell data.
- Sheet tabs at bottom provide fast switch even if left rail is collapsed.

---

# Screen D05 — Viewer / Worksheet

## Wireframe

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☰  sales-2026.xlsx  › Sales       [Find] [Go to]       100%     ◐  ⋮      │
├───────────────┬─────────────────────────────────────────────┬───────────────┤
│ Workbook      │ Name / Formula bar                          │ Inspector     │
│               │ F128   =SUM(F120:F127)                     │               │
│ ● Overview    ├────┬──────────┬──────────────┬──────────────┤ F128          │
│               │    │ A        │ B            │ C            │               │
│ Sheets        ├────┼──────────┼──────────────┼──────────────┤ Displayed     │
│ ▶ Sales       │ 1  │ Date     │ Customer     │ Amount       │ S$12,450.00   │
│   Stock       │ 2  │ ...      │ ...          │ ...          │               │
│   Customers   │ 3  │ ...      │ ...          │ ...          │ Raw           │
│   Archive [H] │ .. │          │              │              │ 12450         │
│               │128 │          │              │ [selected]   │               │
│               │ .. │          │              │              │ Formula       │
│               │    │          │              │              │ =SUM(...)     │
│               │    │          │              │              │               │
│               │    │  virtualized grid →                    │ [Copy]        │
├───────────────┴─────────────────────────────────────────────┴───────────────┤
│ Sales ●   Stock   Customers   Archive [Hidden]                  Ready       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Grid visual requirements

- Grid owns both x/y scrolling.
- Row header width should adapt for row-number digit count but remain stable during normal scrolling.
- Column header height: ~28–32px.
- Default row height: ~24–28px depending font.
- Selected cell gets strong border and subtle fill.
- Selected range gets one outline plus translucent selection fill, not hundreds of heavy borders.
- Search match: subtle highlight.
- Active search match: stronger highlight plus selection.
- Hidden row/column boundaries use a clear discontinuity indicator.
- Frozen panes may be supported later; do not invent them in V1 unless parser/model supports them reliably.

## Formula/name bar

Desktop may display:

```text
[address box] [display/formula text area]
```

Behavior:
- Address box is read-only selection indicator in V1.
- Clicking address box may activate Go To.
- Formula area is read-only and horizontally scrollable for long formulas.
- It must never suggest editability.

## Inspector content order

1. Address / range.
2. Displayed value.
3. Raw value.
4. Formula.
5. Type.
6. Number format.
7. Comment.
8. Hyperlink.
9. Merge information.
10. Actions.

Hide empty sections rather than displaying many blank labels.

---

# Screen D06 — Search

Recommended desktop search is a centered command-style overlay or right-side surface, not browser-native find.

```text
┌────────────────────────────────────────────────────┐
│ Find in workbook                              ✕    │
│ ┌──────────────────────────────────────────────┐   │
│ │ BAN LEONG                                    │   │
│ └──────────────────────────────────────────────┘   │
│ (●) Entire workbook    ( ) Current sheet           │
│                                                    │
│ 23 matches                                         │
│                                                    │
│ Sales!B328                                         │
│ BAN LEONG TECHNOLOGIES PTE LTD                     │
│                                                    │
│ Sales!B821                                         │
│ BAN LEONG TECHNOLOGIES PTE LTD                     │
│                                                    │
│ Customers!A42                                      │
│ BAN LEONG TECHNOLOGIES PTE LTD                     │
└────────────────────────────────────────────────────┘
```

Interaction:
- `Ctrl/Cmd + F` opens app search.
- `Esc` closes.
- Typing schedules/cancels Worker search.
- Result click → active sheet switch if needed → scroll to cell → select → highlight.
- Search state persists while panel is open.
- Closing search keeps the current result cell selected.

---

# Screen D07 — Go To Cell

Small dialog:

```text
Go to cell

[ Sales!F128________________ ]

Examples: A1, F128, Sales!B42

[Cancel] [Go]
```

- Enter submits.
- Invalid input gets inline validation.
- Never dismiss on validation failure.
- If sheet name needs quoting, parser should support common address forms or clearly document the supported grammar.

---

# Screen D08 — Workbook Warnings

```text
Workbook warnings

⚠ VBA macros detected
  Macros are not executed by this viewer.

⚠ 3 hidden worksheets
  Archive
  CalcData
  Internal

⚠ 17 external hyperlinks
  Links require confirmation before opening.

[Back to workbook]
```

Warnings should be factual, not alarmist.

---

# Screen D09 — Desktop Settings Shell

```text
┌───────────────────────────────────────────────────────────────┐
│ ←  Settings                                      Spreadsheet │
├──────────────────┬────────────────────────────────────────────┤
│ General          │ Appearance                                 │
│ Appearance       │                                            │
│ Language         │ Theme                                      │
│ Privacy          │ [ System ] [ Light ] [ Dark ]              │
│ About            │                                            │
│                  │ Workbook rendering                         │
│                  │ Preserve workbook appearance        ON     │
│                  │                                            │
└──────────────────┴────────────────────────────────────────────┘
```

Rules:
- Left settings navigation is real route navigation.
- Content pane is one page per category.
- Do not put every setting in a single long-scrolling screen.
- Changes apply immediately unless destructive.
