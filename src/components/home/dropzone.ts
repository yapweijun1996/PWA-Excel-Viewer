import { t } from '../../core/i18n';
import { workerClient } from '../../services/worker-client';
import { session } from '../../core/session';
import { router } from '../../core/router';
import { storage } from '../../core/storage';
import { showToast } from '../common/toast';

export class DropzoneComponent {
  private el: HTMLElement;
  private isLoading = false;
  private currentStage = '';
  private currentDetail = '';
  private isCancelled = false;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'dropzone-wrapper';
    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private render(): void {
    if (this.isLoading) {
      this.el.innerHTML = `
        <div class="dropzone loading" style="cursor: default; padding: var(--space-8);">
          <div class="spinner" style="width: 32px; height: 32px; border: 3px solid var(--border-strong); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-top: var(--space-3);">${t('common.loading')}</div>
          <div style="font-size: 14px; color: var(--text-secondary);">${this.currentDetail || this.currentStage}</div>
          <button class="btn btn-secondary btn-sm" id="cancel-load-btn" style="margin-top: var(--space-4);">
            ${t('common.cancel')}
          </button>
        </div>
      `;

      const cancelBtn = this.el.querySelector('#cancel-load-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.isCancelled = true;
          this.isLoading = false;
          workerClient.closeWorkbook();
          this.render();
        });
      }
      return;
    }

    this.el.innerHTML = `
      <div class="dropzone" id="file-dropzone" tabindex="0" role="button" aria-label="${t('home.openSpreadsheet')}">
        <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">
          ${t('home.dropzonePrompt')}
        </div>
        <button class="btn btn-primary btn-lg" id="choose-file-btn" type="button">
          ${t('home.openSpreadsheet')}
        </button>
        <div class="dropzone-formats">
          ${t('home.supportedFormats')}
        </div>
        <input type="file" id="spreadsheet-input" accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.tsv,.ods" style="display: none;" />
      </div>
    `;

    const dropzone = this.el.querySelector('#file-dropzone') as HTMLElement;
    const fileInput = this.el.querySelector('#spreadsheet-input') as HTMLInputElement;
    const chooseBtn = this.el.querySelector('#choose-file-btn') as HTMLButtonElement;

    if (chooseBtn && fileInput) {
      chooseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('active');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('active');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file) this.processFile(file);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file) this.processFile(file);
        }
      });
    }
  }

  async processFile(file: File): Promise<void> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'tsv', 'ods'];

    if (!validExtensions.includes(ext)) {
      showToast(t('errors.unsupportedFile'));
      return;
    }

    this.isLoading = true;
    this.isCancelled = false;
    this.currentStage = 'reading';
    this.currentDetail = 'Reading workbook file...';
    this.render();

    try {
      const summary = await workerClient.openWorkbook(file, (stage, detail) => {
        if (this.isCancelled) return;
        this.currentStage = stage;
        this.currentDetail = detail || '';
        this.render();
      });

      if (this.isCancelled) return;

      // Save metadata
      storage.addRecentFile({
        name: file.name,
        size: file.size,
        type: ext.toUpperCase(),
      });

      session.setWorkbook(summary);
      this.isLoading = false;
      router.navigate('#/viewer');
    } catch (err: any) {
      this.isLoading = false;
      console.error('Failed to open spreadsheet:', err);
      showToast(t('errors.corruptFile'));
      this.render();
    }
  }
}
