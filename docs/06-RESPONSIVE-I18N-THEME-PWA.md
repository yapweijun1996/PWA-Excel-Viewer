# 06 — Responsive, i18n, Theme and PWA Contract

---

# 1. Responsive breakpoints

Do not design only around arbitrary CSS framework defaults.

Recommended behavior-driven ranges:

```text
>= 1200px  Full desktop tri-pane
900–1199   Compact desktop / tablet landscape
600–899    Tablet / narrow workspace
< 600px    Mobile workspace
```

Exact breakpoint can move if visual testing shows a better transition.

## Full desktop

- left navigator visible;
- inspector visible;
- grid center.

## Compact desktop/tablet

- left navigator may collapse to rail/drawer;
- inspector may become overlay/panel;
- grid remains primary.

## Mobile

- no persistent side panels;
- navigator drawer;
- inspector bottom sheet;
- search fullscreen.

---

# 2. Height responsiveness

Spreadsheet apps are height-sensitive.

Test:
- 900px desktop height;
- 768px desktop height;
- 844px mobile;
- short landscape.

Viewer should use app-shell sizing:

```css
height: 100dvh;
```

with appropriate fallback rather than relying only on old `100vh`.

Grid gets remaining height via layout, not hardcoded pixel math spread across scripts.

---

# 3. Safe-area requirements

Use:

```css
env(safe-area-inset-top, 0px)
env(safe-area-inset-right, 0px)
env(safe-area-inset-bottom, 0px)
env(safe-area-inset-left, 0px)
```

Apply where relevant to:
- topbar;
- mobile drawer;
- bottom sheet;
- sheet tabs;
- toast container;
- update prompt;
- fixed/floating actions.

System/status bar surface must be intentional and opaque.

---

# 4. Theme modes

Three settings:

```text
System
Light
Dark
```

Persist user selection locally.

`System` follows `prefers-color-scheme` changes live.

Theme change must:
- update app chrome;
- update `theme-color` where appropriate;
- preserve workbook/session state.

No global `filter: invert()`.

---

# 5. Workbook vs app theme

Application chrome theme is separate from workbook semantics.

If workbook style information is rendered:
- preserve original semantic colors as much as V1 parser/renderer supports;
- do not darken/recolor workbook cells just to match app theme.

Possible future feature:
“Comfort dark sheet”
must be explicit and separate from default dark mode.

---

# 6. Locale set

Required:

```text
en-SG   English
zh-Hans 简体中文
ms-MY   Bahasa Melayu
ja-JP   日本語
vi-VN   Tiếng Việt
```

Default:
`en-SG`.

Do not auto-switch based solely on browser language when no stored preference exists unless product decision changes explicitly.

---

# 7. i18n scope

Translate:
- app navigation;
- buttons;
- settings;
- empty states;
- errors;
- warnings;
- PWA update/install copy;
- privacy explanations;
- grid app labels such as “Formula”, “Raw value”, “Hidden”.

Do NOT translate:
- workbook cells;
- sheet names;
- formulas;
- comments;
- customer/vendor names;
- user-entered workbook text.

---

# 8. i18n architecture

English bundle:
- always available;
- complete fallback.

Other bundles:
- lazy-load;
- cache after successful load;
- apply atomically.

Suggested key structure:

```text
app.*
home.*
viewer.*
navigator.*
grid.*
inspector.*
search.*
warnings.*
settings.general.*
settings.appearance.*
settings.language.*
settings.privacy.*
settings.about.*
errors.*
pwa.*
common.*
```

Avoid keys based on English sentences.

Good:

```text
viewer.openFile
errors.unsupportedFile.title
```

Bad:

```text
"Open Spreadsheet"
```

---

# 9. Missing translation behavior

Runtime:
- fallback to English;
- log a development diagnostic;
- never display raw key if English exists.

CI:
- all locale catalogs must share canonical key set;
- new hardcoded user-visible UI strings should fail lint/audit.

---

# 10. Locale switch preservation

A language change must preserve:

- current file;
- active sheet;
- sheet viewport;
- selected cell/range;
- Inspector state;
- search query/results;
- collapsed panels;
- settings route where possible.

Never reload the entire app simply to change language.

---

# 11. PWA manifest requirements

Manifest should include at least:

- name;
- short_name;
- description;
- start_url;
- scope;
- display `standalone`;
- background_color;
- theme_color;
- icons;
- categories;
- file handlers where supported and tested.

GitHub Pages base-path handling must be correct.

---

# 12. File handling

OS-level PWA file association is progressive enhancement.

Core must always support:
- file picker;
- drag/drop.

If File Handling API is available:
- register supported extensions;
- consume launch through supported browser API;
- still validate file type/content.

Never make OS association the only way to open files.

---

# 13. Service Worker

Service Worker must cache same-origin application assets needed for offline core:

- HTML/app shell;
- CSS;
- JS;
- Worker;
- parser bundle;
- icons;
- manifest-related assets;
- translation bundles.

Avoid runtime CDN dependencies.

Cross-origin interception should be avoided unless there is an explicit verified reason.

---

# 14. Service Worker updates

Required behavior:

```text
new worker waiting
→ display persistent update available UI
→ user chooses Later or Update now
```

Update activation must be user-controlled while a workbook is open.

Build/cache names must be deterministic/versioned.

Old caches should be cleaned carefully after activation.

---

# 15. Offline requirement

After first successful online load, user must be able to:

- start installed/app site offline;
- open a local spreadsheet;
- view;
- navigate sheets;
- inspect cells;
- search;
- copy.

Settings and English UI must work offline.

Previously loaded additional locale packs should remain usable offline.

---

# 16. Install UX

Do not show a permanent “Install” button when:
- app is already installed;
- browser does not support programmatic prompt.

If browser exposes install prompt:
- show install affordance in overflow/settings/home secondary area.

iOS:
- provide concise manual “Add to Home Screen” instructions when useful;
- do not pretend programmatic installation exists.

Install UX is secondary to Open Spreadsheet.

---

# 17. Theme/status-bar standalone QA

Verify installed PWA:
- Light mode has intentional light top/system surface.
- Dark mode has intentional dark top/system surface.
- No transparent accidental status-bar strip.
- Switching theme does not leave stale system chrome where browser permits updates.
