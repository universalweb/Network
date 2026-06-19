import { WebComponent } from '../../core/index.js';
function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
/**
 * Reusable CSS-grid stat table. All cells live in a single grid container so
 * columns align across header + data rows regardless of row count. The body
 * is rendered as one HTML-string spot per table — re-renders patch innerHTML
 * once, not N×M sub-components, which is the right cost shape for the small
 * read-only tables a dashboard needs.
 *
 * Usage:
 *   <ui-stat-table .state=${{
 *     title: 'Operation stats',
 *     columns: [
 *       { id: 'category', label: 'category', width: '2fr' },
 *       { id: 'count', label: 'count' },
 *     ],
 *     rows: [
 *       { key: 'connect', cells: ['connect', 500] },
 *       { key: 'render', cells: ['render', 320] },
 *     ],
 *   }}></ui-stat-table>.
 *
 * Rows accept three shapes:
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
		title: '',
		hint: '',
		columns: [],
		rows: [],
		emptyMessage: 'no rows',
	};
	gridTemplate() {
		const columns = this.state.columns;
		const parts = new Array(columns.length);
		for (let i = 0; i < columns.length; i++) {
			parts[i] = columns[i].width ?? '1fr';
		}
		return parts.join(' ');
	}
	resolveCells(row, columns) {
		if (Array.isArray(row)) {
			return row;
		}
		if (row && typeof row === 'object' && Array.isArray(row.cells)) {
			return row.cells;
		}
		if (row && typeof row === 'object') {
			const cells = new Array(columns.length);
			for (let c = 0; c < columns.length; c++) {
				cells[c] = row[columns[c].id] ?? '';
			}
			return cells;
		}
		return [row];
	}
	buildTableHtml() {
		const columns = this.state.columns;
		const rows = this.state.rows;
		const parts = [];
		for (let i = 0; i < columns.length; i++) {
			parts.push(`<span class="cell head-cell">${escapeHtml(columns[i].label ?? columns[i].id)}</span>`);
		}
		if (!rows.length) {
			parts.push(`<div class="empty">${escapeHtml(this.state.emptyMessage)}</div>`);
			return parts.join('');
		}
		for (let i = 0; i < rows.length; i++) {
			const cells = this.resolveCells(rows[i], columns);
			for (let c = 0; c < cells.length; c++) {
				parts.push(`<span class="cell data-cell">${escapeHtml(cells[c])}</span>`);
			}
		}
		return parts.join('');
	}
	render() {
		const template = this.gridTemplate();		this.html `
			<section class="table-wrap">
				<header class="table-head ${this.state.title ? '' : 'is-empty'}">
					<h3>${this.state.title}</h3>
					<p class="hint">${this.state.hint}</p>
				</header>
				<div class="grid-table" style="grid-template-columns: ${template};">
					^html${this.buildTableHtml}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-stat-table', UiStatTable);
