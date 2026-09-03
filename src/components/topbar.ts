import { t } from '../core/i18n';
import { themeManager } from '../core/theme';
import { router } from '../core/router';
import { session } from '../core/session';
import { appEvents } from '../core/event-bus';

export class TopbarComponent {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('header');
    this.el.className = 'app-topbar';

    appEvents.on('session:workbookChanged', () => this.render());
    appEvents.on('session:sheetChanged', () => this.render());
    appEvents.on('route:changed', () => this.render());
    appEvents.on('locale:changed', () => this.render());
    appEvents.on('theme:changed', () => this.render());

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    const route = router.getRoute();
    const isSettings = route.path === '#/settings';
    const hasWorkbook = session.workbook !== null;

    let leftSection = '';
    if (isSettings) {
      leftSection = `
        <div class="topbar-brand">
          <button class="btn btn-ghost btn-sm" id="topbar-back-btn" aria-label="${t('common.back')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>${t('settings.backToViewer')}</span>
          </button>
        </div>
      `;
    } else if (hasWorkbook) {
      const activeSheet = session.workbook?.sheets[session.activeSheetIndex];
      const sheetName = activeSheet ? activeSheet.name : '';
      leftSection = `
        <div class="topbar-brand">
          <button class="btn btn-icon" id="topbar-menu-btn" aria-label="Toggle navigator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div class="topbar-filename" title="${session.workbook?.filename || ''}">
            ${session.workbook?.filename || ''}
            <span style="color: var(--text-muted); font-weight: normal; margin-left: 6px;">› ${sheetName}</span>
          </div>
        </div>
      `;
    } else {
      leftSection = `
        <div class="topbar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
          <span>${t('app.title')}</span>
        </div>
      `;
    }

    let actionButtons = '';
    if (!isSettings && hasWorkbook) {
      actionButtons += `
        <button class="btn btn-ghost btn-sm" id="topbar-find-btn" title="${t('viewer.find')} (Ctrl+F)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>${t('viewer.find')}</span>
        </button>
        <button class="btn btn-ghost btn-sm" id="topbar-goto-btn" title="${t('viewer.goto')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <span>${t('viewer.goto')}</span>
        </button>
      `;
    }

    const currentTheme = themeManager.getMode();
    const themeIcon = currentTheme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : currentTheme === 'light'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z"/></svg>`;

    actionButtons += `
      <button class="btn btn-icon" id="topbar-theme-btn" title="${t('settings.appearance.theme')}: ${currentTheme}" aria-label="Toggle Theme">
        ${themeIcon}
      </button>
      <button class="btn btn-icon" id="topbar-settings-btn" title="${t('settings.title')}" aria-label="${t('settings.title')}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    `;

    this.el.innerHTML = `
      ${leftSection}
      <div class="topbar-actions">
        ${actionButtons}
      </div>
    `;

    // Event bindings
    const backBtn = this.el.querySelector('#topbar-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        router.navigate(hasWorkbook ? '#/viewer' : '#/');
      });
    }

    const menuBtn = this.el.querySelector('#topbar-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        session.setMobileNavigator(!session.mobileNavigatorOpen);
      });
    }

    const findBtn = this.el.querySelector('#topbar-find-btn');
    if (findBtn) {
      findBtn.addEventListener('click', () => {
        session.setModal('search');
      });
    }

    const gotoBtn = this.el.querySelector('#topbar-goto-btn');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', () => {
        session.setModal('goto');
      });
    }

    const themeBtn = this.el.querySelector('#topbar-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = currentTheme === 'system' ? 'light' : currentTheme === 'light' ? 'dark' : 'system';
        themeManager.setMode(next);
      });
    }

    const settingsBtn = this.el.querySelector('#topbar-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        router.navigate('#/settings/general');
      });
    }
  }
}
