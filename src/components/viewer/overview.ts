import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export class OverviewComponent {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'viewer-overview';
    this.el.style.flex = '1';
    this.el.style.overflowY = 'auto';
    this.el.style.padding = 'var(--space-8)';
    this.el.style.display = 'none';

    appEvents.on('viewer:showOverview', () => {
      this.el.style.display = 'block';
      this.render();
    });
    appEvents.on('viewer:showGrid', () => {
      this.el.style.display = 'none';
    });

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    const wb = session.workbook;
    if (!wb) return;

    this.el.innerHTML = `
      <div style="max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6);">
        <div style="border-bottom: 1px solid var(--border); padding-bottom: var(--space-4);">
          <h2 style="font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-1);">
            ${wb.filename}
          </h2>
          <div style="font-size: 13px; color: var(--text-muted); display: flex; gap: var(--space-3);">
            <span class="badge badge-accent">${wb.fileType}</span>
            <span>${formatSize(wb.fileSize)}</span> ·
            <span>${wb.sheetCount} ${t('viewer.sheets')}</span> ·
            <span>${wb.totalCells.toLocaleString()} ${t('viewer.cells')}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--space-4);">
          <div class="settings-card" style="padding: var(--space-4);">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${t('viewer.sheets')}</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${wb.sheetCount}</div>
          </div>
          <div class="settings-card" style="padding: var(--space-4);">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500;">${t('viewer.cells')}</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${wb.totalCells.toLocaleString()}</div>
          </div>
          <div class="settings-card" style="padding: var(--space-4);">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Formulas</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${wb.totalFormulas.toLocaleString()}</div>
          </div>
          <div class="settings-card" style="padding: var(--space-4);">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Hyperlinks</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${wb.totalLinks.toLocaleString()}</div>
          </div>
          <div class="settings-card" style="padding: var(--space-4);">
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Merges</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">${wb.totalMerges.toLocaleString()}</div>
          </div>
        </div>

        <div>
          <h3 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-3);">
            ${t('viewer.sheets')}
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3);">
            ${wb.sheets
              .map(
                (sheet, idx) => `
              <div class="overview-sheet-card settings-card" data-sheet-index="${idx}" style="cursor: pointer; transition: border-color var(--transition-fast), transform var(--transition-fast); padding: var(--space-4);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2);">
                  <span style="font-weight: 600; font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${sheet.name}
                  </span>
                  ${
                    sheet.hidden !== 'visible'
                      ? `<span class="badge badge-warning">${t('viewer.hidden')}</span>`
                      : ''
                  }
                </div>
                <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 2px;">
                  <span>${sheet.rowCount.toLocaleString()} ${t('viewer.rows')} × ${sheet.colCount} ${t('viewer.cols')}</span>
                  <span>${sheet.cellCount.toLocaleString()} ${t('viewer.cells')}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        ${
          wb.warnings.length > 0
            ? `
          <div class="settings-card" style="border-left: 4px solid var(--warning); padding: var(--space-4); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">
                ${t('warnings.title')} (${wb.warnings.length})
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">
                ${wb.hasMacros ? t('warnings.macroTitle') + '. ' : ''}
                ${wb.hiddenSheetCount > 0 ? t('warnings.hiddenSheetsTitle', { count: wb.hiddenSheetCount }) + '. ' : ''}
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="overview-view-warnings-btn">
              ${t('warnings.title')}
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;

    // Hook sheet card clicks
    const cards = this.el.querySelectorAll('.overview-sheet-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt((card as HTMLElement).getAttribute('data-sheet-index') || '0', 10);
        session.setActiveSheet(idx);
        appEvents.emit('viewer:showGrid');
      });
    });

    const viewWarnBtn = this.el.querySelector('#overview-view-warnings-btn');
    if (viewWarnBtn) {
      viewWarnBtn.addEventListener('click', () => {
        session.setModal('warnings');
      });
    }
  }
}
