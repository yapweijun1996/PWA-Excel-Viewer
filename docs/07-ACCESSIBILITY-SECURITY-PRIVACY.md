# 07 — Accessibility, Security and Privacy

These are release requirements, not polish.

---

# 1. Accessibility baseline

Aim for WCAG 2.2 AA-compatible interaction patterns where practical.

Required:
- keyboard-accessible primary functions;
- visible focus;
- labels for icon buttons;
- sufficient contrast;
- touch targets;
- no color-only meaning;
- reduced-motion support;
- screen-reader-meaningful dialogs/sheets;
- browser zoom remains available.

Do not disable user scaling as a blanket mobile policy.

---

# 2. Keyboard contract

Recommended:

```text
Arrow keys            Move active cell
Shift + Arrow         Extend selection
Page Up / Page Down   Move viewport
Home / End            Navigation as supported
Ctrl/Cmd + F          App search
Ctrl/Cmd + C          Copy selection
Enter                 Inspect active cell
Escape                Close top transient surface
```

Do not steal browser shortcuts without a user benefit.

---

# 3. Grid accessibility

A virtualized spreadsheet is difficult to expose perfectly to assistive tech.

V1 must at least:
- expose active cell address and value;
- announce selection changes in a bounded way;
- allow keyboard navigation;
- keep DOM focus stable;
- provide Inspector as an accessible textual representation of selected cell.

Do not render millions of hidden off-screen cells solely for accessibility.

---

# 4. Focus management

Dialogs:
- focus first logical control;
- trap focus while modal;
- return focus to invoker when closed.

Mobile drawer:
- background inert;
- return focus to menu button/grid.

Bottom Inspector:
- focus heading/first action on explicit open;
- return to selected grid context on close.

Search:
- focus input immediately;
- result navigation returns sensible focus to grid.

---

# 5. Spreadsheet data is untrusted

Treat workbook content like uploaded untrusted input even though processing is local.

Never:
- put cell HTML into `innerHTML`;
- execute embedded script;
- execute VBA;
- automatically fetch external workbook links/resources;
- trust hyperlink schemes.

Render textual cell content as text.

---

# 6. Hyperlink allowlist

Default safe external protocols:

```text
https:
http:
mailto:   // optional, if implemented deliberately
```

Block:

```text
javascript:
vbscript:
file:
data:
unknown schemes
```

Internal workbook references are handled internally.

External link confirmation is ON by default.

---

# 7. Macro policy

Macros:
- can be detected;
- can be reported;
- are never executed.

UI:

```text
Macros detected
This viewer does not execute VBA macros.
```

Do not claim macro “safety” beyond not executing them.

---

# 8. File validation

Do not rely only on filename extension.

At minimum:
- validate extension against accepted picker set;
- attempt parser validation;
- treat parse failures as unreadable/unsupported.

If implementing stronger signature checks, keep them format-aware and tested.

---

# 9. Network privacy invariant

During core workbook journey, workbook content must not leave the browser.

Release test should intercept network while:
- opening workbook;
- changing sheets;
- searching;
- inspecting;
- copying.

Fail if workbook cell content, formula content, filename or binary payload appears in unexpected requests.

---

# 10. Analytics

V1 recommendation: no analytics SDK.

If future telemetry is added:
- do not collect workbook values;
- do not collect formulas;
- do not collect filenames;
- do not collect workbook binary;
- document exactly what is collected;
- keep event dimensions low-cardinality where possible;
- provide user control if telemetry is not strictly necessary.

---

# 11. Local storage

Default local settings may store:

- selected theme;
- selected language;
- privacy preferences;
- recent-file metadata preference;
- panel preferences.

Recent metadata may store:
- filename;
- extension;
- file size;
- last-opened timestamp.

Workbook content must not be persisted unless user explicitly chooses a “keep on this device” feature.

---

# 12. OPFS / persisted workbook

If P1 local persistence is implemented:

Before storage:
- explicit user action.

UI must explain:
- file is stored in this browser/site storage;
- clearing browser site data can remove it;
- it is not a cloud backup.

Provide:
- remove stored copy;
- clear all local workbook copies.

---

# 13. Clear local data

Destructive action must use confirmation:

```text
Clear local data?

This removes settings, recent history, and
any spreadsheet copies you explicitly kept
on this device.

[Cancel] [Clear local data]
```

Do not delete external source files.

---

# 14. CSP / dependency guidance

Prefer:
- bundled same-origin application assets;
- no inline script if build permits;
- no runtime CDN;
- strict Content Security Policy compatible architecture.

Do not weaken CSP merely to make a third-party script easy to include.

---

# 15. Error safety

Parser errors should not expose:
- local absolute paths;
- internal stack traces;
- sensitive workbook snippets.

Developer diagnostics may be logged in dev mode, but user-facing error states stay bounded.

---

# 16. Clipboard

Clipboard writes occur only after explicit user action.

Do not auto-copy selected cells on selection.

After successful copy:
- show brief accessible status (“Copied”).

On failure:
- show actionable message;
- do not repeatedly retry without user action.

---

# 17. Accessibility QA viewports

At minimum:

```text
1440×900 desktop
1280×800 desktop
834×1112 tablet
430×932 mobile
390×844 mobile
375×812 mobile
```

Also test:
- 200% browser zoom on desktop for critical screens;
- mobile text scaling if available;
- reduced motion;
- keyboard-only desktop flow.

---

# 18. Accessibility acceptance examples

Pass:
- user can open file with keyboard;
- user can search with keyboard;
- user can navigate results;
- selected cell data is readable outside purely visual grid context;
- mobile bottom sheet has accessible close control;
- no essential control is under notch/home indicator;
- no horizontal document overflow.

Fail:
- icon-only actions have no labels;
- focus disappears;
- app disables zoom globally;
- sheet traps keyboard focus;
- dark theme contrast is insufficient;
- status communicated only by red/green color.
