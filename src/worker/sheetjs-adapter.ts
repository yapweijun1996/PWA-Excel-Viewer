import * as XLSX from 'xlsx';
import {
  CellData,
  SheetSummary,
  WorkbookSummary,
  ViewportData,
  SearchResult,
  SheetImage,
} from './protocol';

function extractMediaAndDrawings(buffer: ArrayBuffer): Map<number, SheetImage[]> {
  const sheetImagesMap = new Map<number, SheetImage[]>();
  try {
    const cfb = XLSX.CFB.read(new Uint8Array(buffer), { type: 'array' });
    if (!cfb || !cfb.FileIndex) return sheetImagesMap;

    const mediaMap = new Map<string, string>();
    const drawingXmls = new Map<string, string>();
    const drawingRels = new Map<string, Map<string, string>>();

    for (const entry of cfb.FileIndex) {
      if (!entry.name || !entry.content) continue;
      const lowerName = entry.name.toLowerCase();

      // Check media image files
      if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName)) {
        let mime = 'image/png';
        if (/\.jpe?g$/i.test(lowerName)) mime = 'image/jpeg';
        else if (/\.gif$/i.test(lowerName)) mime = 'image/gif';
        else if (/\.svg$/i.test(lowerName)) mime = 'image/svg+xml';
        else if (/\.webp$/i.test(lowerName)) mime = 'image/webp';

        let binary = '';
        const bytes = entry.content instanceof Uint8Array ? entry.content : new Uint8Array(entry.content);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);
        mediaMap.set(lowerName, `data:${mime};base64,${base64}`);
      } else if (/drawing\d+\.xml$/i.test(entry.name)) {
        const text = new TextDecoder().decode(entry.content);
        drawingXmls.set(lowerName, text);
      } else if (/drawing\d+\.xml\.rels$/i.test(entry.name)) {
        const text = new TextDecoder().decode(entry.content);
        const rels = new Map<string, string>();
        const matches = text.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g);
        for (const m of matches) {
          const id = m[1]!;
          const targetName = m[2]!.split('/').pop()?.toLowerCase() || '';
          rels.set(id, targetName);
        }
        drawingRels.set(lowerName, rels);
      }
    }

    let imageCounter = 0;
    for (const [drawingName, xml] of drawingXmls.entries()) {
      const numMatch = drawingName.match(/drawing(\d+)\.xml/i);
      const sheetIndex = numMatch ? Math.max(0, parseInt(numMatch[1]!, 10) - 1) : 0;

      const relsKey = `${drawingName}.rels`;
      const rels = drawingRels.get(relsKey) || new Map<string, string>();
      const sheetList = sheetImagesMap.get(sheetIndex) || [];

      // Two-cell anchors
      const twoCellMatches = xml.matchAll(/<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g);
      for (const match of twoCellMatches) {
        const block = match[0];
        const fromCol = parseInt(block.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/)?.[1] || '0', 10);
        const fromRow = parseInt(block.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)?.[1] || '0', 10);
        const toCol = parseInt(block.match(/<xdr:to>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/)?.[1] || String(fromCol + 3), 10);
        const toRow = parseInt(block.match(/<xdr:to>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)?.[1] || String(fromRow + 5), 10);
        const embedId = block.match(/r:embed="([^"]+)"/)?.[1] || '';
        const imgTarget = rels.get(embedId) || '';
        const src = mediaMap.get(imgTarget) || '';

        if (src) {
          sheetList.push({
            id: `img_${++imageCounter}`,
            sheetIndex,
            fromRow,
            fromCol,
            toRow,
            toCol,
            src,
            name: imgTarget,
          });
        }
      }

      // One-cell anchors
      const oneCellMatches = xml.matchAll(/<xdr:oneCellAnchor[\s\S]*?<\/xdr:oneCellAnchor>/g);
      for (const match of oneCellMatches) {
        const block = match[0];
        const fromCol = parseInt(block.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/)?.[1] || '0', 10);
        const fromRow = parseInt(block.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)?.[1] || '0', 10);
        const cx = parseInt(block.match(/<xdr:ext[^>]+cx="(\d+)"/)?.[1] || '0', 10);
        const cy = parseInt(block.match(/<xdr:ext[^>]+cy="(\d+)"/)?.[1] || '0', 10);
        const embedId = block.match(/r:embed="([^"]+)"/)?.[1] || '';
        const imgTarget = rels.get(embedId) || '';
        const src = mediaMap.get(imgTarget) || '';

        if (src) {
          const width = cx > 0 ? Math.round(cx / 9525) : 200;
          const height = cy > 0 ? Math.round(cy / 9525) : 150;
          sheetList.push({
            id: `img_${++imageCounter}`,
            sheetIndex,
            fromRow,
            fromCol,
            width,
            height,
            src,
            name: imgTarget,
          });
        }
      }

      sheetImagesMap.set(sheetIndex, sheetList);
    }

    // Fallback: if media files were discovered in zip but not mapped via drawings
    if (mediaMap.size > 0 && sheetImagesMap.size === 0) {
      const fallbackList: SheetImage[] = [];
      let r = 0;
      for (const [name, src] of mediaMap.entries()) {
        fallbackList.push({
          id: `img_${++imageCounter}`,
          sheetIndex: 0,
          fromRow: r,
          fromCol: 0,
          width: 250,
          height: 180,
          src,
          name,
        });
        r += 10;
      }
      sheetImagesMap.set(0, fallbackList);
    }
  } catch (err) {
    // Non-ZIP format or unreadable CFB container
  }

  return sheetImagesMap;
}

