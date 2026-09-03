import { SheetJSAdapter } from './sheetjs-adapter';
import { WorkerRequest, WorkerResponse } from './protocol';

const adapter = new SheetJSAdapter();
let currentGeneration = 0;
let searchCancelled = false;

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (!req || typeof req !== 'object') return;

  const { id, generation, type } = req;

  // Reject stale requests from older generations, except for CLOSE
  if (type !== 'OPEN_WORKBOOK' && generation < currentGeneration) {
    return;
  }

  try {
    switch (type) {
      case 'OPEN_WORKBOOK': {
        currentGeneration = generation;
        searchCancelled = false;
        adapter.close();

        postResponse({
          id,
          generation,
          type: 'PROGRESS',
          payload: { stage: 'reading', detail: 'Reading workbook file...' },
        });

        // Small yield to let progress events be received
        await new Promise((r) => setTimeout(r, 10));

        postResponse({
          id,
          generation,
          type: 'PROGRESS',
          payload: { stage: 'discovering', detail: 'Discovering worksheets...' },
        });

        const summary = adapter.open(
          req.payload.buffer,
          req.payload.filename,
          req.payload.fileSize
        );

        postResponse({
          id,
          generation,
          type: 'PROGRESS',
          payload: { stage: 'preparing', detail: 'Preparing workbook structure...' },
        });

        postResponse({
          id,
          generation,
          type: 'WORKBOOK_SUMMARY',
          payload: summary,
        });
        break;
      }

      case 'GET_WORKBOOK_SUMMARY': {
        const summary = adapter.getWorkbookSummary();
        postResponse({
          id,
          generation,
          type: 'WORKBOOK_SUMMARY',
          payload: summary,
        });
        break;
      }

      case 'GET_SHEET_SUMMARY': {
        const summary = adapter.getSheetSummary(req.payload.sheetIndex);
        postResponse({
          id,
          generation,
          type: 'SHEET_SUMMARY',
          payload: summary,
        });
        break;
      }

      case 'GET_VIEWPORT': {
        const { sheetIndex, startRow, endRow, startCol, endCol } = req.payload;
        const viewport = adapter.getViewport(
          sheetIndex,
          startRow,
          endRow,
          startCol,
          endCol
        );
        postResponse({
          id,
          generation,
          type: 'VIEWPORT_DATA',
          payload: viewport,
        });
        break;
      }

      case 'GET_CELL': {
        const { sheetIndex, row, col } = req.payload;
        const cell = adapter.getCell(sheetIndex, row, col);
        postResponse({
          id,
          generation,
          type: 'CELL_DATA',
          payload: cell,
        });
        break;
      }

      case 'SEARCH': {
        searchCancelled = false;
        const { query, sheetIndex, matchCase } = req.payload;
        const results = adapter.search(query, sheetIndex, matchCase);

        if (!searchCancelled) {
          postResponse({
            id,
            generation,
            type: 'SEARCH_RESULTS',
            payload: { results, done: true },
          });
        }
        break;
      }

      case 'CANCEL_SEARCH': {
        searchCancelled = true;
        break;
      }

      case 'CLOSE_WORKBOOK': {
        adapter.close();
        postResponse({
          id,
          generation,
          type: 'CLOSE_SUCCESS',
        });
        break;
      }

      default:
        console.warn('Unknown worker request type:', (req as any).type);
    }
  } catch (err: any) {
    postResponse({
      id,
      generation,
      type: 'ERROR',
      payload: {
        code: err.code || 'PARSE_ERROR',
        message: err.message || 'Failed to process spreadsheet',
      },
    });
  }
};

function postResponse(res: WorkerResponse): void {
  self.postMessage(res);
}
