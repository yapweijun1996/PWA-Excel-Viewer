import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { SheetJSAdapter } from '../../src/worker/sheetjs-adapter';

describe('Format Support & Regression Tests', () => {
  let adapter: SheetJSAdapter;

  beforeEach(() => {
    adapter = new SheetJSAdapter();
  });

  it('handles ODS format correctly', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Project', 'Status'],
      ['Apollo', 'Completed'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'ods' });
    const summary = adapter.open(buffer, 'projects.ods', buffer.byteLength);

    expect(summary.sheetCount).toBe(1);
    expect(summary.sheets[0]?.name).toBe('Projects');

    const vp = adapter.getViewport(0, 0, 1, 0, 1);
    expect(vp.cells['1,0']?.v).toBe('Apollo');
    expect(vp.cells['1,1']?.v).toBe('Completed');

    adapter.close();
  });

  it('handles CSV with CJK text correctly', () => {
    const cjkCsv = '客户,国家,销售额\n丰田汽车,日本,1500000\n现代汽车,韩国,850000\n越捷航空,越南,420000';
    const buffer = new TextEncoder().encode(cjkCsv).buffer;

    const summary = adapter.open(buffer, 'cjk-data.csv', buffer.byteLength);
    expect(summary.sheetCount).toBe(1);
    expect(summary.sheets[0]?.rowCount).toBe(4);

    const vp = adapter.getViewport(0, 0, 3, 0, 2);
    expect(vp.cells['0,0']?.v).toBe('客户');
    expect(vp.cells['1,0']?.v).toBe('丰田汽车');
    expect(vp.cells['1,1']?.v).toBe('日本');
    expect(vp.cells['3,0']?.v).toBe('越捷航空');

    // Search CJK characters
    const results = adapter.search('越南');
    expect(results.length).toBe(1);
    expect(results[0]?.address).toBe('B4');

    adapter.close();
  });

  it('efficiently parses and virtualizes a large spreadsheet (5,000 rows x 10 columns = 50,000 cells)', () => {
    const rows: (string | number)[][] = [];
    rows.push(['ID', 'Name', 'Val1', 'Val2', 'Val3', 'Val4', 'Val5', 'Val6', 'Val7', 'Val8']);

    for (let i = 1; i <= 5000; i++) {
      rows.push([i, `User_${i}`, i * 2, i * 3, i * 4, i * 5, i * 6, i * 7, i * 8, i * 9]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'StressSheet');

    const start = performance.now();
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const summary = adapter.open(buffer, 'stress.xlsx', buffer.byteLength);
    const parseTime = performance.now() - start;

    expect(summary.sheets[0]?.rowCount).toBe(5001);
    expect(summary.sheets[0]?.colCount).toBe(10);
    expect(summary.totalCells).toBe(50010);
    expect(parseTime).toBeLessThan(5000); // Must be reasonable

    // Viewport fetch at row 2500
    const vpStart = performance.now();
    const vp = adapter.getViewport(0, 2500, 2530, 0, 5);
    const vpTime = performance.now() - vpStart;

    expect(vpTime).toBeLessThan(50); // Viewport fetch must be sub-50ms
    expect(vp.cells['2500,1']?.v).toBe('User_2500');

    adapter.close();
  });
});
