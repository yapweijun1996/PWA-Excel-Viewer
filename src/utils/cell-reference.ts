export interface ParsedCellRef {
  sheetName?: string;
  address: string;
  col: number; // 0-based
  row: number; // 0-based
}

export function colNameToIndex(colName: string): number {
  let index = 0;
  const upper = colName.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColName(index: number): string {
  let name = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

export function encodeAddress(row: number, col: number): string {
  return `${indexToColName(col)}${row + 1}`;
}

export function parseCellReference(raw: string): ParsedCellRef | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Regex matches:
  // Optional sheet: (?:'([^']+)'|([A-Za-z0-9_]+))!
  // Cell: ([A-Za-z]+)([1-9][0-9]*)
  const match = trimmed.match(/^(?:(?:'([^']+)'|([A-Za-z0-9_\s-]+))!)?\$?([A-Za-z]+)\$?([1-9][0-9]*)$/);
  if (!match) return null;

  const sheetName = match[1] || match[2] || undefined;
  const colStr = match[3]!;
  const rowStr = match[4]!;

  const col = colNameToIndex(colStr);
  const row = parseInt(rowStr, 10) - 1;

  if (col < 0 || row < 0 || col > 16383 || row > 1048575) {
    return null;
  }

  const address = `${colStr.toUpperCase()}${rowStr}`;

  return {
    sheetName: sheetName ? sheetName.trim() : undefined,
    address,
    col,
    row,
  };
}
