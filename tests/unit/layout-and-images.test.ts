import { describe, it, expect, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { SheetJSAdapter } from '../../src/worker/sheetjs-adapter';

describe('Layout Fidelity & Image Extraction', () => {
  let adapter: SheetJSAdapter;

  beforeEach(() => {
    adapter = new SheetJSAdapter();
  });

  it('preserves custom column widths and row heights from workbook', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Header 1', 'Header 2', 'Header 3'],
      ['Short', 'Medium column with content', 'Large'],
    ]);

    // Define custom column widths (e.g. Col 0: 60px, Col 1: 220px, Col 2: 120px)
    ws['!cols'] = [
      { wpx: 60 },
      { wpx: 220 },
      { wpx: 120 },
    ];

    // Define custom row heights
    ws['!rows'] = [
      { hpx: 40 },
      { hpx: 28 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'LayoutSheet');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const summary = adapter.open(buffer, 'layout-test.xlsx', buffer.byteLength);
    const sheet = summary.sheets[0]!;

    expect(sheet.colWidths[0]).toBe(60);
    expect(sheet.colWidths[1]).toBe(220);
    expect(sheet.colWidths[2]).toBe(120);

    expect(sheet.rowHeights[0]).toBe(40);
    expect(sheet.rowHeights[1]).toBe(28);

    adapter.close();
  });

  it('extracts merged cells range definitions', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Company Quarterly Financial Report', null, null, null],
      ['Q1', 'Q2', 'Q3', 'Q4'],
    ]);

    // Merge A1:D1
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Financials');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const summary = adapter.open(buffer, 'merge-test.xlsx', buffer.byteLength);
    const sheet = summary.sheets[0]!;

    expect(sheet.merges.length).toBe(1);
    expect(sheet.merges[0]?.s).toEqual({ r: 0, c: 0 });
    expect(sheet.merges[0]?.e).toEqual({ r: 0, c: 3 });

    const vp = adapter.getViewport(0, 0, 1, 0, 3);
    expect(vp.merges.length).toBe(1);
    expect(vp.cells['0,0']?.v).toBe('Company Quarterly Financial Report');

    adapter.close();
  });

  it('accurately parses and renders real-world workbook TSK-32232_CSD_-_Repair_Analysis.xlsx', () => {
    const fs = require('fs');
    const path = require('path');
    let filePath = path.resolve(__dirname, '../fixtures/TSK-32232_CSD_-_Repair_Analysis.xlsx');
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(__dirname, '../../TSK-32232_CSD_-_Repair_Analysis.xlsx');
    }
    if (!fs.existsSync(filePath)) return;

    const buffer = fs.readFileSync(filePath);
    const summary = adapter.open(buffer, 'TSK-32232_CSD_-_Repair_Analysis.xlsx', buffer.length);

    expect(summary.sheetCount).toBe(4);
    expect(summary.sheets[0]?.name).toBe('Prelim & Logic');
    expect(summary.sheets[1]?.name).toBe('Repair Analysis Report');
    expect(summary.sheets[2]?.name).toBe('Defects Classification Analysis');
    expect(summary.sheets[3]?.name).toBe('Packer Usage Analysis');

    // Verify Sheet 2 (Repair Analysis Report) layout
    const s2 = summary.sheets[1]!;
    expect(s2.merges.length).toBe(27);
    expect(s2.colWidths[1]).toBeGreaterThanOrEqual(180); // Main Contractor
    expect(s2.colWidths[12]).toBeGreaterThanOrEqual(180); // Last Date of Concrete Supply

    // Verify Sheet 3 (Defects Classification Analysis) has 2 chart drawings
    const s3 = summary.sheets[2]!;
    expect(s3.drawings.length).toBe(2);
    expect(s3.drawings[0]?.type).toBe('chart');
    expect(s3.drawings[0]?.chartTitle).toContain('Defects Classification');
    expect(s3.drawings[0]?.svgContent).toBeTruthy();
    expect(s3.drawings[1]?.type).toBe('chart');
    expect(s3.drawings[1]?.chartType).toBe('pieChart');

    // Verify Sheet 4 (Packer Usage Analysis) has 1 chart drawing
    const s4 = summary.sheets[3]!;
    expect(s4.drawings.length).toBe(1);
    expect(s4.drawings[0]?.type).toBe('chart');
    expect(s4.drawings[0]?.chartTitle).toBe('Total Packer Usage Per Month (2025)');
    expect(s4.drawings[0]?.svgContent).toBeTruthy();

    adapter.close();
  });
});
