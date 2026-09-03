import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';

import { themeManager } from './core/theme';
import { i18n } from './core/i18n';
import { router } from './core/router';
import { session } from './core/session';
import { appEvents } from './core/event-bus';
import { pwaService } from './services/pwa-service';

import { TopbarComponent } from './components/topbar';
import { HomeView } from './components/home/home-view';
import { ViewerView } from './components/viewer/viewer-view';
import { SettingsShellComponent } from './components/settings/settings-shell';

import { SearchModal } from './components/dialogs/search-modal';
import { GotoModal } from './components/dialogs/goto-modal';
import { WarningsModal } from './components/dialogs/warnings-modal';
import { ExternalLinkModal } from './components/dialogs/external-link';
import { UpdatePromptModal } from './components/dialogs/update-prompt';

class App {
  private appEl: HTMLElement;
  private topbar: TopbarComponent;
  private mainEl: HTMLElement;
  private homeView: HomeView;
  private viewerView: ViewerView;
  private settingsShell: SettingsShellComponent;

  private searchModal: SearchModal;
  private gotoModal: GotoModal;
  private warningsModal: WarningsModal;
  private externalLinkModal: ExternalLinkModal;
  private updatePromptModal: UpdatePromptModal;

  constructor() {
    this.appEl = document.getElementById('app') || document.body;

    // 1. Initialize core systems
    themeManager.init();
    i18n.init();

    // 2. Instantiate components
    this.topbar = new TopbarComponent();
    this.mainEl = document.createElement('main');
    this.mainEl.className = 'app-main';

    this.homeView = new HomeView();
    this.viewerView = new ViewerView();
    this.settingsShell = new SettingsShellComponent();

    // Modals
    this.searchModal = new SearchModal();
    this.gotoModal = new GotoModal();
    this.warningsModal = new WarningsModal();
    this.externalLinkModal = new ExternalLinkModal();
    this.updatePromptModal = new UpdatePromptModal();
    this.updatePromptModal.setUpdateCallback(() => pwaService.applyUpdate());

    // 3. Assemble DOM tree
    this.appEl.innerHTML = '';
    this.appEl.appendChild(this.topbar.getElement());

    this.mainEl.appendChild(this.homeView.getElement());
    this.mainEl.appendChild(this.viewerView.getElement());
    this.mainEl.appendChild(this.settingsShell.getElement());
    this.appEl.appendChild(this.mainEl);

    // Modals container
    this.appEl.appendChild(this.searchModal.getElement());
    this.appEl.appendChild(this.gotoModal.getElement());
    this.appEl.appendChild(this.warningsModal.getElement());
    this.appEl.appendChild(this.externalLinkModal.getElement());
    this.appEl.appendChild(this.updatePromptModal.getElement());

    // 4. Listen to route changes
    appEvents.on('route:changed', (route) => {
      this.updateView(route.path);
    });

    // 5. Connect PWA & File Handlers
    pwaService.init();

    // 6. Start Router
    router.init();
  }

  private updateView(path: string): void {
    const homeEl = this.homeView.getElement();
    const viewerEl = this.viewerView.getElement();
    const settingsEl = this.settingsShell.getElement();

    homeEl.style.display = 'none';
    viewerEl.style.display = 'none';
    settingsEl.style.display = 'none';

    if (path.startsWith('#/settings')) {
      settingsEl.style.display = 'flex';
    } else if (path.startsWith('#/viewer')) {
      if (session.workbook) {
        viewerEl.style.display = 'flex';
      } else {
        // Fallback to home if no workbook loaded
        router.navigate('#/');
      }
    } else {
      homeEl.style.display = 'flex';
    }
  }
}

// Bootstrap application on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new App();
  });
}
