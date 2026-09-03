import { storage } from './storage';
import { appEvents } from './event-bus';

export type ThemeMode = 'system' | 'light' | 'dark';

export class ThemeManager {
  private currentMode: ThemeMode = 'system';
  private mediaQuery: MediaQueryList | null = null;
  private metaThemeColor: HTMLMetaElement | null = null;

  init(): void {
    const saved = storage.getSettings().theme;
    this.currentMode = saved || 'system';

    if (typeof window !== 'undefined') {
      this.metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!this.metaThemeColor) {
        this.metaThemeColor = document.createElement('meta');
        this.metaThemeColor.name = 'theme-color';
        document.head.appendChild(this.metaThemeColor);
      }

      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.currentMode === 'system') {
          this.applyTheme();
        }
      });

      this.applyTheme();
    }
  }

  getMode(): ThemeMode {
    return this.currentMode;
  }

  setMode(mode: ThemeMode): void {
    this.currentMode = mode;
    storage.saveSettings({ theme: mode });
    this.applyTheme();
    appEvents.emit('theme:changed', mode);
  }

  private applyTheme(): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', this.currentMode);

    const isDark =
      this.currentMode === 'dark' ||
      (this.currentMode === 'system' && this.mediaQuery?.matches);

    if (this.metaThemeColor) {
      this.metaThemeColor.content = isDark ? '#111512' : '#f6f7f8';
    }
  }
}

export const themeManager = new ThemeManager();
