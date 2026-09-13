/*
	DESCRIPTION: ui-table — simple data table (Table).
	columns: [{ key, label, align?, renderCell? }]; items: row objects.
	renderCell is the same duality as ui-collection renderRow: a function
	returns a plain cell value (auto-escaped text in the <td>) or a component
	class is list()'d inside the <td>. Absent → String(item[key]) text.
	Emits table:row-click { item, index }.
*/
import {
	html, isArray, isFunction, noValue, WebComponent,
} from 'webcomponent';
import { isCellComponent } from '../table-cell/table-cell.js';
import { UITableRow } from '../table-row/table-row.js';
/**
 * Observe-time cell bag. Function hooks run here (plain value → `text`);
 * class hooks stamp `inner` for list('inner', Class) inside ui-table-cell.
 * @param {object} column - Column descriptor (`key`, `align`, `renderCell?`).
 * @param {object} item - Source row object.
 * @returns {object} Cell bag for ui-table-cell.
 */
function paintCell(column, item) {
	const key = column.key;
	const raw = item[key];
	const hook = column.renderCell;
	const text = noValue(raw) ? '' : String(raw);
	const align = column.align || 'start';
	const cell = {
		key,
		text,
		align,
		inner: [],
	};
	if (isCellComponent(hook)) {
		cell.renderCell = hook;
		cell.inner = [
			{
				key,
				text,
				align,
				value: raw,
				item,
			},
		];
		return cell;
	}
	if (isFunction(hook)) {
		cell.item = item;
		cell.value = raw;
		const painted = hook(cell);
		cell.text = noValue(painted) ? '' : String(painted);
	}
	return cell;
}
export class UITable extends WebComponent {
	static url = import.meta.url;
	static styles = {
		table: './table.css',
	};
	static state = {
		columns: [],
		items: [],
		/*
		 * Derived rows for list() — stamped with `index` and per-column `cells`.
		 * Rebuilt only when source items or columns identity/length change
		 * (never on every parent patch).
		 */
		indexedItems: [],
		heading: '',
		emptyMessage: 'No data.',
		density: 'md',
	};
	// Last source identity/length used to build indexedItems (plain fields).
	indexedSourceRef = null;
	indexedSourceLen = -1;
	indexedColumnsRef = null;
	indexedColumnsLen = -1;
	onConnect() {
		this.syncIndexedItems();
		this.observe([
			'items',
			'columns',
		], this.syncIndexedItems);
		this.on('table-row:click', this.handleRowClick);
	}
	/**
	 * Rebuild indexedItems only when items or columns are a new reference or a
	 * different length. Rebuilding on every parent rebind floods preview with
	 * wasted sets on indexedItems.
	 */
	syncIndexedItems() {
		const items = this.state.items;
		if (!isArray(items)) {
			if (this.state.indexedItems.length > 0) {
				this.state.indexedItems = [];
			}
			this.indexedSourceRef = null;
			this.indexedSourceLen = -1;
			this.indexedColumnsRef = null;
			this.indexedColumnsLen = -1;
			return;
		}
		const columns = this.state.columns;
		const count = items.length;
		const columnCount = isArray(columns) ? columns.length : 0;
		if (
			items === this.indexedSourceRef &&
			count === this.indexedSourceLen &&
			columns === this.indexedColumnsRef &&
			columnCount === this.indexedColumnsLen
		) {
			return;
		}
		const next = [];
		for (let index = 0; index < count; index += 1) {
			const item = items[index] || {};
			const cells = new Array(columnCount);
			for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
				cells[columnIndex] = paintCell(columns[columnIndex], item);
			}
			next.push({
				...item,
				index,
				cells,
			});
		}
		this.indexedSourceRef = items;
		this.indexedSourceLen = count;
		this.indexedColumnsRef = columns;
		this.indexedColumnsLen = columnCount;
		this.state.indexedItems = next;
	}
	handleRowClick(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.emit('table:row-click', {
			item: data.item,
			index: data.index,
		});
	}
	rowKey(item) {
		return item.id ?? item.key ?? item.index;
	}
	headCell(column) {
		return html`<th class="table-header-cell" data-align=${column.align || 'start'}>${column.label || column.key || ''}</th>`;
	}
	render() {
		this.html`
			<div class="table-frame" data-density=${this.state.density}>
				<div class="table-caption" ?hidden=${!this.state.heading}>${this.state.heading}</div>
				<table class="table">
					<thead class="table-head">
						<tr class="table-header-row">${this.list('columns', this.headCell)}</tr>
					</thead>
					<tbody class="table-body">
						${this.list('indexedItems', UITableRow, this.rowKey)}
					</tbody>
				</table>
				<div class="table-empty" ?hidden=${this.state.items.length > 0}>${this.state.emptyMessage}</div>
			</div>
		`;
	}
}
customElements.define('ui-table', UITable);
