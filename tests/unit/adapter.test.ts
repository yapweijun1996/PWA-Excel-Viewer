import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { SheetJSAdapter } from '../../src/worker/sheetjs-adapter';

describe('SheetJSAdapter', () => {
  let adapter: SheetJSAdapter;

  beforeEach(() => {
    adapter = new SheetJSAdapter();
  });

  it('correctly opens a multi-sheet workbook and extracts summaries', () => {
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Product', 'Price', 'Qty', 'Total'],
      ['Widget A', 10.5, 2, null],
      ['Widget B', 25.0, 4, null],
    ]);
    ws1['D2'] = { t: 'n', f: 'B2*C2', v: 21 };
    ws1['D3'] = { t: 'n', f: 'B3*C3', v: 100 };
    // Add a hyperlink
    ws1['A2'].l = { Target: 'https://example.com/widget-a', Tooltip: 'Widget A Link' };
    // Add a comment
    ws1['B2'].c = [{ t: 'Price is before discount' }];

    XLSX.utils.book_append_sheet(wb, ws1, 'Sales');

    const ws2Data = [
      ['Customer', 'Country'],
      ['Acme Corp', 'Singapore'],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    XLSX.utils.book_append_sheet(wb, ws2, 'Customers');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const summary = adapter.open(buffer, 'test-sales.xlsx', buffer.byteLength);

    expect(summary.filename).toBe('test-sales.xlsx');
    expect(summary.sheetCount).toBe(2);
    expect(summary.sheets[0]?.name).toBe('Sales');
    expect(summary.sheets[1]?.name).toBe('Customers');
    expect(summary.totalFormulas).toBe(2);
    expect(summary.totalLinks).toBe(1);

    // Verify viewport slicing
    const vp = adapter.getViewport(0, 0, 2, 0, 3);
    expect(vp.sheetIndex).toBe(0);
    expect(vp.cells['0,0']?.v).toBe('Product');
    expect(vp.cells['1,0']?.l?.target).toBe('https://example.com/widget-a');
    expect(vp.cells['1,1']?.c).toBe('Price is before discount');
    expect(vp.cells['1,3']?.f).toBe('B2*C2');

    // Verify search
    const results = adapter.search('Singapore');
    expect(results.length).toBe(1);
    expect(results[0]?.sheetName).toBe('Customers');
    expect(results[0]?.address).toBe('B2');

    // Search formula
    const formulaResults = adapter.search('B2*C2');
    expect(formulaResults.length).toBe(1);
    expect(formulaResults[0]?.isFormula).toBe(true);

    adapter.close();
  });

  it('correctly opens CSV and TSV formats', () => {
    const csvContent = 'ID,Name,Department\n1,Alice,Engineering\n2,Bob,Finance\n3,Charlie,Marketing';
    const csvBuffer = new TextEncoder().encode(csvContent).buffer;

    const summary = adapter.open(csvBuffer, 'employees.csv', csvBuffer.byteLength);
    expect(summary.sheetCount).toBe(1);
    expect(summary.sheets[0]?.rowCount).toBe(4);
    expect(summary.sheets[0]?.colCount).toBe(3);

    const vp = adapter.getViewport(0, 0, 3, 0, 2);
    expect(vp.cells['0,0']?.v).toBe('ID');
    expect(vp.cells['1,1']?.v).toBe('Alice');
    expect(vp.cells['3,2']?.v).toBe('Marketing');

    adapter.close();
  });
});
