import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';
import { workerClient } from '../../services/worker-client';
import { indexToColName } from '../../utils/cell-reference';
import { ViewportData, CellRange } from '../../worker/protocol';
import { copyText } from '../../services/clipboard';

const DEFAULT_ROW_HEIGHT = 26;
const DEFAULT_COL_WIDTH = 100;
const HEADER_HEIGHT = 28;
const OVERSCAN_ROWS = 6;
const OVERSCAN_COLS = 3;

export class GridComponent {
  private el: HTMLElement;
  private scrollContainer: HTMLElement;
  private virtualContent: HTMLElement;
  private cornerHeader: HTMLElement;
  private colHeadersContainer: HTMLElement;
  private rowHeadersContainer: HTMLElement;
  private cellsContainer: HTMLElement;
  private imagesContainer: HTMLElement;

  private currentViewport: ViewportData | null = null;
  private isMouseDown = false;
  private dragAnchor = { row: 0, col: 0 };
  private activeSheetRowCount = 0;
  private activeSheetColCount = 0;

  // Cached positions
  private colOffsets: number[] = [];
  private rowOffsets: number[] = [];
  private totalWidth = 0;
  private totalHeight = 0;
  private rowHeaderWidth = 48;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'grid-container';
    this.el.tabIndex = 0; // Accessible keyboard focus

    // Layout structure
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.cssText = 'position: relative; width: 100%; height: 100%; overflow: auto;';

    this.virtualContent = document.createElement('div');
    this.virtualContent.style.cssText = 'position: relative; min-width: 100%; min-height: 100%;';

    // Sticky Top-Left Corner
    this.cornerHeader = document.createElement('div');
    this.cornerHeader.style.cssText = `position: sticky; top: 0; left: 0; z-index: 30; height: ${HEADER_HEIGHT}px; background-color: var(--bg-grid-header); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); box-sizing: border-box;`;

    // Sticky Column Headers (Top)
    this.colHeadersContainer = document.createElement('div');
    this.colHeadersContainer.style.cssText = `position: sticky; top: 0; z-index: 20; height: ${HEADER_HEIGHT}px; background-color: var(--bg-grid-header); border-bottom: 1px solid var(--border); box-sizing: border-box; overflow: hidden;`;

    // Sticky Row Headers (Left)
    this.rowHeadersContainer = document.createElement('div');
    this.rowHeadersContainer.style.cssText = 'position: sticky; left: 0; z-index: 20; background-color: var(--bg-grid-header); border-right: 1px solid var(--border); box-sizing: border-box; overflow: hidden;';

    // Cell Canvas
    this.cellsContainer = document.createElement('div');
    this.cellsContainer.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 10; pointer-events: auto;';

    // Image Canvas
    this.imagesContainer = document.createElement('div');
    this.imagesContainer.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 15; pointer-events: auto;';

    this.virtualContent.appendChild(this.cornerHeader);
    this.virtualContent.appendChild(this.colHeadersContainer);
    this.virtualContent.appendChild(this.rowHeadersContainer);
    this.virtualContent.appendChild(this.cellsContainer);
    this.virtualContent.appendChild(this.imagesContainer);
    this.scrollContainer.appendChild(this.virtualContent);
    this.el.appendChild(this.scrollContainer);

    this.setupListeners();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private setupListeners(): void {
    appEvents.on('session:workbookChanged', () => this.handleSheetChange());
    appEvents.on('session:sheetChanged', () => this.handleSheetChange());
    appEvents.on('session:selectionChanged', () => this.renderSelection());
    appEvents.on('grid:copySelection', () => this.copySelectedCells());
    appEvents.on('goto:reference', (ref: string) => this.handleExternalReference(ref));

    let scrollRaf = 0;
    this.scrollContainer.addEventListener('scroll', () => {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => this.updateVirtualization());
    });

    window.addEventListener('resize', () => this.updateVirtualization());

