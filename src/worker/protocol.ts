export interface CellData {
  address: string;
  row: number;
  col: number;
  v: any;
  w: string;
  t: string;
  f?: string;
  c?: string;
  l?: { target: string; tooltip?: string };
}

export interface SheetSummary {
  name: string;
  index: number;
  hidden: 'visible' | 'hidden' | 'veryHidden';
  rowCount: number;
  colCount: number;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  cellCount: number;
}

export interface WorkbookSummary {
  filename: string;
  fileSize: number;
  fileType: string;
  sheetCount: number;
  sheets: SheetSummary[];
  hasMacros: boolean;
  macroCount: number;
  hiddenSheetCount: number;
  totalCells: number;
  totalFormulas: number;
  totalLinks: number;
  totalMerges: number;
  warnings: string[];
}

export interface CellRange {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

export interface ViewportData {
  sheetIndex: number;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  cells: Record<string, CellData>; // key: `${r},${c}`
  merges: CellRange[];
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

export interface SearchResult {
  sheetIndex: number;
  sheetName: string;
  address: string;
  row: number;
  col: number;
  value: string;
  isFormula: boolean;
}

export type WorkerRequest =
  | { id: string; generation: number; type: 'OPEN_WORKBOOK'; payload: { buffer: ArrayBuffer; filename: string; fileSize: number } }
  | { id: string; generation: number; type: 'GET_WORKBOOK_SUMMARY' }
  | { id: string; generation: number; type: 'GET_SHEET_SUMMARY'; payload: { sheetIndex: number } }
  | { id: string; generation: number; type: 'GET_VIEWPORT'; payload: { sheetIndex: number; startRow: number; endRow: number; startCol: number; endCol: number } }
  | { id: string; generation: number; type: 'GET_CELL'; payload: { sheetIndex: number; row: number; col: number } }
  | { id: string; generation: number; type: 'SEARCH'; payload: { query: string; sheetIndex?: number; matchCase?: boolean } }
  | { id: string; generation: number; type: 'CANCEL_SEARCH' }
  | { id: string; generation: number; type: 'CLOSE_WORKBOOK' };

export type WorkerResponse =
  | { id: string; generation: number; type: 'PROGRESS'; payload: { stage: 'reading' | 'discovering' | 'preparing' | 'indexing'; detail?: string } }
  | { id: string; generation: number; type: 'WORKBOOK_SUMMARY'; payload: WorkbookSummary }
  | { id: string; generation: number; type: 'SHEET_SUMMARY'; payload: SheetSummary }
  | { id: string; generation: number; type: 'VIEWPORT_DATA'; payload: ViewportData }
  | { id: string; generation: number; type: 'CELL_DATA'; payload: CellData | null }
  | { id: string; generation: number; type: 'SEARCH_RESULTS'; payload: { results: SearchResult[]; done: boolean } }
  | { id: string; generation: number; type: 'CLOSE_SUCCESS' }
  | { id: string; generation: number; type: 'ERROR'; payload: { code: string; message: string } };
