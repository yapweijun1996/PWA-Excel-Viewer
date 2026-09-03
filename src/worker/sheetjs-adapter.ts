import * as XLSX from 'xlsx';
import {
  CellData,
  SheetSummary,
  WorkbookSummary,
  ViewportData,
  SearchResult,
} from './protocol';

export class SheetJSAdapter {
  private wb: XLSX.WorkBook | null = null;
  private filename = '';
  private fileSize = 0;
  private fileType = '';

  open(buffer: ArrayBuffer, filename: string, fileSize: number): WorkbookSummary {
    this.filename = filename;
    this.fileSize = fileSize;
    this.fileType = filename.split('.').pop()?.toUpperCase() || 'FILE';

    // Parse array buffer safely without executing scripts
    this.wb = XLSX.read(buffer, {
      type: 'array',
      cellFormula: true,
      cellHTML: false,
      cellNF: true,
      cellStyles: false,
      bookVBA: true,
      dense: false,
      codepage: 65001,
    });

    return this.getWorkbookSummary();
  }

  close(): void {
    this.wb = null;
  }

  getWorkbookSummary(): WorkbookSummary {
    if (!this.wb) throw new Error('No workbook open');

    const sheetNames = this.wb.SheetNames;
    const sheets: SheetSummary[] = [];
    let totalCells = 0;
    let totalFormulas = 0;
    let totalLinks = 0;
    let totalMerges = 0;
    let hiddenSheetCount = 0;

    const wbSheetsMeta = (this.wb.Workbook?.Sheets as any[]) || [];

    for (let i = 0; i < sheetNames.length; i++) {
      const name = sheetNames[i]!;
      const ws = this.wb.Sheets[name];
      const meta = wbSheetsMeta[i];

      let hidden: 'visible' | 'hidden' | 'veryHidden' = 'visible';
      if (meta) {
        if (meta.Hidden === 1) {
          hidden = 'hidden';
          hiddenSheetCount++;
        } else if (meta.Hidden === 2) {
          hidden = 'veryHidden';
          hiddenSheetCount++;
        }
      }

      let rowCount = 0;
      let colCount = 0;
      let startRow = 0;
      let startCol = 0;
      let endRow = 0;
      let endCol = 0;
      let sheetCellCount = 0;

      if (ws && ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        startRow = range.s.r;
        startCol = range.s.c;
        endRow = range.e.r;
        endCol = range.e.c;
        rowCount = Math.max(0, endRow - startRow + 1);
        colCount = Math.max(0, endCol - startCol + 1);

        // Count cells, formulas, links, merges
        const keys = Object.keys(ws);
        for (const key of keys) {
          if (key.startsWith('!')) continue;
          sheetCellCount++;
          const cell = ws[key];
          if (cell) {
            if (cell.f) totalFormulas++;
            if (cell.l && cell.l.Target) totalLinks++;
          }
        }

        if (ws['!merges']) {
          totalMerges += ws['!merges'].length;
        }
      }

      totalCells += sheetCellCount;

      sheets.push({
        name,
        index: i,
        hidden,
        rowCount,
        colCount,
        startRow,
        startCol,
        endRow,
        endCol,
        cellCount: sheetCellCount,
      });
    }

    const hasMacros = Boolean((this.wb as any).vbaraw) || this.fileType === 'XLSM';
    const macroCount = hasMacros ? 1 : 0;

    const warnings: string[] = [];
    if (hasMacros) {
      warnings.push('macros');
    }
    if (hiddenSheetCount > 0) {
      warnings.push('hiddenSheets');
    }
    if (totalLinks > 0) {
      warnings.push('externalLinks');
    }

    return {
      filename: this.filename,
      fileSize: this.fileSize,
      fileType: this.fileType,
      sheetCount: sheetNames.length,
      sheets,
      hasMacros,
      macroCount,
      hiddenSheetCount,
      totalCells,
      totalFormulas,
      totalLinks,
      totalMerges,
      warnings,
    };
  }

  getSheetSummary(sheetIndex: number): SheetSummary {
    const summary = this.getWorkbookSummary();
    const sheet = summary.sheets[sheetIndex];
    if (!sheet) throw new Error(`Sheet index out of range: ${sheetIndex}`);
    return sheet;
  }

