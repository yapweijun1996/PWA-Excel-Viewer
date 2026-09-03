import * as XLSX from 'xlsx';
import {
  CellData,
  SheetSummary,
  WorkbookSummary,
  ViewportData,
  SearchResult,
  SheetDrawing,
  ChartSeries,
} from './protocol';

const CHART_COLORS = [
  '#167c4a', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#dc2626', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#10b981', // Green
];

function renderLineChartSvg(
  title: string,
  series: ChartSeries[],
  categories: string[],
  width = 560,
  height = 320
): string {
  const padLeft = 60;
  const padRight = 30;
  const padTop = 45;
  const padBottom = 40;
  const plotW = Math.max(100, width - padLeft - padRight);
  const plotH = Math.max(80, height - padTop - padBottom);

  let maxVal = 0;
  series.forEach((s) =>
    s.values.forEach((v) => {
      if (v > maxVal) maxVal = v;
    })
  );
  maxVal = Math.max(10, maxVal * 1.1);

  const numPts = Math.max(
    categories.length,
    ...series.map((s) => s.values.length),
    2
  );
  const stepX = plotW / Math.max(1, numPts - 1);

  // Y Grid
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const yVal = Math.round((maxVal / 4) * i);
    const yPos = padTop + plotH - (i / 4) * plotH;
    grid += `<line x1="${padLeft}" y1="${yPos}" x2="${padLeft + plotW}" y2="${yPos}" stroke="#e5e7eb" stroke-width="1" />`;
    grid += `<text x="${padLeft - 8}" y="${yPos + 4}" text-anchor="end" font-size="10" fill="#6b7280" font-family="sans-serif">${yVal.toLocaleString()}</text>`;
  }

  // X Labels
  let xLabels = '';
  const labelInterval = Math.max(1, Math.floor(categories.length / 12));
  categories.forEach((cat, i) => {
    if (i % labelInterval === 0) {
      const xPos = padLeft + i * stepX;
      xLabels += `<text x="${xPos}" y="${padTop + plotH + 18}" text-anchor="middle" font-size="10" fill="#6b7280" font-family="sans-serif">${cat}</text>`;
    }
  });

  // Series Paths
  let paths = '';
  let legend = '';
  series.forEach((s, sIdx) => {
    const color = CHART_COLORS[sIdx % CHART_COLORS.length]!;
    let d = '';
    s.values.forEach((v, pIdx) => {
      const xPos = padLeft + pIdx * stepX;
      const yPos = padTop + plotH - (v / maxVal) * plotH;
      d += (pIdx === 0 ? 'M ' : ' L ') + `${xPos} ${yPos}`;
      paths += `<circle cx="${xPos}" cy="${yPos}" r="3.5" fill="${color}" stroke="#ffffff" stroke-width="1.5" />`;
    });
    paths = `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" />` + paths;

    const lx = padLeft + (sIdx % 4) * 120;
    const ly = sIdx >= 4 ? 38 : 22;
    legend += `<g transform="translate(${lx}, ${ly})">
      <circle cx="5" cy="5" r="4" fill="${color}" />
      <text x="14" y="9" font-size="11" font-weight="500" fill="#374151" font-family="sans-serif">${s.name || `Series ${sIdx + 1}`}</text>
    </g>`;
  });

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff;border-radius:6px;display:block;">
    <text x="16" y="18" font-size="13" font-weight="600" fill="#17201c" font-family="sans-serif">${title}</text>
    ${legend}
    ${grid}
    ${xLabels}
    ${paths}
  </svg>`;
}

function renderPieChartSvg(
  title: string,
  categories: string[],
  values: number[],
  width = 500,
  height = 300
): string {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const cx = Math.min(width * 0.38, 160);
  const cy = height * 0.55;
  const r = Math.min(width, height) * 0.34;

  let currentAngle = -Math.PI / 2;
  let paths = '';
  let legend = '';

  values.forEach((val, i) => {
    const sliceAngle = (val / total) * 2 * Math.PI;
    const endAngle = currentAngle + sliceAngle;
    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const color = CHART_COLORS[i % CHART_COLORS.length]!;

    paths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="#ffffff" stroke-width="1.5" />`;
    currentAngle = endAngle;

    const cat = categories[i] || `Item ${i + 1}`;
    const pct = Math.round((val / total) * 100);
    const ly = 48 + i * 22;
    legend += `<g transform="translate(${cx + r + 24}, ${ly})">
      <rect width="12" height="12" rx="2" fill="${color}" />
      <text x="18" y="10" font-size="11" fill="#374151" font-family="sans-serif">${cat} (${val.toLocaleString()} · ${pct}%)</text>
    </g>`;
  });

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff;border-radius:6px;display:block;">
    <text x="16" y="24" font-size="13" font-weight="600" fill="#17201c" font-family="sans-serif">${title}</text>
    ${paths}
    ${legend}
  </svg>`;
}

function renderBarChartSvg(
  title: string,
  series: ChartSeries[],
  categories: string[],
  width = 560,
  height = 320
): string {
  const padLeft = 60;
  const padRight = 30;
  const padTop = 45;
  const padBottom = 40;
  const plotW = Math.max(100, width - padLeft - padRight);
  const plotH = Math.max(80, height - padTop - padBottom);

  let maxVal = 0;
  series.forEach((s) =>
    s.values.forEach((v) => {
      if (v > maxVal) maxVal = v;
    })
  );
  maxVal = Math.max(10, maxVal * 1.1);

  const numCats = categories.length || (series[0]?.values.length ?? 1);
  const catW = plotW / numCats;
  const barW = Math.max(4, Math.min(28, (catW * 0.7) / series.length));

  // Y Grid
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const yVal = Math.round((maxVal / 4) * i);
    const yPos = padTop + plotH - (i / 4) * plotH;
    grid += `<line x1="${padLeft}" y1="${yPos}" x2="${padLeft + plotW}" y2="${yPos}" stroke="#e5e7eb" stroke-width="1" />`;
    grid += `<text x="${padLeft - 8}" y="${yPos + 4}" text-anchor="end" font-size="10" fill="#6b7280" font-family="sans-serif">${yVal.toLocaleString()}</text>`;
  }

  let bars = '';
  let xLabels = '';
  categories.forEach((cat, cIdx) => {
    const groupX = padLeft + cIdx * catW;
    xLabels += `<text x="${groupX + catW / 2}" y="${padTop + plotH + 18}" text-anchor="middle" font-size="10" fill="#6b7280" font-family="sans-serif">${cat}</text>`;

    series.forEach((s, sIdx) => {
      const v = s.values[cIdx] || 0;
      const bH = (v / maxVal) * plotH;
      const bX = groupX + (catW - series.length * barW) / 2 + sIdx * barW;
      const bY = padTop + plotH - bH;
      const color = CHART_COLORS[sIdx % CHART_COLORS.length]!;
      bars += `<rect x="${bX}" y="${bY}" width="${barW - 2}" height="${bH}" fill="${color}" rx="2" />`;
    });
  });

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff;border-radius:6px;display:block;">
    <text x="16" y="20" font-size="13" font-weight="600" fill="#17201c" font-family="sans-serif">${title}</text>
    ${grid}
    ${xLabels}
    ${bars}
  </svg>`;
}

