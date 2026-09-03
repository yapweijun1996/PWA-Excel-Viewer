# 09 — QA and Acceptance Checklist

V1 is complete only when the applicable P0 checks pass.

---

# A. Build and deployment

- [ ] Clean install succeeds.
- [ ] Typecheck succeeds.
- [ ] Production build succeeds.
- [ ] GitHub Pages base path works.
- [ ] All static assets resolve under repository subpath.
- [ ] No runtime CDN dependency.
- [ ] No console errors on normal boot.

---

# B. Home

- [ ] File picker opens.
- [ ] Drag/drop works.
- [ ] Drop hover state is obvious.
- [ ] Unsupported file shows bounded error.
- [ ] Privacy promise is visible.
- [ ] Mobile home has no horizontal overflow.
- [ ] Open button is accessible by keyboard.

---

# C. Workbook parsing

Fixtures:

- [ ] XLSX.
- [ ] XLS.
- [ ] XLSM.
- [ ] XLSB.
- [ ] CSV UTF-8.
- [ ] CSV with CJK text.
- [ ] TSV.
- [ ] ODS.
- [ ] malformed workbook.
- [ ] large workbook.

Behavior:

- [ ] Parsing occurs in Worker.
- [ ] Main UI remains responsive.
- [ ] Cancel stops operation.
- [ ] Error state is recoverable.
- [ ] No workbook content is uploaded.

---

# D. Workbook overview

- [ ] Filename/type/size displayed correctly.
- [ ] Sheet count correct.
- [ ] Sheet list correct.
- [ ] Hidden sheet badge correct.
- [ ] Macro warning correct.
- [ ] Formula/merge/link counts are not fabricated.
- [ ] Unknown/unavailable metadata is omitted or labeled unavailable.

---

# E. Grid

- [ ] Row headers visible.
- [ ] Column headers visible.
- [ ] Horizontal scroll works.
- [ ] Vertical scroll works.
- [ ] Whole page does not horizontally scroll.
- [ ] Cell selection works.
- [ ] Range selection works.
- [ ] Keyboard cell navigation works.
- [ ] Selection survives normal virtualization.
- [ ] Very large sheet does not create DOM per workbook cell.
- [ ] Long cell text does not explode row height by default.

---

# F. Inspector

- [ ] Cell address correct.
- [ ] Displayed value correct where available.
- [ ] Raw value correct.
- [ ] Formula correct where present.
- [ ] No formula recalculation is falsely claimed.
- [ ] Type/format sections display only when meaningful.
- [ ] Copy value works.
- [ ] Copy formula works.
- [ ] Multi-cell selection does not pretend to be one cell.

---

# G. Search

- [ ] `Ctrl/Cmd+F` opens app search.
- [ ] Current-sheet search works.
- [ ] Whole-workbook search works.
- [ ] Search is cancellable.
- [ ] Stale Worker results ignored.
- [ ] Selecting result switches correct sheet.
- [ ] Selecting result scrolls to exact cell.
- [ ] Mobile search is fullscreen.
- [ ] Closing/reopening preserves sensible query state.

---

# H. Go To

- [ ] A1 works.
- [ ] F128 works.
- [ ] sheet-qualified reference works.
- [ ] invalid reference stays in dialog with error.
- [ ] target cell is selected and visible.
- [ ] mobile keyboard does not hide Go action.

---

# I. Security

Malicious fixture contains:

- [ ] `<script>`-looking cell text.
- [ ] `javascript:` link.
- [ ] `vbscript:` link.
- [ ] `file:` link.
- [ ] `data:` link.
- [ ] HTTPS link.
- [ ] HTTP link.
- [ ] internal workbook link.
- [ ] macro.
- [ ] hidden sheet.

Pass:

- [ ] No cell content executes.
- [ ] No VBA executes.
- [ ] Unsafe schemes are blocked.
- [ ] External links require configured confirmation.
- [ ] Internal links stay inside app.
- [ ] No automatic remote fetch from workbook content.

---

# J. Privacy

Network interception during workbook journey:

- [ ] no workbook binary request.
- [ ] no cell values in requests.
- [ ] no formulas in requests.
- [ ] no filename in unexpected telemetry.
- [ ] no hidden analytics SDK.
- [ ] recent history behavior matches settings.
- [ ] workbook persistence is opt-in only.

