/*
	DESCRIPTION: ui-table — simple data table (Table).
	columns: [{ key, label, align? }]; items: row objects.
	Emits table:row-click { item, index }.
*/
import { UITableRow } from '../table-row/table-row.js';
import { WebComponent } from 'webcomponent';
function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}
export class UITable extends WebComponent {
	static url = import.meta.url;
	static styles = {
		table: './table.css',
	};
	static state = {
		columns: [],
		items: [],
		// Derived rows for list() — stamped with `index`. Rebuilt only when the
		// source `items` identity/length changes (never on every parent patch).
		indexedItems: [],
		heading: '',
		emptyMessage: 'No data.',
		density: 'md',
	};
	// Last source identity/length used to build indexedItems (plain fields).
	indexedSourceRef = null;
	indexedSourceLen = -1;
	onConnect() {
		this.syncIndexedItems();
		this.observe('items', this.syncIndexedItems);
		this.on('table-row:click', this.handleRowClick);
	}
	/**
	 * Build indexedItems only when the source array is a new reference or a
	 * different length. Always-rebuilding was the second half of the preview
	 * "wasted set on indexedItems" flood (parent rebind → observe → new array).
	 */
	syncIndexedItems() {
		const items = this.state.items;
		if (!Array.isArray(items)) {
			if (this.state.indexedItems.length > 0) {
				this.state.indexedItems = [];
			}
			this.indexedSourceRef = null;
			this.indexedSourceLen = -1;
			return;
		}
		const count = items.length;
		// Same source identity + length → row objects already carry correct indexes.
		if (items === this.indexedSourceRef && count === this.indexedSourceLen) {
			return;
		}
		const next = [];
		for (let index = 0; index < count; index++) {
			const item = items[index] || {};
			next.push({
				...item,
				index,
			});
		}
		this.indexedSourceRef = items;
		this.indexedSourceLen = count;
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
	paintHead() {
		const columns = this.state.columns;
		const count = columns.length;
		const parts = [];
		for (let index = 0; index < count; index++) {
			const column = columns[index];
			const align = column.align || 'start';
			const label = escapeHtml(column.label || column.key || '');
			parts.push(`<th class="tb-th" data-align="${align}">${label}</th>`);
		}
		return parts.join('');
	}
	render() {
		this.html`
			<div class="tb" data-density=${this.state.density}>
				<div class="tb-caption" ?hidden=${!this.state.heading}>${this.state.heading}</div>
				<table class="tb-table">
					<thead class="tb-head">
						<tr class="tb-tr">^html${this.paintHead}</tr>
					</thead>
					<tbody class="tb-body">
						${this.list('indexedItems', UITableRow, this.rowKey)}
					</tbody>
				</table>
				<div class="tb-empty" ?hidden=${this.state.items.length > 0}>${this.state.emptyMessage}</div>
			</div>
		`;
	}
}
customElements.define('ui-table', UITable);
