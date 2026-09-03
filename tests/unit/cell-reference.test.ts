import { describe, it, expect } from 'vitest';
import {
  colNameToIndex,
  indexToColName,
  parseCellReference,
  encodeAddress,
} from '../../src/utils/cell-reference';

describe('Cell Reference Utils', () => {
  it('converts column names to indices and back', () => {
    expect(colNameToIndex('A')).toBe(0);
    expect(colNameToIndex('Z')).toBe(25);
    expect(colNameToIndex('AA')).toBe(26);
    expect(colNameToIndex('AB')).toBe(27);
    expect(colNameToIndex('ZZ')).toBe(701);

    expect(indexToColName(0)).toBe('A');
    expect(indexToColName(25)).toBe('Z');
    expect(indexToColName(26)).toBe('AA');
    expect(indexToColName(701)).toBe('ZZ');
  });

  it('encodes address correctly', () => {
    expect(encodeAddress(0, 0)).toBe('A1');
    expect(encodeAddress(127, 5)).toBe('F128');
  });

  it('parses valid cell references', () => {
    const a1 = parseCellReference('A1');
    expect(a1).toEqual({ sheetName: undefined, address: 'A1', col: 0, row: 0 });

    const f128 = parseCellReference('F128');
    expect(f128).toEqual({ sheetName: undefined, address: 'F128', col: 5, row: 127 });

    const qualified = parseCellReference('Sales!B42');
    expect(qualified).toEqual({ sheetName: 'Sales', address: 'B42', col: 1, row: 41 });

    const quoted = parseCellReference("'Sales 2026'!C10");
    expect(quoted).toEqual({ sheetName: 'Sales 2026', address: 'C10', col: 2, row: 9 });
  });

  it('rejects invalid cell references', () => {
    expect(parseCellReference('')).toBeNull();
    expect(parseCellReference('123')).toBeNull();
    expect(parseCellReference('ABC')).toBeNull();
    expect(parseCellReference('A0')).toBeNull();
    expect(parseCellReference('A-5')).toBeNull();
  });
});
