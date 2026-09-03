import { t } from '../../core/i18n';
import { session } from '../../core/session';
import { appEvents } from '../../core/event-bus';
import { copyText } from '../../services/clipboard';
import { linkSanitizer } from '../../services/link-sanitizer';
import { encodeAddress } from '../../utils/cell-reference';

export class InspectorComponent {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('aside');
    this.el.className = 'viewer-inspector';

    appEvents.on('session:selectionChanged', () => this.render());
    appEvents.on('session:cellDataChanged', () => this.render());
    appEvents.on('session:mobileInspectorChanged', (open: boolean) => {
      if (open) {
        this.el.classList.add('mobile-open');
      } else {
        this.el.classList.remove('mobile-open');
      }
    });

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  render(): void {
    const { selectedCell, selectedRange, activeCellData } = session;

    const isRange =
      selectedRange &&
      (selectedRange.s.r !== selectedRange.e.r || selectedRange.s.c !== selectedRange.e.c);

    let content = '';

    if (isRange && selectedRange) {
      const minR = Math.min(selectedRange.s.r, selectedRange.e.r);
      const maxR = Math.max(selectedRange.s.r, selectedRange.e.r);
      const minC = Math.min(selectedRange.s.c, selectedRange.e.c);
      const maxC = Math.max(selectedRange.s.c, selectedRange.e.c);
      const rangeAddr = `${encodeAddress(minR, minC)}:${encodeAddress(maxR, maxC)}`;
      const cellCount = (maxR - minR + 1) * (maxC - minC + 1);

      content = `
        <div style="padding: var(--space-4); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 15px; color: var(--text-primary);">${rangeAddr}</span>
          <button class="btn btn-icon btn-sm" id="close-inspector-btn" style="display: none;" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4);">
          <div style="font-size: 14px; color: var(--text-secondary);">
            ${t('inspector.selectedCells', { count: cellCount })}
          </div>
          <button class="btn btn-secondary btn-sm" id="copy-range-btn" style="width: 100%;">
            ${t('common.copy')}
          </button>
        </div>
      `;
    } else {
      const addr = encodeAddress(selectedCell.row, selectedCell.col);
      const cell = activeCellData;

      const displayedVal = cell?.w || (cell?.v != null ? String(cell.v) : '');
      const rawVal = cell?.v != null ? String(cell.v) : '';
      const formulaVal = cell?.f ? `=${cell.f}` : '';

      const typeMap: Record<string, string> = {
        n: 'Number',
        s: 'Text',
        b: 'Boolean',
        d: 'Date',
        e: 'Error',
        z: 'Empty',
      };
      const typeLabel = cell?.t ? typeMap[cell.t] || cell.t : 'Empty';

      content = `
        <div style="padding: var(--space-4); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 700; font-size: 15px; color: var(--text-primary);">${addr}</span>
          <button class="btn btn-icon btn-sm" id="close-inspector-btn" style="display: none;" aria-label="${t('common.close')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style="padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4); flex: 1; overflow-y: auto;">
          ${
            displayedVal
              ? `
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
                ${t('inspector.displayed')}
              </div>
              <div style="font-size: 14px; color: var(--text-primary); word-break: break-word; background: var(--bg-subtle); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                ${this.escapeHtml(displayedVal)}
              </div>
            </div>
          `
              : ''
          }

          ${
            rawVal && rawVal !== displayedVal
              ? `
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
                ${t('inspector.raw')}
              </div>
              <div style="font-size: 13px; font-family: var(--font-mono); color: var(--text-secondary); word-break: break-all; background: var(--bg-subtle); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                ${this.escapeHtml(rawVal)}
              </div>
            </div>
          `
              : ''
          }

          ${
            formulaVal
              ? `
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
                ${t('inspector.formula')}
              </div>
              <div style="font-size: 13px; font-family: var(--font-mono); color: var(--accent); word-break: break-all; background: var(--bg-subtle); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                ${this.escapeHtml(formulaVal)}
              </div>
            </div>
          `
              : ''
          }

          <div>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
              ${t('inspector.type')}
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);">
              <span class="badge">${typeLabel}</span>
            </div>
          </div>

          ${
            cell?.l?.target
              ? `
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
                ${t('inspector.hyperlink')}
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="font-size: 12px; font-family: var(--font-mono); color: var(--accent); word-break: break-all;">
                  ${this.escapeHtml(cell.l.target)}
                </div>
                <button class="btn btn-secondary btn-sm" id="open-link-btn" style="align-self: flex-start;">
                  Open Link
                </button>
              </div>
            </div>
          `
              : ''
          }

          ${
            cell?.c
              ? `
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">
                ${t('inspector.comment')}
              </div>
              <div style="font-size: 13px; color: var(--text-secondary); background: var(--warning-soft); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--warning);">
                ${this.escapeHtml(cell.c)}
              </div>
            </div>
          `
              : ''
          }

          <div style="margin-top: auto; display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--border);">
            ${
              displayedVal
                ? `
              <button class="btn btn-secondary btn-sm" id="copy-val-btn">
                ${t('inspector.copyValue')}
              </button>
            `
                : ''
            }
            ${
              formulaVal
                ? `
              <button class="btn btn-secondary btn-sm" id="copy-formula-btn">
                ${t('inspector.copyFormula')}
              </button>
            `
                : ''
            }
          </div>
        </div>
      `;
    }

    this.el.innerHTML = content;

    // Hook close button on mobile
    const closeBtn = this.el.querySelector('#close-inspector-btn');
    if (closeBtn) {
      if (window.innerWidth <= 900) {
        (closeBtn as HTMLElement).style.display = 'inline-flex';
      }
      closeBtn.addEventListener('click', () => {
        session.setMobileInspector(false);
      });
    }

    // Copy actions
    const copyValBtn = this.el.querySelector('#copy-val-btn');
    if (copyValBtn) {
      copyValBtn.addEventListener('click', () => {
        const val = activeCellData?.w || (activeCellData?.v != null ? String(activeCellData.v) : '');
        copyText(val);
      });
    }

    const copyFormulaBtn = this.el.querySelector('#copy-formula-btn');
    if (copyFormulaBtn && activeCellData?.f) {
      copyFormulaBtn.addEventListener('click', () => {
        copyText(`=${activeCellData.f}`);
      });
    }

    const copyRangeBtn = this.el.querySelector('#copy-range-btn');
    if (copyRangeBtn) {
      copyRangeBtn.addEventListener('click', () => {
        // Range copy triggered from grid/selection
        appEvents.emit('grid:copySelection');
      });
    }

    // Open link action
    const openLinkBtn = this.el.querySelector('#open-link-btn');
    if (openLinkBtn && activeCellData?.l?.target) {
      openLinkBtn.addEventListener('click', () => {
        const target = activeCellData.l!.target;
        const check = linkSanitizer.checkLink(target);
        if (check.isInternal) {
          // Internal reference jump
          appEvents.emit('goto:reference', check.url.replace(/^#/, ''));
        } else if (check.allowed) {
          // Open external link confirmation modal
          session.setModal('externalLink', target);
        } else {
          // Blocked hazardous scheme
          alert(t('security.blockedLinkDesc', { protocol: check.scheme }));
        }
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