function extractDrawingsAndMedia(buffer: ArrayBuffer): Map<number, SheetDrawing[]> {
  const sheetDrawingsMap = new Map<number, SheetDrawing[]>();
  try {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 512) return sheetDrawingsMap;
    // Only ZIP-based OpenXML packages (XLSX, XLSM) have drawings and media
    if (bytes[0] !== 80 || bytes[1] !== 75 || bytes[2] !== 3 || bytes[3] !== 4) {
      return sheetDrawingsMap;
    }

    const cfb = XLSX.CFB.read(bytes, { type: 'array' });
    if (!cfb || !cfb.FileIndex) return sheetDrawingsMap;

    // 1. Map workbook sheets to sheet files
    const wbRelsEntry = cfb.FileIndex.find(
      (e: any) => e.name && e.name.toLowerCase() === 'workbook.xml.rels'
    );
    const wbRels = wbRelsEntry ? new TextDecoder().decode(wbRelsEntry.content) : '';
    const rIdToSheetFile = new Map<string, string>();
    for (const m of wbRels.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g)) {
      rIdToSheetFile.set(m[1]!, m[2]!.split('/').pop()!.toLowerCase());
    }

    const wbEntry = cfb.FileIndex.find(
      (e: any) => e.name && e.name.toLowerCase() === 'workbook.xml'
    );
    const wbXml = wbEntry ? new TextDecoder().decode(wbEntry.content) : '';
    const sheetFileToIndex = new Map<string, number>();
    let sIndex = 0;
    for (const m of wbXml.matchAll(/<sheet[^>]+r:id="([^"]+)"/g)) {
      const file = rIdToSheetFile.get(m[1]!);
      if (file) sheetFileToIndex.set(file, sIndex);
      sIndex++;
    }

    // 2. Map sheet rels to drawing files
    const drawingToSheetIndex = new Map<string, number>();
    for (const entry of cfb.FileIndex) {
      if (entry.name && /sheet\d+\.xml\.rels$/i.test(entry.name)) {
        const sheetFile = entry.name.replace('.rels', '').toLowerCase();
        const sIdx = sheetFileToIndex.get(sheetFile);
        if (sIdx !== undefined) {
          const relsText = new TextDecoder().decode(entry.content);
          for (const dm of relsText.matchAll(/<Relationship[^>]+Target="[^"]*?(drawing\d+\.xml)"/gi)) {
            drawingToSheetIndex.set(dm[1]!.toLowerCase(), sIdx);
          }
        }
      }
    }

    // 3. Media image files
    const mediaMap = new Map<string, string>();
    for (const entry of cfb.FileIndex) {
      if (!entry.name || !entry.content) continue;
      const lowerName = entry.name.toLowerCase();
      if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName)) {
        let mime = 'image/png';
        if (/\.jpe?g$/i.test(lowerName)) mime = 'image/jpeg';
        else if (/\.gif$/i.test(lowerName)) mime = 'image/gif';
        else if (/\.svg$/i.test(lowerName)) mime = 'image/svg+xml';
        else if (/\.webp$/i.test(lowerName)) mime = 'image/webp';

        let binary = '';
        const bytes =
          entry.content instanceof Uint8Array
            ? entry.content
            : new Uint8Array(entry.content);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        mediaMap.set(lowerName, `data:${mime};base64,${btoa(binary)}`);
      }
    }

    // 4. Charts XML
    const chartXmls = new Map<string, string>();
    for (const entry of cfb.FileIndex) {
      if (entry.name && /chart\d+\.xml$/i.test(entry.name)) {
        chartXmls.set(entry.name.toLowerCase(), new TextDecoder().decode(entry.content));
      }
    }

    // 5. Drawing XMLs
    let drawingCounter = 0;
    for (const entry of cfb.FileIndex) {
      if (!entry.name || !/drawing\d+\.xml$/i.test(entry.name)) continue;
      const drawingName = entry.name.toLowerCase();
      const drawingXml = new TextDecoder().decode(entry.content);

      // Drawing relationships
      const relsEntry = cfb.FileIndex.find(
        (e: any) => e.name && e.name.toLowerCase() === `${drawingName}.rels`
      );
      const relsText = relsEntry ? new TextDecoder().decode(relsEntry.content) : '';
      const rels = new Map<string, string>();
      for (const m of relsText.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g)) {
        rels.set(m[1]!, m[2]!.split('/').pop()!.toLowerCase());
      }

      const sheetIdx = drawingToSheetIndex.get(drawingName) ?? 0;
      const list = sheetDrawingsMap.get(sheetIdx) || [];

      // Two-cell Anchors
      for (const m of drawingXml.matchAll(/<xdr:twoCellAnchor[\s\S]*?<\/xdr:twoCellAnchor>/g)) {
        const block = m[0];
        const fromCol = parseInt(
          block.match(/<xdr:from>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/)?.[1] || '0',
          10
        );
        const fromRow = parseInt(
          block.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)?.[1] || '0',
          10
        );
        const toCol = parseInt(
          block.match(/<xdr:to>[\s\S]*?<xdr:col>(\d+)<\/xdr:col>/)?.[1] || String(fromCol + 5),
          10
        );
        const toRow = parseInt(
          block.match(/<xdr:to>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/)?.[1] || String(fromRow + 12),
          10
        );

        const blipEmbed = block.match(/<a:blip[^>]+r:embed="([^"]+)"/)?.[1];
        const chartEmbed = block.match(/<c:chart[^>]+r:id="([^"]+)"/)?.[1];

        if (blipEmbed) {
          const imgFile = rels.get(blipEmbed) || '';
          const src = mediaMap.get(imgFile) || '';
          if (src) {
            list.push({
              id: `drw_${++drawingCounter}`,
              sheetIndex: sheetIdx,
              type: 'image',
              fromRow,
              fromCol,
              toRow,
              toCol,
              src,
              name: imgFile,
            });
          }
        } else if (chartEmbed) {
          const chartFile = rels.get(chartEmbed) || '';
          const cXml = chartXmls.get(chartFile);
          if (cXml) {
            const titleParts = Array.from(cXml.matchAll(/<a:t>([^<]+)<\/a:t>/g)).map(
              (tm) => tm[1]!
            );
            const rawTitle =
              titleParts.join(' ').trim() ||
              cXml.match(/<c:title>[\s\S]*?<c:v>([^<]+)<\/c:v>/)?.[1] ||
              'Chart';
            const title = rawTitle.replace(/\s+/g, ' ').trim();

            const typeMatch = cXml.match(/<c:([a-zA-Z]+Chart)>/);
            const chartType = typeMatch ? typeMatch[1]! : 'lineChart';

            // Parse series
            const seriesList: ChartSeries[] = [];
            const serMatches = cXml.matchAll(/<c:ser>([\s\S]*?)<\/c:ser>/g);
            for (const s of serMatches) {
              const sBlock = s[1]!;
              const sName =
                sBlock.match(/<c:tx>[\s\S]*?<c:v>([^<]+)<\/c:v>/)?.[1] ||
                sBlock.match(/<c:tx>[\s\S]*?<a:t>([^<]+)<\/a:t>/)?.[1] ||
                `Series ${seriesList.length + 1}`;

              const catBlock = sBlock.match(/<c:cat>([\s\S]*?)<\/c:cat>/)?.[1] || '';
              const formatCode = catBlock.match(/<c:formatCode>([^<]+)<\/c:formatCode>/)?.[1];
              const rawCats = Array.from(
                catBlock.matchAll(/<c:pt idx="\d+">[\s\S]*?<c:v>([^<]+)<\/c:v>/g)
              ).map((cm) => cm[1]!);

              const categories = rawCats.map((raw) => {
                const num = parseFloat(raw);
                if (!isNaN(num) && num > 30000 && formatCode) {
                  try {
                    return XLSX.SSF.format(formatCode, num);
                  } catch {
                    return raw;
                  }
                }
                return raw;
              });

              const valBlock = sBlock.match(/<c:val>([\s\S]*?)<\/c:val>/)?.[1] || '';
              const values = Array.from(
                valBlock.matchAll(/<c:pt idx="\d+">[\s\S]*?<c:v>([^<]+)<\/c:v>/g)
              )
                .map((vm) => parseFloat(vm[1]!))
                .filter((n) => !isNaN(n));

              seriesList.push({
                name: sName,
                categories,
                values,
              });
            }

            // Generate SVG representation
            let svgContent = '';
            const allCats = seriesList[0]?.categories || [];
            if (chartType === 'pieChart') {
              const pVals = seriesList[0]?.values || [];
              svgContent = renderPieChartSvg(title, allCats, pVals);
            } else if (chartType === 'barChart' || chartType === 'colChart') {
              svgContent = renderBarChartSvg(title, seriesList, allCats);
            } else {
              svgContent = renderLineChartSvg(title, seriesList, allCats);
            }

            list.push({
              id: `drw_${++drawingCounter}`,
              sheetIndex: sheetIdx,
              type: 'chart',
              fromRow,
              fromCol,
              toRow,
              toCol,
              name: title,
              chartTitle: title,
              chartType,
              series: seriesList,
              svgContent,
            });
          }
        }
      }

      sheetDrawingsMap.set(sheetIdx, list);
    }
  } catch (err) {
    console.warn('Drawing extraction skipped:', err);
  }

  return sheetDrawingsMap;
}

