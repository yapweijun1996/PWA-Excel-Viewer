import { t, i18n, SUPPORTED_LOCALES, SupportedLocale } from '../../core/i18n';
import { themeManager, ThemeMode } from '../../core/theme';
import { storage } from '../../core/storage';
import { router } from '../../core/router';
import { appEvents } from '../../core/event-bus';
import { showToast } from '../common/toast';

export class SettingsShellComponent {
  private el: HTMLElement;
  private currentSection = 'general';

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'settings-layout';

    appEvents.on('route:changed', (route) => {
      if (route.path === '#/settings') {
        this.currentSection = route.section || 'general';
        this.render();
      }
    });

    appEvents.on('locale:changed', () => this.render());
    appEvents.on('theme:changed', () => this.render());

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    this.el.innerHTML = `
      <nav class="settings-sidebar" aria-label="Settings Categories">
        <button class="settings-nav-item ${this.currentSection === 'general' ? 'active' : ''}" data-section="general">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>${t('settings.general.title')}</span>
        </button>

        <button class="settings-nav-item ${this.currentSection === 'appearance' ? 'active' : ''}" data-section="appearance">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 3v18a9 9 0 0 0 0-18z"/>
          </svg>
          <span>${t('settings.appearance.title')}</span>
        </button>

        <button class="settings-nav-item ${this.currentSection === 'language' ? 'active' : ''}" data-section="language">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span>${t('settings.language.title')}</span>
        </button>

        <button class="settings-nav-item ${this.currentSection === 'privacy' ? 'active' : ''}" data-section="privacy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>${t('settings.privacy.title')}</span>
        </button>

        <button class="settings-nav-item ${this.currentSection === 'about' ? 'active' : ''}" data-section="about">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>${t('settings.about.title')}</span>
        </button>
      </nav>

      <main class="settings-content">
        ${this.renderSectionContent()}
      </main>
    `;