    // Mouse Selection
    this.cellsContainer.addEventListener('mousedown', (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.grid-cell') as HTMLElement;
      if (!target) return;

      const r = parseInt(target.getAttribute('data-row') || '0', 10);
      const c = parseInt(target.getAttribute('data-col') || '0', 10);

      this.el.focus();
      this.isMouseDown = true;
      this.dragAnchor = { row: r, col: c };

      if (e.shiftKey) {
        session.setSelectedCell(r, c, true);
      } else {
        session.setSelectedCell(r, c, false);
      }

      this.fetchActiveCellData(r, c);
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isMouseDown) return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.grid-cell') as HTMLElement;
      if (target) {
        const r = parseInt(target.getAttribute('data-row') || '0', 10);
        const c = parseInt(target.getAttribute('data-col') || '0', 10);
        session.setSelectedRange({
          s: { r: this.dragAnchor.row, c: this.dragAnchor.col },
          e: { r, c },
        });
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Touch support (Mobile)
    let lastTap = 0;
    this.cellsContainer.addEventListener('touchend', (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.grid-cell') as HTMLElement;
      if (target) {
        const r = parseInt(target.getAttribute('data-row') || '0', 10);
        const c = parseInt(target.getAttribute('data-col') || '0', 10);
        session.setSelectedCell(r, c, false);
        this.fetchActiveCellData(r, c);

        const now = Date.now();
        if (now - lastTap < 350) {
          session.setMobileInspector(true);
        }
        lastTap = now;
      }
    });

    // Keyboard Navigation
    this.el.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyDown(e);
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const { selectedCell, selectedRange } = session;
    let r = selectedCell.row;
    let c = selectedCell.col;
    let handled = true;

    switch (e.key) {
      case 'ArrowUp':
        r = Math.max(0, r - 1);
        break;
      case 'ArrowDown':
        r = Math.min(this.activeSheetRowCount - 1, r + 1);
        break;
      case 'ArrowLeft':
        c = Math.max(0, c - 1);
        break;
      case 'ArrowRight':
        c = Math.min(this.activeSheetColCount - 1, c + 1);
        break;
      case 'PageUp':
        r = Math.max(0, r - 20);
        break;
      case 'PageDown':
        r = Math.min(this.activeSheetRowCount - 1, r + 20);
        break;
      case 'Home':
        c = 0;
        break;
      case 'End':
        c = this.activeSheetColCount - 1;
        break;
      case 'Enter':
        session.setMobileInspector(true);
        break;
      default:
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          this.copySelectedCells();
          return;
        }
        handled = false;
    }

    if (handled) {
      e.preventDefault();
      if (e.shiftKey && selectedRange) {
        session.setSelectedRange({
          s: selectedRange.s,
          e: { r, c },
        });
      } else {
        session.setSelectedCell(r, c, false);
      }
      this.fetchActiveCellData(r, c);
      this.scrollCellIntoView(r, c);
    }
  }

  public scrollCellIntoView(row: number, col: number): void {
    const targetTop = this.rowOffsets[row] ?? row * DEFAULT_ROW_HEIGHT;
    const targetLeft = this.colOffsets[col] ?? col * DEFAULT_COL_WIDTH;
    const rowHeight = (this.rowOffsets[row + 1] ?? targetTop + DEFAULT_ROW_HEIGHT) - targetTop;
    const colWidth = (this.colOffsets[col + 1] ?? targetLeft + DEFAULT_COL_WIDTH) - targetLeft;

    const scrollTop = this.scrollContainer.scrollTop;
    const scrollLeft = this.scrollContainer.scrollLeft;
    const clientHeight = this.scrollContainer.clientHeight;
    const clientWidth = this.scrollContainer.clientWidth;

    if (targetTop < scrollTop) {
      this.scrollContainer.scrollTop = targetTop;
    } else if (targetTop + rowHeight > scrollTop + clientHeight - HEADER_HEIGHT) {
      this.scrollContainer.scrollTop = targetTop + rowHeight - clientHeight + HEADER_HEIGHT + 20;
    }

    if (targetLeft < scrollLeft) {
      this.scrollContainer.scrollLeft = targetLeft;
    } else if (targetLeft + colWidth > scrollLeft + clientWidth - this.rowHeaderWidth) {
      this.scrollContainer.scrollLeft = targetLeft + colWidth - clientWidth + this.rowHeaderWidth + 40;
    }
  }

