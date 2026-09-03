import { appEvents } from './event-bus';

export interface RouteMatch {
  path: string;
  section?: string;
}

export class HashRouter {
  init(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => this.handleHashChange());
      this.handleHashChange();
    }
  }

  getRoute(): RouteMatch {
    const raw = (window.location.hash || '#/').trim();
    if (raw.startsWith('#/settings/')) {
      const section = raw.replace('#/settings/', '').split('?')[0] || 'general';
      return { path: '#/settings', section };
    }
    if (raw.startsWith('#/viewer')) {
      return { path: '#/viewer' };
    }
    return { path: '#/' };
  }

  navigate(path: string): void {
    if (window.location.hash !== path) {
      window.location.hash = path;
    } else {
      this.handleHashChange();
    }
  }

  private handleHashChange(): void {
    const route = this.getRoute();
    appEvents.emit('route:changed', route);
  }
}

export const router = new HashRouter();
