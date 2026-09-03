# 10 — Wireframe Index

Use this as the visual implementation checklist.

## Desktop

| ID | Screen | Primary layout |
|---|---|---|
| D01 | Home Empty | Topbar + centered file-open surface |
| D02 | Home Recent | Topbar + recent metadata list |
| D03 | Parsing | Focused stage-based loading |
| D04 | Workbook Overview | Topbar + navigator + overview + details |
| D05 | Worksheet Viewer | Topbar + navigator + virtual grid + inspector |
| D06 | Search | Overlay/surface over Viewer |
| D07 | Go To | Small modal |
| D08 | Workbook Warnings | Structured warning list |
| D09 | Settings | Topbar + settings sidebar + single-page content |

## Mobile

| ID | Screen | Primary layout |
|---|---|---|
| M01 | Home Empty | Safe-area topbar + file-open card |
| M02 | Parsing | Safe-area topbar + loading stages |
| M03 | Worksheet Viewer | Topbar + full-width virtual grid + sheet strip |
| M04 | Workbook Navigator | Full-height drawer |
| M05 | Cell Inspector | Safe-area bottom sheet |
| M06 | Search | Fullscreen search surface |
| M07 | Workbook Overview | Normal vertically scrolling page |
| M08 | Go To | Keyboard-aware bottom sheet |
| M09 | Settings | Dedicated full pages |
| M10 | Update | Persistent modal/sheet |
| M11 | Error | Dedicated recoverable state |

## Surface transformation map

```text
Desktop Navigator       → Mobile Drawer
Desktop Inspector       → Mobile Bottom Sheet
Desktop Search Overlay  → Mobile Fullscreen Search
Desktop Settings Sidebar→ Mobile Settings Menu + Full Page
Desktop Grid            → Mobile Grid (same data interaction, different shell)
```

Do not maintain separate business logic for desktop/mobile unless interaction genuinely differs.

## Visual hierarchy rule

Viewer priority at all sizes:

```text
1. Active workbook/sheet identity
2. Grid
3. Selection
4. Search/navigation controls
5. Inspector
6. Workbook diagnostics
7. Settings/support actions
```

Never allow decorative UI to outrank the grid.
