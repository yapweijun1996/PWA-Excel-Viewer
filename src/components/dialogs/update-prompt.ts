import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';

export class UpdatePromptModal {
  private el: HTMLElement;
  private onUpdateCallback: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop update-modal';
    this.el.style.display = 'none';

    appEvents.on('session:modalChanged', (modal) => {
      if (modal === 'updatePrompt') {
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

  setUpdateCallback(cb: () => void): void {
    this.onUpdateCallback = cb;
  }

  open(): void {
    this.el.style.display = 'flex';
    this.render();
  }

  close(): void {
    this.el.style.display = 'none';
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <div class="modal-title">${t('pwa.updateAvailableTitle')}</div>
        </div>

        <div class="modal-body" style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
          ${t('pwa.updateAvailableDesc')}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="update-later-btn">
            ${t('pwa.updateLater')}
          </button>
          <button class="btn btn-primary btn-sm" id="update-now-btn">
            ${t('pwa.updateNow')}
          </button>
        </div>
      </div>
    `;

    const laterBtn = this.el.querySelector('#update-later-btn');
    if (laterBtn) laterBtn.addEventListener('click', () => session.setModal(null));

    const nowBtn = this.el.querySelector('#update-now-btn');
    if (nowBtn) {
      nowBtn.addEventListener('click', () => {
        if (this.onUpdateCallback) {
          this.onUpdateCallback();
        } else {
          window.location.reload();
        }
      });
    }
  }
}
