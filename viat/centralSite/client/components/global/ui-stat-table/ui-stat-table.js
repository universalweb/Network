import {
	html, isArray, isObject, WebComponent,
} from 'webcomponent';
/**
 * Reusable CSS-grid stat table. All cells live in a single grid container so
 * columns align across header + data rows regardless of row count. Header + data
 * cells are flat grid children (no per-row wrapper — that would break the shared
 * column grid). Rendered via `list('cells', this.cellRow)` light html rows —
 * auto-escaped text, no local escapeHtml / `^html` string builder.
 *
 * Usage:
 *   <ui-stat-table .state=${{
 *     heading: 'Operation stats',
 *     columns: [
 *       { id: 'category', label: 'category', width: '2fr' },
 *       { id: 'count', label: 'count' },
 *     ],
 *     items: [
 *       { key: 'connect', cells: ['connect', 500] },
 *       { key: 'render', cells: ['render', 320] },
 *     ],
 *   }}></ui-stat-table>.
 *
 * Rows (`items`) accept three shapes:
 *   - Array of cells:           [cell0, cell1, …]
 *   - Object with .cells array: { key, cells: [cell0, …] }
 *   - Object keyed by column id: { key, [col.id]: cellValue, … }.
 */
export class UiStatTable extends WebComponent {
	static url = import.meta.url;
	static styles = {
		uiStatTable: './ui-stat-table.css',
	};
	static state = {
		heading: '',
		hint: '',
		columns: [],
		items: [],
		emptyMessage: 'no rows',
		// Flat grid cells for list() — rebuilt when columns/items change.
		cells: [],
	};
	onConnect() {
		this.observe('columns', this.syncCells);
		this.observe('items', this.syncCells);
		this.observe('emptyMessage', this.syncCells);
		this.syncCells();
	}
	gridTemplate() {
		const columns = this.state.columns;
		const columnsLength = columns.length;
		const parts = new Array(columnsLength);
		for (let index = 0; index < columnsLength; index += 1) {
			parts[index] = columns[index].width ?? '1fr';
		}
		return parts.join(' ');
	}
	resolveCells(row, columns) {
		if (isArray(row)) {
			return row;
		}
		if (!isObject(row)) {
			return [row];
		}
		if (isArray(row.cells)) {
			return row.cells;
		}
		const columnsLength = columns.length;
		const cells = new Array(columnsLength);
		for (let columnIndex = 0; columnIndex < columnsLength; columnIndex += 1) {
			cells[columnIndex] = row[columns[columnIndex].id] ?? '';
		}
		return cells;
	}
	syncCells() {
		const columns = this.state.columns;
		const items = this.state.items;
		const next = [];
		const columnsLength = columns.length;
		for (let index = 0; index < columnsLength; index += 1) {
			const column = columns[index];
			next.push({
				id: `h-${column.id ?? index}`,
				text: column.label ?? column.id ?? '',
				head: true,
				empty: false,
			});
		}
		if (!items.length) {
			next.push({
				id: 'empty',
				text: this.state.emptyMessage,
				head: false,
				empty: true,
			});
			this.state.cells = next;
			return;
		}
		const itemsLength = items.length;
		for (let rowIndex = 0; rowIndex < itemsLength; rowIndex += 1) {
			const row = items[rowIndex];
			const rowKey = isObject(row) && row.key != null ? row.key : rowIndex;
			const values = this.resolveCells(row, columns);
			const valuesLength = values.length;
			for (let cellIndex = 0; cellIndex < valuesLength; cellIndex += 1) {
				next.push({
					id: `c-${rowKey}-${cellIndex}`,
					text: values[cellIndex] == null ? '' : String(values[cellIndex]),
					head: false,
					empty: false,
				});
			}
		}
		this.state.cells = next;
	}
	cellRow(item) {
		if (item.empty) {
			return html`<div class="empty">${item.text}</div>`;
		}
		const className = item.head ? 'cell head-cell' : 'cell data-cell';
		return html`<span class=${className}>${item.text}</span>`;
	}
	cellKey(item) {
		return item.id;
	}
	render() {
		const template = this.gridTemplate();
		this.html`
			<section class="table-wrap">
				<header class=${`table-head${this.state.heading ? '' : ' is-empty'}`}>
					<h3>${this.state.heading}</h3>
					<p class="hint">${this.state.hint}</p>
				</header>
				<div class="grid-table" style=${`grid-template-columns: ${template};`}>
					${this.list('cells', this.cellRow, this.cellKey)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-stat-table', UiStatTable);
