import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';

export class WarningsModal {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop warnings-modal';
    this.el.style.display = 'none';

    appEvents.on('session:modalChanged', (modal) => {
      if (modal === 'warnings') {
        this.open();
      } else {
        this.close();
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
  }

  close(): void {
    this.el.style.display = 'none';
  }

  private render(): void {
    const wb = session.workbook;
    if (!wb) return;

    const hiddenSheets = wb.sheets.filter((s) => s.hidden !== 'visible');

    this.el.innerHTML = `
      <div class="modal-dialog" style="max-width: 500px;">
        <div class="modal-header">
          <div class="modal-title" style="display: flex; align-items: center; gap: var(--space-2); color: var(--warning);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>${t('warnings.title')}</span>
          </div>
          <button class="btn btn-icon btn-sm" id="warn-close-btn" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: var(--space-4);">
          ${
            wb.hasMacros
              ? `
            <div style="border-left: 3px solid var(--warning); padding-left: var(--space-3);">
              <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">
                ${t('warnings.macroTitle')}
              </div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                ${t('warnings.macroDesc')}
              </div>
            </div>
          `
              : ''
          }

          ${
            hiddenSheets.length > 0
              ? `
            <div style="border-left: 3px solid var(--text-muted); padding-left: var(--space-3);">
              <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">
                ${t('warnings.hiddenSheetsTitle', { count: hiddenSheets.length })}
              </div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                ${hiddenSheets.map((s) => s.name).join(', ')}
              </div>
            </div>
          `
              : ''
          }

          ${
            wb.totalLinks > 0
              ? `
            <div style="border-left: 3px solid var(--accent); padding-left: var(--space-3);">
              <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">
                ${t('warnings.externalLinksTitle', { count: wb.totalLinks })}
              </div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                ${t('warnings.externalLinksDesc')}
              </div>
            </div>
          `
              : ''
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary btn-sm" id="warn-continue-btn">
            ${t('warnings.continue')}
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.el.querySelector('#warn-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => session.setModal(null));

    const continueBtn = this.el.querySelector('#warn-continue-btn');
    if (continueBtn) continueBtn.addEventListener('click', () => session.setModal(null));
  }
}
