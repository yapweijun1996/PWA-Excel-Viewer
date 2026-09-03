import { t } from '../../core/i18n';
import { storage } from '../../core/storage';
import { showToast } from '../common/toast';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export class RecentListComponent {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'recent-section';
    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    const recents = storage.getRecentFiles();
    if (recents.length === 0) {
      this.el.style.display = 'none';
      return;
    }

    this.el.style.display = 'flex';
    this.el.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span class="recent-title">${t('home.recentTitle')}</span>
        <button class="btn btn-ghost btn-sm" id="clear-recent-btn" style="font-size: 12px;">
          ${t('home.clearRecent')}
        </button>
      </div>
      <div class="recent-list">
        ${recents
          .map(
            (item) => `
          <div class="recent-item" data-filename="${item.name}">
            <div class="recent-info">
              <div class="recent-name">${item.name}</div>
              <div class="recent-meta">
                <span class="badge">${item.type}</span>
                <span>${formatFileSize(item.size)}</span> ·
                <span>${formatDate(item.lastOpened)}</span>
              </div>
            </div>
            <button class="btn btn-icon btn-sm remove-recent-btn" data-filename="${item.name}" title="${t('common.remove')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `
          )
          .join('')}
      </div>
      <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
        ${t('home.recentNotice')}
      </div>
    `;

    // Clear all button
    const clearBtn = this.el.querySelector('#clear-recent-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        storage.clearRecentFiles();
        this.render();
      });
    }

    // Remove single buttons
    const removeButtons = this.el.querySelectorAll('.remove-recent-btn');
    removeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filename = (btn as HTMLElement).getAttribute('data-filename');
        if (filename) {
          storage.removeRecentFile(filename);
          this.render();
        }
      });
    });

    // Item click
    const items = this.el.querySelectorAll('.recent-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        showToast(t('home.reopenPrompt'), 3500);
      });
    });
  }
}
