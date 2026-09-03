import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';
import { encodeAddress } from '../../utils/cell-reference';

export class SheetTabsComponent {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'sheet-tabs-bar';

    appEvents.on('session:workbookChanged', () => this.render());
    appEvents.on('session:sheetChanged', () => this.render());
    appEvents.on('session:selectionChanged', () => this.updateStatus());

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    const wb = session.workbook;
    if (!wb) {
      this.el.innerHTML = '';
      return;
    }

    this.el.innerHTML = `
      <div class="sheet-tabs-list">
        ${wb.sheets
          .map(
            (sheet, idx) => `
          <button class="sheet-tab ${session.activeSheetIndex === idx ? 'active' : ''}" data-sheet-index="${idx}">
            <span>${sheet.name}</span>
            ${sheet.hidden !== 'visible' ? `<span class="badge" style="font-size: 10px;">${t('viewer.hidden')}</span>` : ''}
          </button>
        `
          )
          .join('')}
      </div>
      <div class="sheet-status" id="sheet-status-text">
        ${t('viewer.ready')} · ${encodeAddress(session.selectedCell.row, session.selectedCell.col)}
      </div>
    `;

    const tabs = this.el.querySelectorAll('.sheet-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const idx = parseInt((tab as HTMLElement).getAttribute('data-sheet-index') || '0', 10);
        session.setActiveSheet(idx);
        appEvents.emit('viewer:showGrid');
      });
    });
  }

  private updateStatus(): void {
    const statusEl = this.el.querySelector('#sheet-status-text');
    if (statusEl) {
      statusEl.textContent = `${t('viewer.ready')} · ${encodeAddress(session.selectedCell.row, session.selectedCell.col)}`;
    }
  }
}