  private handleSheetChange(): void {
    const wb = session.workbook;
    if (!wb || !wb.sheets[session.activeSheetIndex]) {
      this.activeSheetRowCount = 0;
      this.activeSheetColCount = 0;
      this.renderEmpty();
      return;
    }

    const sheet = wb.sheets[session.activeSheetIndex]!;
    this.activeSheetRowCount = Math.max(100, sheet.rowCount);
    this.activeSheetColCount = Math.max(26, sheet.colCount);

    // Calculate row header width
    const digits = String(this.activeSheetRowCount).length;
    this.rowHeaderWidth = Math.max(48, digits * 9 + 18);

    // Dynamic column offsets matching Excel custom widths
    this.colOffsets = [0];
    for (let c = 0; c < this.activeSheetColCount; c++) {
      const w = sheet.colWidths && sheet.colWidths[c] !== undefined ? sheet.colWidths[c]! : DEFAULT_COL_WIDTH;
      this.colOffsets.push(this.colOffsets[c]! + w);
    }

    // Dynamic row offsets matching Excel custom heights
    this.rowOffsets = [0];
    for (let r = 0; r < this.activeSheetRowCount; r++) {
      const h = sheet.rowHeights && sheet.rowHeights[r] !== undefined ? sheet.rowHeights[r]! : DEFAULT_ROW_HEIGHT;
      this.rowOffsets.push(this.rowOffsets[r]! + h);
    }

    this.totalWidth = this.colOffsets[this.colOffsets.length - 1]!;
    this.totalHeight = this.rowOffsets[this.rowOffsets.length - 1]!;

    this.virtualContent.style.width = `${this.totalWidth + this.rowHeaderWidth}px`;
    this.virtualContent.style.height = `${this.totalHeight + HEADER_HEIGHT}px`;

    this.cornerHeader.style.width = `${this.rowHeaderWidth}px`;
    this.rowHeadersContainer.style.width = `${this.rowHeaderWidth}px`;
    this.colHeadersContainer.style.left = `${this.rowHeaderWidth}px`;
    this.colHeadersContainer.style.width = `${this.totalWidth}px`;

    this.scrollContainer.scrollTop = 0;
    this.scrollContainer.scrollLeft = 0;

    this.renderImages();
    this.fetchActiveCellData(session.selectedCell.row, session.selectedCell.col);
    this.updateVirtualization();
  }

  private renderImages(): void {
    const sheet = session.workbook?.sheets[session.activeSheetIndex];
    if (!sheet || !sheet.images || sheet.images.length === 0) {
      this.imagesContainer.innerHTML = '';
      return;
    }

    this.imagesContainer.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (const img of sheet.images) {
      const fromC = img.fromCol;
      const fromR = img.fromRow;
      const left = (this.colOffsets[fromC] || 0) + this.rowHeaderWidth;
      const top = (this.rowOffsets[fromR] || 0) + HEADER_HEIGHT;

      let width = 200;
      let height = 150;

      if (img.toCol !== undefined && img.toRow !== undefined) {
        const rightEdge = this.colOffsets[img.toCol + 1] || (this.colOffsets[img.toCol] || left) + 100;
        const bottomEdge = this.rowOffsets[img.toRow + 1] || (this.rowOffsets[img.toRow] || top) + 26;
        width = Math.max(20, rightEdge - (this.colOffsets[fromC] || 0));
        height = Math.max(20, bottomEdge - (this.rowOffsets[fromR] || 0));
      } else if (img.width && img.height) {
        width = img.width;
        height = img.height;
      }

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'grid-embedded-image';
      imgWrapper.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        width: ${width}px;
        height: ${height}px;
        box-sizing: border-box;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 25;
        pointer-events: auto;
      `;

      const imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.alt = img.name || 'Spreadsheet Image';
      imgEl.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border-strong);
        background: #ffffff;
        border-radius: var(--radius-sm);
      `;

      imgWrapper.appendChild(imgEl);
      frag.appendChild(imgWrapper);
    }

    this.imagesContainer.appendChild(frag);
  }