  getViewport(
    sheetIndex: number,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): ViewportData {
    if (!this.wb) throw new Error('No workbook open');
    const name = this.wb.SheetNames[sheetIndex];
    if (!name) throw new Error(`Sheet not found at index ${sheetIndex}`);

    const ws = this.wb.Sheets[name] || {};
    const cells: Record<string, CellData> = {};

    const colWidths: Record<number, number> = {};
    if (ws['!cols']) {
      for (let c = startCol; c <= endCol; c++) {
        const colInfo = ws['!cols'][c];
        if (colInfo) {
          if (colInfo.wpx) {
            colWidths[c] = colInfo.wpx;
          } else if (colInfo.width) {
            colWidths[c] = Math.round(colInfo.width * 8);
          }
        }
      }
    }

    const rowHeights: Record<number, number> = {};
    if (ws['!rows']) {
      for (let r = startRow; r <= endRow; r++) {
        const rowInfo = ws['!rows'][r];
        if (rowInfo) {
          if (rowInfo.hpx) {
            rowHeights[r] = rowInfo.hpx;
          } else if (rowInfo.hpt) {
            rowHeights[r] = Math.round(rowInfo.hpt * 1.33);
          }
        }
      }
    }

    // Extract cell data in bounding box
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (cell) {
          let comment: string | undefined;
          if (cell.c) {
            if (Array.isArray(cell.c)) {
              comment = cell.c.map((item: any) => item.t || item).join('\n');
            } else if (typeof cell.c === 'object') {
              comment = cell.c.t || JSON.stringify(cell.c);
            } else {
              comment = String(cell.c);
            }
          }

          let link: { target: string; tooltip?: string } | undefined;
          if (cell.l && cell.l.Target) {
            link = { target: cell.l.Target, tooltip: cell.l.Tooltip };
          }

          cells[`${r},${c}`] = {
            address: addr,
            row: r,
            col: c,
            v: cell.v,
            w: cell.w != null ? String(cell.w) : (cell.v != null ? String(cell.v) : ''),
            t: cell.t || 's',
            f: cell.f,
            c: comment,
            l: link,
          };
        }
      }
    }

    const merges = (ws['!merges'] || []).map((m: XLSX.Range) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));

    return {
      sheetIndex,
      startRow,
      endRow,
      startCol,
      endCol,
      cells,
      merges,
      colWidths,
      rowHeights,
    };
  }

  getCell(sheetIndex: number, r: number, c: number): CellData | null {
    if (!this.wb) return null;
    const name = this.wb.SheetNames[sheetIndex];
    if (!name) return null;
    const ws = this.wb.Sheets[name];
    if (!ws) return null;

    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = ws[addr];
    if (!cell) {
      return {
        address: addr,
        row: r,
        col: c,
        v: '',
        w: '',
        t: 'z',
      };
    }

    let comment: string | undefined;
    if (cell.c) {
      if (Array.isArray(cell.c)) {
        comment = cell.c.map((item: any) => item.t || item).join('\n');
      } else if (typeof cell.c === 'object') {
        comment = cell.c.t || JSON.stringify(cell.c);
      } else {
        comment = String(cell.c);
      }
    }

    let link: { target: string; tooltip?: string } | undefined;
    if (cell.l && cell.l.Target) {
      link = { target: cell.l.Target, tooltip: cell.l.Tooltip };
    }

    return {
      address: addr,
      row: r,
      col: c,
      v: cell.v,
      w: cell.w != null ? String(cell.w) : (cell.v != null ? String(cell.v) : ''),
      t: cell.t || 's',
      f: cell.f,
      c: comment,
      l: link,
    };
  }

  search(
    query: string,
    targetSheetIndex?: number,
    matchCase = false,
    limit = 200
  ): SearchResult[] {
    if (!this.wb || !query) return [];

    const results: SearchResult[] = [];
    const q = matchCase ? query : query.toLowerCase();

    const sheetIndices =
      targetSheetIndex !== undefined
        ? [targetSheetIndex]
        : Array.from({ length: this.wb.SheetNames.length }, (_, i) => i);

    for (const idx of sheetIndices) {
      const sheetName = this.wb.SheetNames[idx];
      if (!sheetName) continue;
      const ws = this.wb.Sheets[sheetName];
      if (!ws) continue;

      const keys = Object.keys(ws);
      for (const key of keys) {
        if (key.startsWith('!')) continue;
        const cell = ws[key];
        if (!cell) continue;

        const valStr = cell.w != null ? String(cell.w) : (cell.v != null ? String(cell.v) : '');
        const formulaStr = cell.f ? String(cell.f) : '';

        const valToTest = matchCase ? valStr : valStr.toLowerCase();
        const formulaToTest = matchCase ? formulaStr : formulaStr.toLowerCase();

        let match = false;
        let isFormula = false;

        if (valToTest.includes(q)) {
          match = true;
        } else if (formulaToTest.includes(q)) {
          match = true;
          isFormula = true;
        }

        if (match) {
          const coord = XLSX.utils.decode_cell(key);
          results.push({
            sheetIndex: idx,
            sheetName,
            address: key,
            row: coord.r,
            col: coord.c,
            value: valStr || formulaStr,
            isFormula,
          });

          if (results.length >= limit) {
            return results;
          }
        }
      }
    }

    return results;
  }
}
