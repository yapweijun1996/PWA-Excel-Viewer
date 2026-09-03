import {
  WorkerRequest,
  WorkerResponse,
  WorkbookSummary,
  SheetSummary,
  ViewportData,
  CellData,
  SearchResult,
} from '../worker/protocol';

export type ProgressCallback = (stage: string, detail?: string) => void;

export class WorkerClient {
  private worker: Worker | null = null;
  private generation = 0;
  private pendingRequests = new Map<
    string,
    {
      resolve: (val: any) => void;
      reject: (err: any) => void;
      generation: number;
    }
  >();
  private activeProgressCallback: ProgressCallback | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      this.worker = new Worker(
        new URL('../worker/workbook.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        this.handleMessage(e.data);
      };

      this.worker.onerror = (err) => {
        console.error('Workbook worker error:', err);
      };
    } catch (e) {
      console.warn('Web Worker initialization failed, check environment', e);
    }
  }

  private handleMessage(res: WorkerResponse): void {
    if (!res || typeof res !== 'object') return;

    // Handle progress events
    if (res.type === 'PROGRESS') {
      if (this.activeProgressCallback) {
        this.activeProgressCallback(res.payload.stage, res.payload.detail);
      }
      return;
    }

    const { id, generation, type } = res;
    const pending = this.pendingRequests.get(id);
    if (!pending) return;

    // Reject stale responses
    if (generation < pending.generation) {
      this.pendingRequests.delete(id);
      return;
    }

    this.pendingRequests.delete(id);

    if (type === 'ERROR') {
      pending.reject(new Error(res.payload.message || 'Worker error'));
    } else if (type === 'CLOSE_SUCCESS') {
      pending.resolve(undefined);
    } else {
      pending.resolve(res.payload);
    }
  }

  private sendRequest<T>(
    type: WorkerRequest['type'],
    payload?: any,
    transfer?: Transferable[]
  ): Promise<T> {
    if (!this.worker) {
      return Promise.reject(new Error('Web Worker not available in this environment'));
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const gen = this.generation;

    const msg = {
      id,
      generation: gen,
      type,
      payload,
    } as WorkerRequest;

    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject, generation: gen });
      if (transfer && transfer.length > 0) {
        this.worker!.postMessage(msg, transfer);
      } else {
        this.worker!.postMessage(msg);
      }
    });
  }

  async openWorkbook(
    file: File | { buffer: ArrayBuffer; name: string; size: number },
    onProgress?: ProgressCallback
  ): Promise<WorkbookSummary> {
    this.generation++;
    this.activeProgressCallback = onProgress || null;

    let buffer: ArrayBuffer;
    let filename: string;
    let fileSize: number;

    if (file instanceof File) {
      filename = file.name;
      fileSize = file.size;
      buffer = await file.arrayBuffer();
    } else {
      filename = file.name;
      fileSize = file.size;
      buffer = file.buffer;
    }

    try {
      const summary = await this.sendRequest<WorkbookSummary>(
        'OPEN_WORKBOOK',
        { buffer, filename, fileSize },
        [buffer]
      );
      this.activeProgressCallback = null;
      return summary;
    } catch (err) {
      this.activeProgressCallback = null;
      throw err;
    }
  }

  getWorkbookSummary(): Promise<WorkbookSummary> {
    return this.sendRequest<WorkbookSummary>('GET_WORKBOOK_SUMMARY');
  }

  getSheetSummary(sheetIndex: number): Promise<SheetSummary> {
    return this.sendRequest<SheetSummary>('GET_SHEET_SUMMARY', { sheetIndex });
  }

  getViewport(
    sheetIndex: number,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): Promise<ViewportData> {
    return this.sendRequest<ViewportData>('GET_VIEWPORT', {
      sheetIndex,
      startRow,
      endRow,
      startCol,
      endCol,
    });
  }

  getCell(sheetIndex: number, row: number, col: number): Promise<CellData | null> {
    return this.sendRequest<CellData | null>('GET_CELL', {
      sheetIndex,
      row,
      col,
    });
  }

  search(
    query: string,
    sheetIndex?: number,
    matchCase = false
  ): Promise<{ results: SearchResult[]; done: boolean }> {
    return this.sendRequest<{ results: SearchResult[]; done: boolean }>('SEARCH', {
      query,
      sheetIndex,
      matchCase,
    });
  }

  cancelSearch(): void {
    if (this.worker) {
      const msg: WorkerRequest = {
        id: `cancel_${Date.now()}`,
        generation: this.generation,
        type: 'CANCEL_SEARCH',
      };
      this.worker.postMessage(msg);
    }
  }

  async closeWorkbook(): Promise<void> {
    this.generation++;
    this.pendingRequests.clear();
    this.activeProgressCallback = null;
    if (this.worker) {
      try {
        await this.sendRequest('CLOSE_WORKBOOK');
      } catch {
        // ignore
      }
    }
  }
}

export const workerClient = new WorkerClient();
