import { NavigatorComponent } from './navigator';
import { FormulaBarComponent } from './formula-bar';
import { GridComponent } from './grid';
import { OverviewComponent } from './overview';
import { SheetTabsComponent } from './sheet-tabs';
import { InspectorComponent } from './inspector';

export class ViewerView {
  private el: HTMLElement;
  private navigator: NavigatorComponent;
  private formulaBar: FormulaBarComponent;
  private grid: GridComponent;
  private overview: OverviewComponent;
  private sheetTabs: SheetTabsComponent;
  private inspector: InspectorComponent;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'viewer-layout';

    this.navigator = new NavigatorComponent();
    this.formulaBar = new FormulaBarComponent();
    this.grid = new GridComponent();
    this.overview = new OverviewComponent();
    this.sheetTabs = new SheetTabsComponent();
    this.inspector = new InspectorComponent();

    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  getGrid(): GridComponent {
    return this.grid;
  }

  render(): void {
    this.el.innerHTML = '';

    // Left Navigator
    this.el.appendChild(this.navigator.getElement());

    // Center Workspace
    const workspace = document.createElement('div');
    workspace.className = 'viewer-workspace';

    workspace.appendChild(this.formulaBar.getElement());
    workspace.appendChild(this.overview.getElement());
    workspace.appendChild(this.grid.getElement());
    workspace.appendChild(this.sheetTabs.getElement());

    this.el.appendChild(workspace);

    // Right Inspector
    this.el.appendChild(this.inspector.getElement());
  }
}
