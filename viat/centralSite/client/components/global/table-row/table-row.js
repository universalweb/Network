/*
	DESCRIPTION: ui-table-row — one body row for ui-table.
	Cells always paint through ui-table-cell (component list). That is the
	collection dual: a function hook stays a value inside the cell's <td>;
	a class hook is list()'d as a child component inside that <td>.
*/
import { WebComponent } from 'webcomponent';
import { UITableCell } from '../table-cell/table-cell.js';
export class UITableRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tableRow: './table-row.css',
	};
	static state = {
		index: 0,
		cells: [],
	};
	handleClick() {
		const host = this.parentComponent;
		const index = Number(this.state.index);
		const item = host?.state?.items?.[index];
		this.emit('table-row:click', {
			index,
			item: item || null,
		});
	}
	cellKey(cell) {
		return cell.key;
	}
	render() {
		/*
		 * Host IS the table-row (display:table-row). A nested <tr> inside shadow
		 * breaks table geometry. Wrapper uses display:contents so the cells'
		 * <td>s (via ui-table-cell display:contents) participate as the row's
		 * cells. list() elides onto the wrapper.
		 */
		this.html`
			<div class="table-row" @click=${this.handleClick}>${this.list('cells', UITableCell, this.cellKey)}</div>
		`;
	}
}
customElements.define('ui-table-row', UITableRow);
