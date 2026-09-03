# PWA Excel Viewer — UI/UX Build Documentation Pack

Target repository: `https://github.com/yapweijun1996/PWA-Excel-Viewer`

Status: **V1 implementation baseline**

This pack defines the product UI/UX contract for a browser-first, local-first Spreadsheet Viewer / Inspector PWA.

The implementation goal is not to recreate Microsoft Excel. The product should make spreadsheet files fast to open, safe to inspect, easy to search, and usable offline without uploading workbook contents.

## Read order for an AI coding agent

1. `docs/00-PRODUCT-BASELINE.md`
2. `docs/01-INFORMATION-ARCHITECTURE.md`
3. `docs/02-DESKTOP-UI-UX-VISUAL-SPEC.md`
4. `docs/03-MOBILE-UI-UX-VISUAL-SPEC.md`
5. `docs/04-SCREEN-INTERACTIONS-AND-STATES.md`
6. `docs/05-DESIGN-SYSTEM.md`
7. `docs/06-RESPONSIVE-I18N-THEME-PWA.md`
8. `docs/07-ACCESSIBILITY-SECURITY-PRIVACY.md`
9. `docs/08-AI-AGENT-IMPLEMENTATION-BRIEF.md`
10. `docs/09-QA-ACCEPTANCE-CHECKLIST.md`

## Product sentence

> Open, search, and inspect Excel and spreadsheet files directly on your device — private by default, installable, multilingual, theme-aware, and offline-capable.

## V1 hard boundaries

- Static browser application.
- GitHub Pages compatible.
- No backend required for core functionality.
- Workbook data stays local by default.
- Viewer + Inspector, not editor.
- Web Worker for heavy workbook processing.
- Virtualized spreadsheet grid.
- System / Light / Dark themes.
- i18n: `en-SG`, `zh-Hans`, `ms-MY`, `ja-JP`, `vi-VN`.
- Product-grade PWA lifecycle.
- Mobile-first QA, including iPhone standalone/safe-area behavior.
- No VBA execution.
- No unsafe spreadsheet hyperlink execution.

## Repository placement

When implementing the project, keep these documents under `/docs` and treat them as the source of truth for V1 UI/UX decisions.

If implementation needs to deviate from a MUST rule, the coding agent must document:
1. the exact rule,
2. the technical/product reason,
3. user-visible impact,
4. fallback behavior,
5. test evidence.
