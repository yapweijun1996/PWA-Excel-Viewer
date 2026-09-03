import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';
import { parseCellReference } from '../../utils/cell-reference';

export class GotoModal {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop goto-modal';
    this.el.style.display = 'none';

    appEvents.on('session:modalChanged', (modal) => {
      if (modal === 'goto') {
        this.open();
      } else {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && session.activeModal === 'goto') {
        session.setModal(null);
      }
    });

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  open(): void {
    this.el.style.display = 'flex';
    this.render();
    setTimeout(() => {
      const input = this.el.querySelector('#goto-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }

  close(): void {
    this.el.style.display = 'none';
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="modal-dialog" style="max-width: 420px;">
        <div class="modal-header">
          <div class="modal-title">${t('goto.title')}</div>
          <button class="btn btn-icon btn-sm" id="goto-close-btn" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form id="goto-form">
          <div class="modal-body" style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div>
              <input type="text" class="input" id="goto-input" placeholder="${t('goto.placeholder')}" autocomplete="off" />
            </div>
            <div id="goto-error" style="display: none; font-size: 13px; color: var(--danger); font-weight: 500;">
              ${t('goto.invalid')}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Examples: A1, F128, Sales!B42, 'Sales 2026'!C10
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" id="goto-cancel-btn">
              ${t('common.cancel')}
            </button>
            <button type="submit" class="btn btn-primary btn-sm">
              ${t('goto.submit')}
            </button>
          </div>
        </form>
      </div>
    `;

    const closeBtn = this.el.querySelector('#goto-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => session.setModal(null));

    const cancelBtn = this.el.querySelector('#goto-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => session.setModal(null));

    const form = this.el.querySelector('#goto-form') as HTMLFormElement;
    const input = this.el.querySelector('#goto-input') as HTMLInputElement;
    const errorEl = this.el.querySelector('#goto-error') as HTMLElement;

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = input.value.trim();
        const parsed = parseCellReference(raw);

        if (!parsed) {
          if (errorEl) errorEl.style.display = 'block';
          return;
        }

        if (parsed.sheetName) {
          const sheetIdx = session.workbook?.sheets.findIndex(
            (s) => s.name.toLowerCase() === parsed.sheetName!.toLowerCase()
          );
          if (sheetIdx !== undefined && sheetIdx >= 0) {
            session.setActiveSheet(sheetIdx);
          }
        }

        session.setSelectedCell(parsed.row, parsed.col, false);
        appEvents.emit('goto:reference', parsed.address);
        session.setModal(null);
      });
    }
  }
}