export class SheetJSAdapter {
  private wb: XLSX.WorkBook | null = null;
  private filename = '';
  private fileSize = 0;
  private fileType = '';
  private sheetImages = new Map<number, SheetImage[]>();

  open(buffer: ArrayBuffer, filename: string, fileSize: number): WorkbookSummary {
    this.filename = filename;
    this.fileSize = fileSize;
    this.fileType = filename.split('.').pop()?.toUpperCase() || 'FILE';

    // Parse array buffer safely
    this.wb = XLSX.read(buffer, {
      type: 'array',
      cellFormula: true,
      cellHTML: false,
      cellNF: true,
      cellStyles: true,
      bookVBA: true,
      dense: false,
      codepage: 65001,
    });

    // Extract images if XLSX
    this.sheetImages = extractMediaAndDrawings(buffer);

    return this.getWorkbookSummary();
  }

  close(): void {
    this.wb = null;
    this.sheetImages.clear();
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

      const colWidths: Record<number, number> = {};
      const rowHeights: Record<number, number> = {};

      if (ws && ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        startRow = range.s.r;
        startCol = range.s.c;
        endRow = range.e.r;
        endCol = range.e.c;
        rowCount = Math.max(0, endRow - startRow + 1);
        colCount = Math.max(0, endCol - startCol + 1);

        // Count cells, formulas, links
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

        // Extract column widths
        if (ws['!cols'] && Array.isArray(ws['!cols'])) {
          for (let c = 0; c < ws['!cols'].length; c++) {
            const colInfo = ws['!cols'][c];
            if (colInfo) {
              if (colInfo.hidden) {
                colWidths[c] = 0;
              } else if (colInfo.wpx) {
                colWidths[c] = Math.max(24, Math.round(colInfo.wpx));
              } else if (colInfo.wch) {
                colWidths[c] = Math.max(24, Math.round(colInfo.wch * 7.5 + 12));
              } else if (colInfo.width) {
                colWidths[c] = Math.max(24, Math.round(colInfo.width * 7.5 + 12));
              }
            }
          }
        }

        // Extract row heights
        if (ws['!rows'] && Array.isArray(ws['!rows'])) {
          for (let r = 0; r < ws['!rows'].length; r++) {
            const rowInfo = ws['!rows'][r];
            if (rowInfo) {
              if (rowInfo.hidden) {
                rowHeights[r] = 0;
              } else if (rowInfo.hpx) {
                rowHeights[r] = Math.max(16, Math.round(rowInfo.hpx));
              } else if (rowInfo.hpt) {
                rowHeights[r] = Math.max(16, Math.round(rowInfo.hpt * 1.33));
              }
            }
          }
        }
      }

      totalCells += sheetCellCount;

      const merges = (ws && ws['!merges'] ? ws['!merges'] : []).map((m: XLSX.Range) => ({
        s: { r: m.s.r, c: m.s.c },
        e: { r: m.e.r, c: m.e.c },
      }));

      const images = this.sheetImages.get(i) || [];

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
        colWidths,
        rowHeights,
        merges,
        images,
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
    if (ws['!cols'] && Array.isArray(ws['!cols'])) {
      for (let c = startCol; c <= endCol; c++) {
        const colInfo = ws['!cols'][c];
        if (colInfo) {
          if (colInfo.hidden) {
            colWidths[c] = 0;
          } else if (colInfo.wpx) {
            colWidths[c] = Math.max(24, Math.round(colInfo.wpx));
          } else if (colInfo.wch) {
            colWidths[c] = Math.max(24, Math.round(colInfo.wch * 7.5 + 12));
          } else if (colInfo.width) {
            colWidths[c] = Math.max(24, Math.round(colInfo.width * 7.5 + 12));
          }
        }
      }
    }

    const rowHeights: Record<number, number> = {};
    if (ws['!rows'] && Array.isArray(ws['!rows'])) {
      for (let r = startRow; r <= endRow; r++) {
        const rowInfo = ws['!rows'][r];
        if (rowInfo) {
          if (rowInfo.hidden) {
            rowHeights[r] = 0;
          } else if (rowInfo.hpx) {
            rowHeights[r] = Math.max(16, Math.round(rowInfo.hpx));
          } else if (rowInfo.hpt) {
            rowHeights[r] = Math.max(16, Math.round(rowInfo.hpt * 1.33));
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

    const images = this.sheetImages.get(sheetIndex) || [];

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
      images,
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
