# 05 — Design System

The visual direction is **professional spreadsheet utility**.

Avoid:
- glossy AI gradients everywhere;
- oversized marketing cards;
- Excel ribbon imitation;
- excessive shadows;
- tiny 9px controls;
- decorative charts on the viewer screen.

The grid is the product hero.

---

## 1. Visual personality

Keywords:

- calm;
- precise;
- neutral;
- trustworthy;
- compact;
- enterprise-friendly;
- modern browser-native.

Use one restrained emerald accent so the product reads as spreadsheet-related without copying Excel's exact branding.

---

## 2. Color tokens

Exact values may be tuned during visual QA. Keep semantic tokens stable.

### Light

```css
--bg-app: #f6f7f8;
--bg-surface: #ffffff;
--bg-subtle: #f2f4f5;
--bg-grid-header: #f4f6f6;
--text-primary: #17201c;
--text-secondary: #5a6861;
--text-muted: #7b8781;
--border: #d8dfdb;
--border-strong: #bbc7c0;
--accent: #167c4a;
--accent-hover: #12683e;
--accent-soft: #e8f5ee;
--selection-fill: rgba(22,124,74,.10);
--warning: #9a6700;
--danger: #b42318;
--focus: #2563eb;
```

### Dark

```css
--bg-app: #111512;
--bg-surface: #181d1a;
--bg-subtle: #202622;
--bg-grid-header: #1d2420;
--text-primary: #eef4f0;
--text-secondary: #b3c0b8;
--text-muted: #88968e;
--border: #313b35;
--border-strong: #46534b;
--accent: #49b77c;
--accent-hover: #64c991;
--accent-soft: rgba(73,183,124,.14);
--selection-fill: rgba(73,183,124,.14);
--warning: #f2c94c;
--danger: #ff8d86;
--focus: #79a8ff;
```

### Important rule

Workbook-provided cell color semantics must not be globally inverted.

---

## 3. Typography

Recommended system stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Do not require external font CDN.

Grid may use the same font.

Suggested sizes:

- App title: 18–20px.
- Screen title: 20–24px.
- Section title: 14–16px semibold.
- Body: 14px desktop, 15–16px mobile where appropriate.
- Grid: 13–14px.
- Caption/meta: 12px minimum.
- Mobile form inputs: 16px minimum.

---

## 4. Spacing scale

```text
4
8
12
16
20
24
32
40
48
```

Do not invent one-off spacing everywhere.

Desktop productivity areas may use 8–12px compact spacing.

Touch interfaces require more breathing room.

---

## 5. Radius

Recommended:

```text
small control: 6px
button/input: 8px
card/dialog: 10–12px
bottom sheet: 16–20px top corners
```

Grid cells remain square.

---

## 6. Elevation

Prefer borders over shadows.

Use shadow only for:
- dialogs;
- menus;
- bottom sheets;
- floating overlay search.

Sidebars and grid are structural surfaces separated by borders.

---

## 7. Buttons

### Primary

Use for:
- Open Spreadsheet.
- Go.
- Update now.
- Confirm external URL if allowed.

### Secondary

Use for:
- Cancel.
- Later.
- Copy.
- Try another file.

### Icon buttons

Minimum touch target:
- Desktop: ~36–40px.
- Mobile: ≥44px, preferably 48px.

Tooltips required for non-obvious icon-only desktop controls.

---

## 8. Inputs

- 1px border.
- Clear focus ring.
- 16px mobile text.
- Do not remove native focus outline unless replaced with a stronger accessible focus indicator.
- Search fields include clear action.
- Address/Go To field supports monospace only if it improves cell-reference readability.

---

## 9. Grid tokens

```text
row height default:       26px desktop
column header:            30px
row header:               30px
grid line:                1px subtle
selected border:          2px accent
active-match border:      2px stronger highlight
```

On mobile:
- do not make rows artificially 44px; spreadsheet density matters;
- primary surrounding controls still obey touch target rules;
- selection can rely on tapping the cell itself.

---

## 10. Grid cell overflow

Default:
- clip visually inside cell;
- no text wrapping unless workbook/view mode says otherwise;
- inspector exposes full value.

Do not expand row height dynamically just because a cell contains long text; that destroys large-table scanning.

Optional tooltip/popup:
- may show full content after hover/focus.

---

## 11. Selection visuals

Single cell:

```text
2px accent outline
subtle fill
small active-cell handle optional
```

Range:
- one range outline;
- translucent fill;
- active anchor cell remains distinct.

Do not use high-opacity fill that hides workbook content.

---

## 12. Status badges

Examples:
- Hidden.
- Macro.
- Large.
- Experimental.
- Offline.

Badge must use text + color, not color alone.

---

## 13. Motion

Default motion:
- 120–200ms for drawers/sheets/menus.
- Avoid dramatic spring animations.
- Respect `prefers-reduced-motion`.

Grid scrolling/selection should not animate in a way that makes navigation feel slow.

Programmatic Go To may use minimal smooth scrolling only if it remains predictable; immediate positioning is acceptable.

---

## 14. Icons

Use a coherent local icon set or lightweight SVG components.

Do not load icons from a runtime CDN.

Core concepts:
- open file;
- spreadsheet;
- search;
- go-to/location;
- settings;
- theme;
- language;
- warning;
- hidden;
- link;
- copy;
- close;
- menu.

Icons are secondary to text in critical actions.
