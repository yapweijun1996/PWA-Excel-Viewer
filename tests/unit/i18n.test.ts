import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(getKeys(val as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe('i18n catalogs', () => {
  const locales = ['en-SG', 'zh-Hans', 'ms-MY', 'ja-JP', 'vi-VN'];
  const localeData: Record<string, string[]> = {};

  beforeAll(() => {
    for (const loc of locales) {
      const p = path.resolve(__dirname, `../../public/locales/${loc}.json`);
      const content = JSON.parse(fs.readFileSync(p, 'utf-8'));
      localeData[loc] = getKeys(content);
    }
  });

  it('all locales have matching key set with canonical en-SG', () => {
    const canonical = localeData['en-SG']!;
    expect(canonical.length).toBeGreaterThan(40);

    for (const loc of locales) {
      if (loc === 'en-SG') continue;
      const target = localeData[loc]!;
      expect(target).toEqual(canonical);
    }
  });
});
