import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from '../../src/core/storage';
import { I18nEngine } from '../../src/core/i18n';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    storage = new StorageManager();
    storage.clearAllData();
  });

  it('provides default settings and updates correctly', () => {
    const settings = storage.getSettings();
    expect(settings.theme).toBe('system');
    expect(settings.locale).toBe('en-SG');
    expect(settings.recentFilesEnabled).toBe(true);

    storage.saveSettings({ theme: 'dark', locale: 'ja-JP' });
    const updated = storage.getSettings();
    expect(updated.theme).toBe('dark');
    expect(updated.locale).toBe('ja-JP');
  });

  it('adds, limits, and clears recent files metadata', () => {
    storage.addRecentFile({ name: 'file1.xlsx', size: 1024, type: 'XLSX' });
    storage.addRecentFile({ name: 'file2.csv', size: 2048, type: 'CSV' });

    const recents = storage.getRecentFiles();
    expect(recents.length).toBe(2);
    expect(recents[0]?.name).toBe('file2.csv');

    storage.removeRecentFile('file1.xlsx');
    expect(storage.getRecentFiles().length).toBe(1);

    storage.clearAllData();
    expect(storage.getRecentFiles().length).toBe(0);
  });
});

describe('I18nEngine', () => {
  let engine: I18nEngine;

  beforeEach(() => {
    engine = new I18nEngine();
  });

  it('translates strings with interpolation and fallbacks', () => {
    expect(engine.t('home.openSpreadsheet')).toBe('Open Spreadsheet');
    expect(engine.t('inspector.selectedCells', { count: 12 })).toBe('12 cells selected');

    engine.setLocale('zh-Hans');
    expect(engine.t('home.openSpreadsheet')).toBe('打开电子表格');
    expect(engine.t('inspector.selectedCells', { count: 5 })).toBe('已选定 5 个单元格');
  });
});
