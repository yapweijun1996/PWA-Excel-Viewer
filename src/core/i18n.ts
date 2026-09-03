import { storage } from './storage';
import { appEvents } from './event-bus';

import enSG from '../../public/locales/en-SG.json';
import zhHans from '../../public/locales/zh-Hans.json';
import msMY from '../../public/locales/ms-MY.json';
import jaJP from '../../public/locales/ja-JP.json';
import viVN from '../../public/locales/vi-VN.json';

export type SupportedLocale = 'en-SG' | 'zh-Hans' | 'ms-MY' | 'ja-JP' | 'vi-VN';

export const SUPPORTED_LOCALES: { code: SupportedLocale; name: string; nativeName: string }[] = [
  { code: 'en-SG', name: 'English (Singapore)', nativeName: 'English' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ms-MY', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
];

const BUNDLES: Record<SupportedLocale, Record<string, any>> = {
  'en-SG': enSG,
  'zh-Hans': zhHans,
  'ms-MY': msMY,
  'ja-JP': jaJP,
  'vi-VN': viVN,
};

export class I18nEngine {
  private currentLocale: SupportedLocale = 'en-SG';

  init(): void {
    const saved = storage.getSettings().locale;
    if (saved && BUNDLES[saved]) {
      this.currentLocale = saved;
    }
  }

  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  setLocale(locale: SupportedLocale): void {
    if (!BUNDLES[locale]) {
      console.warn(`Unsupported locale: ${locale}`);
      return;
    }
    this.currentLocale = locale;
    storage.saveSettings({ locale });
    document.documentElement.lang = locale;
    appEvents.emit('locale:changed', locale);
  }

  t(key: string, params?: Record<string, string | number>): string {
    let template = this.resolveKey(this.currentLocale, key);
    if (!template && this.currentLocale !== 'en-SG') {
      template = this.resolveKey('en-SG', key);
    }
    if (!template) {
      console.warn(`Missing translation key: "${key}"`);
      return key;
    }

    if (params) {
      return template.replace(/\{(\w+)\}/g, (_, pName) => {
        return params[pName] !== undefined ? String(params[pName]) : `{${pName}}`;
      });
    }

    return template;
  }

  private resolveKey(locale: SupportedLocale, keyPath: string): string | null {
    const bundle = BUNDLES[locale];
    if (!bundle) return null;

    const parts = keyPath.split('.');
    let cur: any = bundle;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) {
        cur = cur[part];
      } else {
        return null;
      }
    }

    return typeof cur === 'string' ? cur : null;
  }
}

export const i18n = new I18nEngine();
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);
