import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { workerClient } from '../../services/worker-client';
import { appEvents } from '../../core/event-bus';
import { SearchResult } from '../../worker/protocol';

export class SearchModal {
  private el: HTMLElement;
  private debounceTimer = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop search-modal';
    this.el.style.display = 'none';

    appEvents.on('session:modalChanged', (modal) => {
      if (modal === 'search') {
        this.open();
      } else {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        session.setModal('search');
      } else if (e.key === 'Escape' && session.activeModal === 'search') {
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
      const input = this.el.querySelector('#search-input') as HTMLInputElement;
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
    const isMobile = window.innerWidth <= 600;

    this.el.innerHTML = `
      <div class="modal-dialog" style="${isMobile ? 'height: 100%; max-height: 100%; border-radius: 0; max-width: 100%;' : 'max-width: 580px;'}">
        <div class="modal-header">
          <div class="modal-title">${t('search.title')}</div>
          <button class="btn btn-icon btn-sm" id="search-close-btn" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4);">
          <div>
            <input type="search" class="input" id="search-input" placeholder="${t('search.placeholder')}" value="${this.escapeHtml(session.searchQuery)}" style="font-size: 15px; padding: var(--space-3);" />
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-secondary);">
            <div style="display: flex; gap: var(--space-4); align-items: center;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="searchScope" value="workbook" id="scope-wb" checked />
                <span>${t('search.scopeWorkbook')}</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="searchScope" value="sheet" id="scope-sheet" />
                <span>${t('search.scopeSheet')}</span>
              </label>
            </div>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="search-match-case" />
              <span>${t('search.matchCase')}</span>
            </label>
          </div>

          <div id="search-status" style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
            ${session.searchResults.length > 0 ? t('search.matchesCount', { count: session.searchResults.length }) : ''}
          </div>

          <div id="search-results-list" style="flex: 1; overflow-y: auto; max-height: 380px; display: flex; flex-direction: column; gap: var(--space-1); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2); background: var(--bg-subtle);">
            ${this.renderResults(session.searchResults)}
          </div>
        </div>
      </div>
    `;

    // Hook events
    const closeBtn = this.el.querySelector('#search-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => session.setModal(null));

    const input = this.el.querySelector('#search-input') as HTMLInputElement;
    const scopeSheet = this.el.querySelector('#scope-sheet') as HTMLInputElement;
    const matchCaseBox = this.el.querySelector('#search-match-case') as HTMLInputElement;

    const performSearch = () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(async () => {
        const query = input?.value.trim() || '';
        session.searchQuery = query;

        if (!query) {
          session.searchResults = [];
          this.updateResultsView([]);
          return;
        }

        const statusEl = this.el.querySelector('#search-status');
        if (statusEl) statusEl.textContent = t('search.searching');

        const sheetIndex = scopeSheet?.checked ? session.activeSheetIndex : undefined;
        const matchCase = matchCaseBox?.checked || false;

        try {
          const { results } = await workerClient.search(query, sheetIndex, matchCase);
          session.searchResults = results;
          this.updateResultsView(results);
        } catch (e) {
          console.error('Search error', e);
        }
      }, 200);
    };

    if (input) input.addEventListener('input', performSearch);
    const scopeWb = this.el.querySelector('#scope-wb');
    if (scopeWb) scopeWb.addEventListener('change', performSearch);
    if (scopeSheet) scopeSheet.addEventListener('change', performSearch);
    if (matchCaseBox) matchCaseBox.addEventListener('change', performSearch);

    this.bindResultClicks();
  }

  private updateResultsView(results: SearchResult[]): void {
    const statusEl = this.el.querySelector('#search-status');
    if (statusEl) {
      statusEl.textContent = results.length > 0 ? t('search.matchesCount', { count: results.length }) : t('search.noMatches');
    }

    const listEl = this.el.querySelector('#search-results-list');
    if (listEl) {
      listEl.innerHTML = this.renderResults(results);
      this.bindResultClicks();
    }
  }

  private renderResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return `<div style="padding: var(--space-4); text-align: center; color: var(--text-muted); font-size: 13px;">${session.searchQuery ? t('search.noMatches') : ''}</div>`;
    }

    return results
      .map(
        (r, idx) => `
        <div class="search-result-row" data-index="${idx}" style="padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); cursor: pointer; display: flex; flex-direction: column; gap: 2px; transition: background-color var(--transition-fast);">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: var(--accent);">
            <span>${this.escapeHtml(r.sheetName)} › ${r.address}</span>
            ${r.isFormula ? `<span class="badge" style="font-size: 10px;">Formula</span>` : ''}
          </div>
          <div style="font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${this.escapeHtml(r.value)}
          </div>
        </div>
      `
      )
      .join('');
  }

  private bindResultClicks(): void {
    const rows = this.el.querySelectorAll('.search-result-row');
    rows.forEach((row) => {
      row.addEventListener('click', () => {
        const idx = parseInt((row as HTMLElement).getAttribute('data-index') || '0', 10);
        const match = session.searchResults[idx];
        if (match) {
          if (session.activeSheetIndex !== match.sheetIndex) {
            session.setActiveSheet(match.sheetIndex);
          }
          session.setSelectedCell(match.row, match.col, false);
          appEvents.emit('goto:reference', match.address);
          session.setModal(null);
        }
      });
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
