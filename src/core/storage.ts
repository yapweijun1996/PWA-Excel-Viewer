export interface RecentFileMeta {
  name: string;
  size: number;
  type: string;
  lastOpened: number;
}

export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  locale: 'en-SG' | 'zh-Hans' | 'ms-MY' | 'ja-JP' | 'vi-VN';
  recentFilesEnabled: boolean;
  linkConfirmationEnabled: boolean;
}

const STORAGE_KEYS = {
  SETTINGS: 'piev_settings_v1',
  RECENT_FILES: 'piev_recent_files_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  locale: 'en-SG',
  recentFilesEnabled: true,
  linkConfirmationEnabled: true,
};

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

export class StorageManager {
  private memStorage = new Map<string, string>();

  private getItem(key: string): string | null {
    const s = getStorage();
    if (s) {
      try {
        return s.getItem(key);
      } catch {
        // fallback
      }
    }
    return this.memStorage.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    const s = getStorage();
    if (s) {
      try {
        s.setItem(key, value);
        return;
      } catch {
        // fallback
      }
    }
    this.memStorage.set(key, value);
  }

  private removeItem(key: string): void {
    const s = getStorage();
    if (s) {
      try {
        s.removeItem(key);
        return;
      } catch {
        // fallback
      }
    }
    this.memStorage.delete(key);
  }

  getSettings(): UserSettings {
    try {
      const raw = this.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(patch: Partial<UserSettings>): UserSettings {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...patch };
      this.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
      return { ...DEFAULT_SETTINGS, ...patch };
    }
  }

  getRecentFiles(): RecentFileMeta[] {
    const settings = this.getSettings();
    if (!settings.recentFilesEnabled) return [];
    try {
      const raw = this.getItem(STORAGE_KEYS.RECENT_FILES);
      if (!raw) return [];
      const list = JSON.parse(raw) as RecentFileMeta[];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  addRecentFile(meta: Omit<RecentFileMeta, 'lastOpened'>): void {
    const settings = this.getSettings();
    if (!settings.recentFilesEnabled) return;

    try {
      const list = this.getRecentFiles().filter(item => item.name !== meta.name);
      list.unshift({
        ...meta,
        lastOpened: Date.now(),
      });
      // Keep max 10 items
      const trimmed = list.slice(0, 10);
      this.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to update recent files', e);
    }
  }

  removeRecentFile(name: string): void {
    try {
      const list = this.getRecentFiles().filter(item => item.name !== name);
      this.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to remove recent file', e);
    }
  }

  clearRecentFiles(): void {
    try {
      this.removeItem(STORAGE_KEYS.RECENT_FILES);
    } catch (e) {
      console.warn('Failed to clear recent files', e);
    }
  }

  clearAllData(): void {
    try {
      this.removeItem(STORAGE_KEYS.SETTINGS);
      this.removeItem(STORAGE_KEYS.RECENT_FILES);
      this.memStorage.clear();
    } catch (e) {
      console.warn('Failed to clear local data', e);
    }
  }
}

export const storage = new StorageManager();
