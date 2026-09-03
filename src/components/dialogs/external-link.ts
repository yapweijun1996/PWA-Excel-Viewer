import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';

export class ExternalLinkModal {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop external-link-modal';
    this.el.style.display = 'none';

    appEvents.on('session:modalChanged', (modal) => {
      if (modal === 'externalLink') {
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
    const url = session.pendingExternalUrl;

    this.el.innerHTML = `
      <div class="modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <div class="modal-title">${t('security.externalLinkTitle')}</div>
          <button class="btn btn-icon btn-sm" id="ext-link-close-btn" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: var(--space-3);">
          <div style="font-size: 14px; color: var(--text-secondary);">
            ${t('security.externalLinkWarning')}
          </div>
          <div style="font-family: var(--font-mono); font-size: 13px; color: var(--accent); background: var(--bg-subtle); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border); word-break: break-all;">
            ${this.escapeHtml(url)}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="ext-link-cancel-btn">
            ${t('common.cancel')}
          </button>
          <button class="btn btn-primary btn-sm" id="ext-link-proceed-btn">
            ${t('security.externalLinkProceed')}
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.el.querySelector('#ext-link-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => session.setModal(null));

    const cancelBtn = this.el.querySelector('#ext-link-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => session.setModal(null));

    const proceedBtn = this.el.querySelector('#ext-link-proceed-btn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        window.open(url, '_blank', 'noopener,noreferrer');
        session.setModal(null);
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
