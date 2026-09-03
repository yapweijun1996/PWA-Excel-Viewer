import { WorkbookSummary, CellData, CellRange, SearchResult } from '../worker/protocol';
import { appEvents } from './event-bus';

export class SessionState {
  workbook: WorkbookSummary | null = null;
  activeSheetIndex = 0;
  selectedCell = { row: 0, col: 0 };
  selectedRange: CellRange | null = null;
  activeCellData: CellData | null = null;

  // Viewport
  viewportRowStart = 0;
  viewportRowEnd = 50;
  viewportColStart = 0;
  viewportColEnd = 20;

  // Search
  searchQuery = '';
  searchResults: SearchResult[] = [];
  activeSearchResultIndex = -1;

  // Panel Collapses
  navigatorCollapsed = false;
  inspectorCollapsed = false;

  // Mobile Overlays
  mobileNavigatorOpen = false;
  mobileInspectorOpen = false;

  // Modals
  activeModal: 'search' | 'goto' | 'warnings' | 'externalLink' | 'updatePrompt' | null = null;
  pendingExternalUrl = '';

  setWorkbook(wb: WorkbookSummary | null): void {
    this.workbook = wb;
    this.activeSheetIndex = 0;
    this.selectedCell = { row: 0, col: 0 };
    this.selectedRange = null;
    this.activeCellData = null;
    this.searchQuery = '';
    this.searchResults = [];
    this.activeSearchResultIndex = -1;
    this.activeModal = null;
    appEvents.emit('session:workbookChanged', wb);
  }

  setActiveSheet(index: number): void {
    if (!this.workbook || index < 0 || index >= this.workbook.sheets.length) return;
    this.activeSheetIndex = index;
    this.selectedCell = { row: 0, col: 0 };
    this.selectedRange = null;
    this.activeCellData = null;
    this.mobileNavigatorOpen = false;
    appEvents.emit('session:sheetChanged', index);
  }

  setSelectedCell(row: number, col: number, extendRange = false): void {
    if (extendRange && this.selectedRange) {
      this.selectedRange = {
        s: this.selectedRange.s,
        e: { r: row, c: col },
      };
    } else {
      this.selectedCell = { row, col };
      this.selectedRange = {
        s: { r: row, c: col },
        e: { r: row, c: col },
      };
    }
    appEvents.emit('session:selectionChanged', {
      cell: this.selectedCell,
      range: this.selectedRange,
    });
  }

  setSelectedRange(range: CellRange): void {
    this.selectedRange = range;
    this.selectedCell = { row: range.s.r, col: range.s.c };
    appEvents.emit('session:selectionChanged', {
      cell: this.selectedCell,
      range: this.selectedRange,
    });
  }

  setActiveCellData(cell: CellData | null): void {
    this.activeCellData = cell;
    appEvents.emit('session:cellDataChanged', cell);
  }

  setModal(modal: SessionState['activeModal'], extraUrl = ''): void {
    this.activeModal = modal;
    this.pendingExternalUrl = extraUrl;
    appEvents.emit('session:modalChanged', modal);
  }

  setMobileNavigator(open: boolean): void {
    this.mobileNavigatorOpen = open;
    appEvents.emit('session:mobileNavChanged', open);
  }

  setMobileInspector(open: boolean): void {
    this.mobileInspectorOpen = open;
    appEvents.emit('session:mobileInspectorChanged', open);
  }
}

export const session = new SessionState();
