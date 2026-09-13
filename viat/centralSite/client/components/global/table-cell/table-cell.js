/*
	DESCRIPTION: ui-table-cell — one body cell for ui-table.
	Always a component row (list('cells', UITableCell)). Owns the real <td>.
	Light-DOM host (useShadow=false) so the <td> is a light child of this
	element, which itself sits in ui-table-row's shadow. display:contents is
	set by table-row.css (.table-row > ui-table-cell) — a document-scoped
	light-DOM sheet cannot pierce the row shadow to reach this host.
	Function / default path: flatten already stamped `text` (auto-escaped).
	Class path: list('inner', Class) inside the <td> — collection renderRow
	duality. No nested html`` in a light row.
*/
import { WebComponent } from 'webcomponent';
import { isCustomElementConstructor } from '../../core/template/list.js';
export { isCustomElementConstructor as isCellComponent };
export class UITableCell extends WebComponent {
	static url = import.meta.url;
	static useShadow = false;
	static styles = {
		tableCell: './table-cell.css',
	};
	static state = {
		key: '',
		text: '',
		align: 'start',
		value: null,
		item: null,
		tone: '',
		renderCell: null,
		inner: [],
	};
	/* Class value for list() — a method ref would be treated as a light-row fn. */
	cellKind = null;
	render() {
		if (isCustomElementConstructor(this.state.renderCell)) {
			this.cellKind = this.state.renderCell;
			this.html`<td class="table-cell" data-align=${this.state.align}>${this.list('inner', this.cellKind)}</td>`;
			return;
		}
		this.html`<td class="table-cell" data-align=${this.state.align} data-tone=${this.state.tone}>${this.state.text}</td>`;
	}
}
customElements.define('ui-table-cell', UITableCell);
