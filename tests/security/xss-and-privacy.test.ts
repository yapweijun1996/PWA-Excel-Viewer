import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { SheetJSAdapter } from '../../src/worker/sheetjs-adapter';
import { linkSanitizer } from '../../src/services/link-sanitizer';

describe('Security & Privacy Invariants', () => {
  let adapter: SheetJSAdapter;

  beforeEach(() => {
    adapter = new SheetJSAdapter();
  });

  it('safely handles malicious XSS strings in cell content without HTML injection', () => {
    const wb = XLSX.utils.book_new();
    const maliciousStrings = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="window.pwned=true">',
      '<svg onload="alert(1)">',
      '<a href="javascript:alert(1)">click me</a>',
    ];

    const ws = XLSX.utils.aoa_to_sheet([
      ['Payload'],
      ...maliciousStrings.map((s) => [s]),
    ]);

    // Add dangerous hyperlink
    ws['A2'].l = { Target: 'javascript:alert("pwned")' };

    XLSX.utils.book_append_sheet(wb, ws, 'SecurityTest');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const summary = adapter.open(buffer, 'security-test.xlsx', buffer.byteLength);

    expect(summary.sheetCount).toBe(1);

    const vp = adapter.getViewport(0, 0, 4, 0, 0);
    expect(vp.cells['1,0']?.v).toBe('<script>alert("XSS")</script>');
    expect(vp.cells['2,0']?.v).toBe('<img src="x" onerror="window.pwned=true">');

    // Link sanitizer verification on cell's link
    const linkCheck = linkSanitizer.checkLink(vp.cells['1,0']?.l?.target || '');
    expect(linkCheck.allowed).toBe(false);
    expect(linkCheck.reason).toBe('blocked_scheme');

    adapter.close();
  });

  it('ensures zero outbound network requests during spreadsheet inspection (privacy promise)', () => {
    const fetchSpy = vi.fn();
    (globalThis as any).fetch = fetchSpy;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Confidential Customer', 'Secret Revenue', 'Internal SSN'],
      ['Acme Corp', '$5,000,000', '123-45-6789'],
      ['Gov Entity', '$12,000,000', '987-65-4321'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'ConfidentialData');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // Open, view, search, and inspect
    adapter.open(buffer, 'financials-confidential.xlsx', buffer.byteLength);
    adapter.getViewport(0, 0, 2, 0, 2);
    adapter.search('Confidential');
    adapter.getCell(0, 1, 1);
    adapter.close();

    // Verify no network fetch was ever invoked
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
