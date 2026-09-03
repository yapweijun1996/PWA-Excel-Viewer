import { t } from '../../core/i18n';
import { router } from '../../core/router';
import { DropzoneComponent } from './dropzone';
import { RecentListComponent } from './recent-list';
import { appEvents } from '../../core/event-bus';

export class HomeView {
  private el: HTMLElement;
  private dropzone: DropzoneComponent;
  private recentList: RecentListComponent;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'home-screen';

    this.dropzone = new DropzoneComponent();
    this.recentList = new RecentListComponent();

    appEvents.on('locale:changed', () => this.render());

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    this.el.innerHTML = `
      <div class="home-container">
        <div class="home-header">
          <h1 class="home-title">${t('app.title')}</h1>
          <p class="home-subtitle">${t('app.subtitle')}</p>
        </div>
        <div id="dropzone-slot"></div>
        <div class="privacy-banner">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>${t('home.privacyNotice')}</span>
          </div>
          <button class="btn btn-ghost btn-sm" id="learn-privacy-btn" style="font-size: 13px;">
            ${t('home.learnPrivacy')} ›
          </button>
        </div>
        <div id="recent-slot"></div>
      </div>
    `;

    const dropSlot = this.el.querySelector('#dropzone-slot');
    if (dropSlot) dropSlot.appendChild(this.dropzone.getElement());

    const recentSlot = this.el.querySelector('#recent-slot');
    if (recentSlot) recentSlot.appendChild(this.recentList.getElement());

    const privacyBtn = this.el.querySelector('#learn-privacy-btn');
    if (privacyBtn) {
      privacyBtn.addEventListener('click', () => {
        router.navigate('#/settings/privacy');
      });
    }
  }
}
