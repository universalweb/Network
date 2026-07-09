import { isArray, isObject, WebComponent } from 'webcomponent';
function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
/**
 * Reusable CSS-grid stat table. All cells live in a single grid container so
 * columns align across header + data rows regardless of row count. The body is
 * rendered as ONE HTML-string spot (`^html${buildTableHtml}`): the header + every
 * data cell are flat grid children with NO per-row wrapper (a row element would
 * break the shared column grid), so a light-row list is the wrong shape here — a
 * single innerHTML patch is the right, injection-safe (escapeHtml) cost for the
 * small read-only tables a dashboard needs.
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
	};
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
	buildTableHtml() {
		const columns = this.state.columns;
		const items = this.state.items;
		const parts = [];
		const columnsLength = columns.length;
		for (let index = 0; index < columnsLength; index += 1) {
			parts.push(`<span class="cell head-cell">${escapeHtml(columns[index].label ?? columns[index].id)}</span>`);
		}
		if (!items.length) {
			parts.push(`<div class="empty">${escapeHtml(this.state.emptyMessage)}</div>`);
			return parts.join('');
		}
		const itemsLength = items.length;
		for (let rowIndex = 0; rowIndex < itemsLength; rowIndex += 1) {
			const cells = this.resolveCells(items[rowIndex], columns);
			const cellsLength = cells.length;
			for (let cellIndex = 0; cellIndex < cellsLength; cellIndex += 1) {
				parts.push(`<span class="cell data-cell">${escapeHtml(cells[cellIndex])}</span>`);
			}
		}
		return parts.join('');
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
					^html${this.buildTableHtml}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-stat-table', UiStatTable);