export class SheetJSAdapter {
  private wb: XLSX.WorkBook | null = null;
  private filename = '';
  private fileSize = 0;
  private fileType = '';
  private sheetDrawings = new Map<number, SheetDrawing[]>();

  open(buffer: ArrayBuffer, filename: string, fileSize: number): WorkbookSummary {
    this.filename = filename;
    this.fileSize = fileSize;
    this.fileType = filename.split('.').pop()?.toUpperCase() || 'FILE';

    // Parse array buffer safely with complete structural metadata
    this.wb = XLSX.read(buffer, {
      type: 'array',
      cellFormula: true,
      cellHTML: false,
      cellNF: true,
      cellStyles: true,
      sheetStubs: true,
      bookVBA: true,
      dense: false,
      codepage: 65001,
    });

    // Extract drawings and media
    this.sheetDrawings = extractDrawingsAndMedia(buffer);

    return this.getWorkbookSummary();
  }

  close(): void {
    this.wb = null;
    this.sheetDrawings.clear();
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

        // 1. Read custom column widths from !cols
        if (ws['!cols'] && Array.isArray(ws['!cols'])) {
          for (let c = 0; c < ws['!cols'].length; c++) {
            const colInfo = ws['!cols'][c];
            if (colInfo) {
              if (colInfo.hidden) {
                colWidths[c] = 0;
              } else if (colInfo.wpx) {
                colWidths[c] = Math.max(28, Math.round(colInfo.wpx));
              } else if (colInfo.wch) {
                colWidths[c] = Math.max(28, Math.round(colInfo.wch * 7.5 + 12));
              } else if (colInfo.width) {
                colWidths[c] = Math.max(28, Math.round(colInfo.width * 7.5 + 12));
              }
            }
          }
        }

        // 2. Read custom row heights from !rows
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

        // 3. Auto-fit column widths if !cols was missing or incomplete
        const mergesList = (ws['!merges'] || []).map((m: XLSX.Range) => ({
          s: { r: m.s.r, c: m.s.c },
          e: { r: m.e.r, c: m.e.c },
        }));

        const sampleEnd = Math.min(endRow, startRow + 50);
        for (let c = startCol; c <= endCol; c++) {
          if (colWidths[c] !== undefined && colWidths[c]! > 0) continue;

          let maxLen = 0;
          for (let r = startRow; r <= sampleEnd; r++) {
            const inMerge = mergesList.some(
              (m) =>
                m.s.r <= r &&
                r <= m.e.r &&
                m.s.c <= c &&
                c <= m.e.c &&
                m.s.c !== m.e.c
            );
            if (inMerge) continue;

            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            if (cell && (cell.w || cell.v)) {
              const lines = String(cell.w || cell.v).split('\n');
              for (const l of lines) {
                maxLen = Math.max(maxLen, l.trim().length);
              }
            }
          }

          if (maxLen > 0) {
            colWidths[c] = Math.max(60, Math.min(300, Math.round(maxLen * 8.5 + 18)));
          } else {
            colWidths[c] = 100;
          }
        }
      }