    // Hook nav clicks
    const navItems = this.el.querySelectorAll('.settings-nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const sec = (item as HTMLElement).getAttribute('data-section');
        if (sec) {
          router.navigate(`#/settings/${sec}`);
        }
      });
    });

    this.bindSectionEvents();
  }

  private renderSectionContent(): string {
    const settings = storage.getSettings();

    switch (this.currentSection) {
      case 'general':
        return `
          <div class="settings-section">
            <h2 class="settings-heading">${t('settings.general.title')}</h2>

            <div class="settings-card">
              <div class="settings-row">
                <div>
                  <div style="font-weight: 600; color: var(--text-primary);">${t('settings.general.recentFiles')}</div>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                    ${t('settings.general.recentFilesDesc')}
                  </div>
                </div>
                <input type="checkbox" id="setting-recent-enabled" ${settings.recentFilesEnabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              </div>

              <hr style="border: 0; border-top: 1px solid var(--border);" />

              <div class="settings-row">
                <div>
                  <div style="font-weight: 600; color: var(--text-primary);">${t('settings.general.linkConfirmation')}</div>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                    ${t('settings.general.linkConfirmationDesc')}
                  </div>
                </div>
                <input type="checkbox" id="setting-link-confirm" ${settings.linkConfirmationEnabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
              </div>
            </div>
          </div>
        `;

      case 'appearance': {
        const curTheme = themeManager.getMode();
        return `
          <div class="settings-section">
            <h2 class="settings-heading">${t('settings.appearance.title')}</h2>

            <div class="settings-card">
              <div>
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
                  ${t('settings.appearance.theme')}
                </div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-4);">
                  ${t('settings.appearance.themeDesc')}
                </div>
                <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
                  <button class="btn ${curTheme === 'system' ? 'btn-primary' : 'btn-secondary'} theme-opt-btn" data-theme="system">
                    ${t('settings.appearance.system')}
                  </button>
                  <button class="btn ${curTheme === 'light' ? 'btn-primary' : 'btn-secondary'} theme-opt-btn" data-theme="light">
                    ${t('settings.appearance.light')}
                  </button>
                  <button class="btn ${curTheme === 'dark' ? 'btn-primary' : 'btn-secondary'} theme-opt-btn" data-theme="dark">
                    ${t('settings.appearance.dark')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      case 'language': {
        const curLocale = i18n.getLocale();
        return `
          <div class="settings-section">
            <h2 class="settings-heading">${t('settings.language.title')}</h2>

            <div class="settings-card">
              <div>
                <div style="font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1);">
                  ${t('settings.language.select')}
                </div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-4);">
                  ${t('settings.language.desc')}
                </div>
                <div style="display: flex; flex-direction: column; gap: var(--space-2);">
                  ${SUPPORTED_LOCALES.map(
                    (loc) => `
                    <label class="settings-row" style="padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; background: ${curLocale === loc.code ? 'var(--accent-soft)' : 'var(--bg-surface)'};">
                      <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${loc.nativeName}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${loc.name}</div>
                      </div>
                      <input type="radio" name="langSelection" value="${loc.code}" ${curLocale === loc.code ? 'checked' : ''} class="lang-opt-radio" />
                    </label>
                  `
                  ).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      case 'privacy':
        return `
          <div class="settings-section">
            <h2 class="settings-heading">${t('settings.privacy.title')}</h2>

            <div class="settings-card">
              <div style="font-size: 14px; line-height: 1.6; color: var(--text-secondary);">
                ${t('settings.privacy.statement')}
              </div>
            </div>

            <div class="settings-card">
              <div class="settings-row">
                <div>
                  <div style="font-weight: 600; color: var(--danger);">${t('settings.privacy.clearData')}</div>
                  <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                    ${t('settings.privacy.clearDataDesc')}
                  </div>
                </div>
                <button class="btn btn-danger btn-sm" id="clear-local-data-btn">
                  ${t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        `;

      case 'about':
        return `
          <div class="settings-section">
            <h2 class="settings-heading">${t('settings.about.title')}</h2>

            <div class="settings-card">
              <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">
                ${t('app.title')}
              </div>
              <div style="font-size: 13px; color: var(--text-muted);">
                ${t('settings.about.version')}: 1.0.0 · ${t('settings.about.license')}
              </div>
              <p style="font-size: 14px; line-height: 1.5; color: var(--text-secondary); margin-top: var(--space-2);">
                ${t('settings.about.description')}
              </p>
              <div style="margin-top: var(--space-2);">
                <a href="https://github.com/yapweijun1996/PWA-Excel-Viewer" target="_blank" rel="noopener noreferrer" style="font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">
                  <span>${t('settings.about.github')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        `;

      default:
        return `<div>Select a setting category</div>`;
    }
  }

  private bindSectionEvents(): void {
    // General section
    const recentBox = this.el.querySelector('#setting-recent-enabled') as HTMLInputElement;
    if (recentBox) {
      recentBox.addEventListener('change', () => {
        storage.saveSettings({ recentFilesEnabled: recentBox.checked });
      });
    }

    const linkConfirmBox = this.el.querySelector('#setting-link-confirm') as HTMLInputElement;
    if (linkConfirmBox) {
      linkConfirmBox.addEventListener('change', () => {
        storage.saveSettings({ linkConfirmationEnabled: linkConfirmBox.checked });
      });
    }

    // Appearance section
    const themeButtons = this.el.querySelectorAll('.theme-opt-btn');
    themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = (btn as HTMLElement).getAttribute('data-theme') as ThemeMode;
        if (m) themeManager.setMode(m);
      });
    });

    // Language section
    const langRadios = this.el.querySelectorAll('.lang-opt-radio');
    langRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        const val = (radio as HTMLInputElement).value as SupportedLocale;
        i18n.setLocale(val);
      });
    });

    // Privacy section
    const clearBtn = this.el.querySelector('#clear-local-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (window.confirm(t('settings.privacy.clearConfirm'))) {
          storage.clearAllData();
          showToast(t('settings.privacy.dataCleared'));
        }
      });
    }
  }
}