  private async fetchActiveCellData(row: number, col: number): Promise<void> {
    try {
      const cell = await workerClient.getCell(session.activeSheetIndex, row, col);
      session.setActiveCellData(cell);
    } catch (e) {
      console.error('Failed to get cell data', e);
    }
  }

  private async updateVirtualization(): Promise<void> {
    if (!session.workbook) return;

    const scrollTop = this.scrollContainer.scrollTop;
    const scrollLeft = this.scrollContainer.scrollLeft;
    const clientHeight = this.scrollContainer.clientHeight || 600;
    const clientWidth = this.scrollContainer.clientWidth || 800;

    // Binary search/linear scan for visible startRow & endRow
    let startRow = 0;
    while (startRow < this.rowOffsets.length - 1 && this.rowOffsets[startRow + 1]! < scrollTop) {
      startRow++;
    }
    startRow = Math.max(0, startRow - OVERSCAN_ROWS);

    let endRow = startRow;
    while (endRow < this.rowOffsets.length - 1 && this.rowOffsets[endRow]! < scrollTop + clientHeight) {
      endRow++;
    }
    endRow = Math.min(this.activeSheetRowCount - 1, endRow + OVERSCAN_ROWS);

    // Visible startCol & endCol
    let startCol = 0;
    while (startCol < this.colOffsets.length - 1 && this.colOffsets[startCol + 1]! < scrollLeft) {
      startCol++;
    }
    startCol = Math.max(0, startCol - OVERSCAN_COLS);

    let endCol = startCol;
    while (endCol < this.colOffsets.length - 1 && this.colOffsets[endCol]! < scrollLeft + clientWidth) {
      endCol++;
    }
    endCol = Math.min(this.activeSheetColCount - 1, endCol + OVERSCAN_COLS);

    // Fetch viewport data from Worker
    try {
      this.currentViewport = await workerClient.getViewport(
        session.activeSheetIndex,
        startRow,
        endRow,
        startCol,
        endCol
      );
      this.renderViewport(startRow, endRow, startCol, endCol);
    } catch (e) {
      console.warn('Worker getViewport error', e);
    }
  }

