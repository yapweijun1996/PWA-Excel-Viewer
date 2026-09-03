# 00 — Product Baseline

## 1. Product identity

Working repository name: **PWA Excel Viewer**

Product-facing name may be:

**Spreadsheet Inspector**

Recommended subtitle:

> Private spreadsheet viewer and inspector for your browser.

The UI must not claim to be Microsoft Excel, an Excel clone, or a pixel-perfect Excel renderer.

## 2. Primary user problem

A user receives a spreadsheet and wants to:

- open it immediately;
- understand workbook structure;
- switch sheets;
- inspect large tables;
- search for customer, SKU, invoice, amount, or formula;
- inspect displayed value vs raw value;
- inspect formulas, comments, links, hidden content, and workbook warnings;
- copy useful data;
- continue using the app offline.

They should not need an account, backend, cloud upload, or desktop Office installation.

## 3. V1 product loop

```text
Open file
  ↓
Parse locally
  ↓
Show workbook overview
  ↓
View active worksheet
  ↓
Search / inspect / copy
  ↓
Close or open another workbook
```

## 4. P0 capabilities

- File picker.
- Drag and drop.
- XLSX / XLS / XLSM / XLSB / CSV / TSV / ODS target support.
- Workbook summary.
- Sheet navigation.
- Hidden sheet indicators.
- Virtualized grid.
- Cell selection.
- Range selection.
- Raw/displayed/formula inspector.
- Search current sheet / whole workbook.
- Go to cell.
- Copy value / formula / selected range.
- Macro detected warning.
- Safe hyperlink behavior.
- Responsive desktop/tablet/mobile.
- System / Light / Dark.
- Five-locale UI.
- Offline app shell and local file processing.
- Explicit Service Worker update UX.
- Accessibility/security/privacy regression tests.

## 5. Explicit non-goals

V1 does not include:

- cell editing;
- formula editing;
- formula recalculation engine;
- workbook save-as-XLSX;
- real-time collaboration;
- cloud sync;
- account system;
- Google Drive / OneDrive integration;
- AI analysis;
- chart editing;
- PivotTable editing;
- VBA execution;
- Excel-perfect visual fidelity.

## 6. Product hierarchy

The app is an **inspection tool**.

Feature priority:

```text
Data correctness
> responsiveness
> searchability
> inspectability
> accessibility
> visual polish
> spreadsheet authoring
```

## 7. Privacy promise

Default:

```text
Local file
→ browser File API
→ local Worker
→ local UI
```

No workbook content is uploaded by the core product.

Recent history may store only non-sensitive metadata such as filename, extension, file size, and last-opened time, and must be user-controllable.

Workbook persistence is opt-in only.

## 8. Fidelity contract

V1 should accurately expose spreadsheet data and structural metadata where available.

Do not promise exact fidelity for:

- fonts;
- borders;
- conditional formatting;
- images;
- charts;
- drawing objects;
- print layouts;
- slicers;
- PivotTables.

The application chrome may use dark mode; workbook semantic colors must not be blindly inverted.

## 9. Core success metric

The first meaningful moment should be:

> “I opened a workbook and understood what is inside it without uploading it.”

The second:

> “I found the cell / value / formula I needed faster than opening a heavyweight office suite.”

## 10. Default implementation philosophy

Use **SCMC**:

- **Simple** — one obvious primary workflow.
- **Clear** — user always knows current file, sheet, selection, and state.
- **Modular** — parsing, search, grid, inspector, storage, theme and i18n are separate.
- **Consistent** — same interaction language across desktop and mobile.