---

# K. Theme

- [ ] System.
- [ ] Light.
- [ ] Dark.
- [ ] Theme persists.
- [ ] System reacts to OS change.
- [ ] Workbook state preserved on theme switch.
- [ ] App chrome changes.
- [ ] Workbook is not globally inverted.
- [ ] Dark contrast acceptable.
- [ ] Installed PWA top/system surface is intentional.

---

# L. i18n

Locales:

- [ ] en-SG.
- [ ] zh-Hans.
- [ ] ms-MY.
- [ ] ja-JP.
- [ ] vi-VN.

Checks:

- [ ] catalogs have matching key set.
- [ ] English fallback works.
- [ ] no raw missing key in normal UI.
- [ ] workbook content never translated.
- [ ] sheet names never translated.
- [ ] language switch preserves workbook.
- [ ] language switch preserves sheet/cell.
- [ ] language switch preserves search state.
- [ ] mobile layouts tolerate longer translated strings.

---

# M. Desktop visual QA

Viewports:

- [ ] 1440×900.
- [ ] 1280×800.
- [ ] 1920×1080.

Screens:

- [ ] Home.
- [ ] Loading.
- [ ] Overview.
- [ ] Grid.
- [ ] Search.
- [ ] Inspector.
- [ ] Settings.
- [ ] Update prompt.
- [ ] Error state.

Pass:
- [ ] no clipped primary control.
- [ ] no document-level x-scroll.
- [ ] side panels collapse correctly.
- [ ] grid remains dominant.

---

# N. Mobile visual QA

Viewports:

- [ ] 390×844.
- [ ] 375×812.
- [ ] 430×932.
- [ ] short landscape.

Pass:
- [ ] safe-area top.
- [ ] safe-area bottom.
- [ ] no document-level x-scroll.
- [ ] grid horizontally scrolls independently.
- [ ] drawer works.
- [ ] Inspector bottom sheet works.
- [ ] fullscreen search works.
- [ ] settings pages work.
- [ ] keyboard does not hide key form actions.
- [ ] topbar remains readable with long filename.
- [ ] sheet tabs usable.
- [ ] touch controls accessible.

---

# O. Accessibility

- [ ] visible focus.
- [ ] icon buttons labeled.
- [ ] keyboard open/search/copy path works.
- [ ] dialogs trap focus.
- [ ] focus returns after close.
- [ ] active cell has accessible text representation.
- [ ] reduced motion honored.
- [ ] browser zoom not disabled.
- [ ] 200% zoom critical flows usable.
- [ ] status not color-only.

---

# P. PWA

- [ ] manifest valid.
- [ ] icons present.
- [ ] installable where supported.
- [ ] app shell works offline.
- [ ] local workbook open works offline.
- [ ] grid/search/inspect works offline.
- [ ] loaded locale packs work offline.
- [ ] Service Worker cache version deterministic.
- [ ] old cache cleanup verified.
- [ ] update available UI appears.
- [ ] `Later` keeps session.
- [ ] `Update now` activates safely.
- [ ] no silent active-session reload.
- [ ] file handler is progressive enhancement only.

---

# Q. Performance

Test fixture classes:

- [ ] tiny.
- [ ] normal office.
- [ ] formula-heavy.
- [ ] many sheets.
- [ ] ~20MB-class.
- [ ] 300k-row stress class if feasible for fixture design.

Pass:
- [ ] parsing off main thread.
- [ ] rendered cell count roughly viewport-bound.
- [ ] scrolling remains interactive.
- [ ] search does not freeze UI.
- [ ] search cancellation responsive.
- [ ] memory failure is handled rather than blank-screen crash.

Do not publish universal “supports X million rows” marketing claims based on one machine.

---

# R. Release evidence

Final implementation report must include:

- [ ] commit/branch.
- [ ] exact test commands.
- [ ] test counts.
- [ ] browser/viewports verified.
- [ ] offline result.
- [ ] security result.
- [ ] privacy network result.
- [ ] known limitations.
- [ ] public GitHub Pages URL after deployment.

No evidence = not verified.
