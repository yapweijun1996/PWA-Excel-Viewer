import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';
import { encodeAddress } from '../../utils/cell-reference';

export class FormulaBarComponent {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'formula-bar';

    appEvents.on('session:selectionChanged', () => this.update());
    appEvents.on('session:cellDataChanged', () => this.update());

    this.update();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private update(): void {
    const { selectedCell, activeCellData } = session;
    const address = encodeAddress(selectedCell.row, selectedCell.col);

    let displayVal = '';
    if (activeCellData) {
      displayVal = activeCellData.f ? `=${activeCellData.f}` : activeCellData.w || String(activeCellData.v || '');
    }

    this.el.innerHTML = `
      <div class="formula-address" title="Selected cell">${address}</div>
      <div class="formula-value" title="${displayVal}">${this.escapeHtml(displayVal)}</div>
    `;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