      totalCells += sheetCellCount;

      const merges = (ws && ws['!merges'] ? ws['!merges'] : []).map(
        (m: XLSX.Range) => ({
          s: { r: m.s.r, c: m.s.c },
          e: { r: m.e.r, c: m.e.c },
        })
      );

      const drawings = this.sheetDrawings.get(i) || [];

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
        drawings,
        images: drawings,
      });
    }

    const hasMacros = Boolean((this.wb as any).vbaraw) || this.fileType === 'XLSM';
    const macroCount = hasMacros ? 1 : 0;

    const warnings: string[] = [];
    if (hasMacros) warnings.push('macros');
    if (hiddenSheetCount > 0) warnings.push('hiddenSheets');
    if (totalLinks > 0) warnings.push('externalLinks');

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

    const summary = this.getSheetSummary(sheetIndex);

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
            w:
              cell.w != null
                ? String(cell.w)
                : cell.v != null
                ? String(cell.v)
                : '',
            t: cell.t || 's',
            f: cell.f,
            c: comment,
            l: link,
          };
        }
      }
    }

    return {
      sheetIndex,
      startRow,
      endRow,
      startCol,
      endCol,
      cells,
      merges: summary.merges,
      colWidths: summary.colWidths,
      rowHeights: summary.rowHeights,
      drawings: summary.drawings,
      images: summary.drawings,
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
      w: cell.w != null ? String(cell.w) : cell.v != null ? String(cell.v) : '',
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

        const valStr =
          cell.w != null ? String(cell.w) : cell.v != null ? String(cell.v) : '';
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