  private renderViewport(
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): void {
    // Render Column Headers
    let colHeadersHtml = '';
    for (let c = startCol; c <= endCol; c++) {
      const left = this.colOffsets[c]!;
      const width = (this.colOffsets[c + 1] || left + DEFAULT_COL_WIDTH) - left;
      const isColSelected = session.selectedCell.col === c;
      colHeadersHtml += `
        <div class="grid-col-header ${isColSelected ? 'active' : ''}" style="position: absolute; left: ${left}px; width: ${width}px; height: ${HEADER_HEIGHT}px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--text-secondary); border-right: 1px solid var(--border); box-sizing: border-box; user-select: none;">
          ${indexToColName(c)}
        </div>
      `;
    }
    this.colHeadersContainer.innerHTML = colHeadersHtml;

    // Render Row Headers
    let rowHeadersHtml = '';
    for (let r = startRow; r <= endRow; r++) {
      const top = (this.rowOffsets[r] || 0) + HEADER_HEIGHT;
      const height = (this.rowOffsets[r + 1] || top + DEFAULT_ROW_HEIGHT) - (this.rowOffsets[r] || 0);
      const isRowSelected = session.selectedCell.row === r;
      rowHeadersHtml += `
        <div class="grid-row-header ${isRowSelected ? 'active' : ''}" style="position: absolute; top: ${top}px; width: ${this.rowHeaderWidth}px; height: ${height}px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500; color: var(--text-muted); border-bottom: 1px solid var(--border); box-sizing: border-box; user-select: none;">
          ${r + 1}
        </div>
      `;
    }
    this.rowHeadersContainer.innerHTML = rowHeadersHtml;

    // Merged Cells Mapping
    const merges = this.currentViewport?.merges || [];
    const mergedTopLeft = new Map<string, CellRange>();
    const hiddenMergedCells = new Set<string>();

    for (const m of merges) {
      mergedTopLeft.set(`${m.s.r},${m.s.c}`, m);
      for (let mr = m.s.r; mr <= m.e.r; mr++) {
        for (let mc = m.s.c; mc <= m.e.c; mc++) {
          if (mr !== m.s.r || mc !== m.s.c) {
            hiddenMergedCells.add(`${mr},${mc}`);
          }
        }
      }
    }

    // Render Cells
    const cells = this.currentViewport?.cells || {};
    const { selectedCell, selectedRange, searchResults } = session;

    const selMinR = selectedRange ? Math.min(selectedRange.s.r, selectedRange.e.r) : selectedCell.row;
    const selMaxR = selectedRange ? Math.max(selectedRange.s.r, selectedRange.e.r) : selectedCell.row;
    const selMinC = selectedRange ? Math.min(selectedRange.s.c, selectedRange.e.c) : selectedCell.col;
    const selMaxC = selectedRange ? Math.max(selectedRange.s.c, selectedRange.e.c) : selectedCell.col;

    const frag = document.createDocumentFragment();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Skip hidden cells inside merged range
        if (hiddenMergedCells.has(`${r},${c}`)) {
          continue;
        }

        const left = (this.colOffsets[c] || 0) + this.rowHeaderWidth;
        const top = (this.rowOffsets[r] || 0) + HEADER_HEIGHT;

        let width = (this.colOffsets[c + 1] || left + DEFAULT_COL_WIDTH) - (this.colOffsets[c] || 0);
        let height = (this.rowOffsets[r + 1] || top + DEFAULT_ROW_HEIGHT) - (this.rowOffsets[r] || 0);

        const mergeInfo = mergedTopLeft.get(`${r},${c}`);
        const isMerged = Boolean(mergeInfo);
        if (mergeInfo) {
          const rightEdge = this.colOffsets[mergeInfo.e.c + 1] || (this.colOffsets[mergeInfo.e.c] || left) + DEFAULT_COL_WIDTH;
          const bottomEdge = this.rowOffsets[mergeInfo.e.r + 1] || (this.rowOffsets[mergeInfo.e.r] || top) + DEFAULT_ROW_HEIGHT;
          width = rightEdge - (this.colOffsets[c] || 0);
          height = bottomEdge - (this.rowOffsets[r] || 0);
        }

        const cell = cells[`${r},${c}`];
        const textVal = cell?.w || (cell?.v != null ? String(cell.v) : '');

        const cellEl = document.createElement('div');
        cellEl.className = `grid-cell ${isMerged ? 'grid-cell-merged' : ''}`;
        cellEl.setAttribute('data-row', String(r));
        cellEl.setAttribute('data-col', String(c));

        // Check search match
        const isSearchMatch = searchResults.some(
          (sr) => sr.sheetIndex === session.activeSheetIndex && sr.row === r && sr.col === c
        );

        let bg = 'var(--bg-surface)';
        let border = '1px solid var(--border)';
        let zIndex = isMerged ? '3' : '1';

        const inRange = r >= selMinR && r <= selMaxR && c >= selMinC && c <= selMaxC;
        const isPrimary = r === selectedCell.row && c === selectedCell.col;

        if (isPrimary) {
          border = '2px solid var(--selection-border)';
          zIndex = '6';
          bg = 'var(--selection-fill)';
        } else if (inRange) {
          bg = 'var(--selection-fill)';
        } else if (isSearchMatch) {
          bg = 'var(--warning-soft)';
        }

        // Text alignment by type
        let textAlign = 'left';
        let justifyContent = 'flex-start';
        let fontWeight = isMerged || r === 0 ? '600' : 'normal';

        if (cell?.t === 'n') {
          textAlign = 'right';
          justifyContent = 'flex-end';
        } else if (cell?.t === 'b') {
          textAlign = 'center';
          justifyContent = 'center';
        } else if (cell?.t === 'd') {
          textAlign = 'right';
          justifyContent = 'flex-end';
        } else if (isMerged) {
          textAlign = 'center';
          justifyContent = 'center';
        }

        cellEl.style.cssText = `
          position: absolute;
          left: ${left}px;
          top: ${top}px;
          width: ${width}px;
          height: ${height}px;
          border-right: ${border};
          border-bottom: ${border};
          ${isPrimary ? 'border: 2px solid var(--selection-border);' : ''}
          background-color: ${bg};
          box-sizing: border-box;
          padding: 3px 8px;
          font-size: 13px;
          font-weight: ${fontWeight};
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: ${textVal.includes('\n') ? 'pre-wrap' : 'nowrap'};
          display: flex;
          align-items: center;
          justify-content: ${justifyContent};
          text-align: ${textAlign};
          z-index: ${zIndex};
          user-select: none;
          cursor: cell;
          font-variant-numeric: tabular-nums;
        `;

        cellEl.textContent = textVal;
        frag.appendChild(cellEl);
      }
    }

    this.cellsContainer.innerHTML = '';
    this.cellsContainer.appendChild(frag);
  }

  private renderSelection(): void {
    if (!this.currentViewport) return;
    const { startRow, endRow, startCol, endCol } = this.currentViewport;
    this.renderViewport(startRow, endRow, startCol, endCol);
  }

  private async copySelectedCells(): Promise<void> {
    const { selectedCell, selectedRange } = session;
    const minR = selectedRange ? Math.min(selectedRange.s.r, selectedRange.e.r) : selectedCell.row;
    const maxR = selectedRange ? Math.max(selectedRange.s.r, selectedRange.e.r) : selectedCell.row;
    const minC = selectedRange ? Math.min(selectedRange.s.c, selectedRange.e.c) : selectedCell.col;
    const maxC = selectedRange ? Math.max(selectedRange.s.c, selectedRange.e.c) : selectedCell.col;

    const vp = await workerClient.getViewport(session.activeSheetIndex, minR, maxR, minC, maxC);
    const rows: string[] = [];

    for (let r = minR; r <= maxR; r++) {
      const rowCols: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        const cell = vp.cells[`${r},${c}`];
        rowCols.push(cell?.w || (cell?.v != null ? String(cell.v) : ''));
      }
      rows.push(rowCols.join('\t'));
    }

    const tsv = rows.join('\n');
    copyText(tsv);
  }

  private handleExternalReference(ref: string): void {
    const parts = ref.split('!');
    if (parts.length === 2) {
      const sheetName = parts[0]!.replace(/^'|'$/g, '');
      const targetCell = parts[1]!;
      const sheetIdx = session.workbook?.sheets.findIndex((s) => s.name === sheetName);
      if (sheetIdx !== undefined && sheetIdx >= 0) {
        session.setActiveSheet(sheetIdx);
      }
      this.jumpToAddress(targetCell);
    } else {
      this.jumpToAddress(ref);
    }
  }

  public jumpToAddress(addr: string): void {
    const match = addr.match(/^([A-Za-z]+)([1-9][0-9]*)$/);
    if (match) {
      let col = 0;
      const cStr = match[1]!.toUpperCase();
      for (let i = 0; i < cStr.length; i++) {
        col = col * 26 + (cStr.charCodeAt(i) - 64);
      }
      col -= 1;
      const row = parseInt(match[2]!, 10) - 1;

      session.setSelectedCell(row, col, false);
      this.fetchActiveCellData(row, col);
      this.scrollCellIntoView(row, col);
    }
  }

  private renderEmpty(): void {
    this.cellsContainer.innerHTML = '';
    this.imagesContainer.innerHTML = '';
    this.colHeadersContainer.innerHTML = '';
    this.rowHeadersContainer.innerHTML = '';
  }
}
