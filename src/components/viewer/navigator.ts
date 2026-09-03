import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';

export class NavigatorComponent {
  private el: HTMLElement;
  private isOverviewActive = false;

  constructor() {
    this.el = document.createElement('aside');
    this.el.className = 'viewer-navigator';

    appEvents.on('session:workbookChanged', () => this.render());
    appEvents.on('session:sheetChanged', () => {
      this.isOverviewActive = false;
      this.render();
    });
    appEvents.on('session:mobileNavChanged', (open: boolean) => {
      if (open) {
        this.el.classList.add('mobile-open');
      } else {
        this.el.classList.remove('mobile-open');
      }
    });

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  setOverviewActive(active: boolean): void {
    this.isOverviewActive = active;
    this.render();
  }

  render(): void {
    const wb = session.workbook;
    if (!wb) {
      this.el.innerHTML = '';
      return;
    }

    const warningCount = wb.warnings.length;

    this.el.innerHTML = `
      <div style="padding: var(--space-4); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${t('viewer.structure')}</span>
        <button class="btn btn-icon btn-sm" id="close-nav-btn" style="display: none;" aria-label="${t('common.close')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div style="padding: var(--space-2); flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-1);">
        <button class="btn btn-ghost ${this.isOverviewActive ? 'active' : ''}" id="nav-overview-btn" style="width: 100%; justify-content: flex-start; text-align: left; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span style="flex: 1;">${t('viewer.overview')}</span>
        </button>

        <div style="padding: var(--space-2) var(--space-3); font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-top: var(--space-2);">
          ${t('viewer.sheets')} (${wb.sheets.length})
        </div>

        <div class="nav-sheets-list" style="display: flex; flex-direction: column; gap: 2px;">
          ${wb.sheets
            .map(
              (sheet, idx) => `
            <button class="btn btn-ghost nav-sheet-item ${!this.isOverviewActive && session.activeSheetIndex === idx ? 'active' : ''}" data-sheet-index="${idx}" style="width: 100%; justify-content: space-between; text-align: left; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-weight: normal;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${sheet.name}</span>
              ${
                sheet.hidden !== 'visible'
                  ? `<span class="badge" style="font-size: 10px;">${t('viewer.hidden')}</span>`
                  : `<span style="font-size: 11px; color: var(--text-muted);">${sheet.rowCount}</span>`
              }
            </button>
          `
            )
            .join('')}
        </div>

        ${
          warningCount > 0
            ? `
          <div style="margin-top: auto; padding: var(--space-2); border-top: 1px solid var(--border);">
            <button class="btn btn-ghost" id="nav-warnings-btn" style="width: 100%; justify-content: space-between; color: var(--warning); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);">
              <span style="display: flex; align-items: center; gap: var(--space-2);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>${t('viewer.warnings')}</span>
              </span>
              <span class="badge badge-warning">${warningCount}</span>
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;

    // Hook close button on mobile
    const closeBtn = this.el.querySelector('#close-nav-btn');
    if (closeBtn) {
      if (window.innerWidth <= 900) {
        (closeBtn as HTMLElement).style.display = 'inline-flex';
      }
      closeBtn.addEventListener('click', () => {
        session.setMobileNavigator(false);
      });
    }

    // Overview button
    const overviewBtn = this.el.querySelector('#nav-overview-btn');
    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        this.isOverviewActive = true;
        appEvents.emit('viewer:showOverview');
        this.render();
        session.setMobileNavigator(false);
      });
    }

    // Sheet items
    const sheetItems = this.el.querySelectorAll('.nav-sheet-item');
    sheetItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).getAttribute('data-sheet-index') || '0', 10);
        this.isOverviewActive = false;
        session.setActiveSheet(idx);
        appEvents.emit('viewer:showGrid');
      });
    });

    // Warnings button
    const warningsBtn = this.el.querySelector('#nav-warnings-btn');
    if (warningsBtn) {
      warningsBtn.addEventListener('click', () => {
        session.setModal('warnings');
      });
    }
  }
}
