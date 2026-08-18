/*
	DESCRIPTION: ui-tree-table — hierarchical rows plus data columns.
	Reuses flattenTree from ui-tree. First column is the tree (indent + caret);
	remaining columns are primitives stamped at flatten time.
	── EVENTS ───────────────────────────────────────────────────────────
	  tree-table:select { value, id, item }
	  tree-table:toggle { id, expanded }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tree-table .state.items=${nodes} .state.columns=${[{ key, label }]}></ui-tree-table>
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { html, WebComponent } from 'webcomponent';
import {
	findTreeItem,
	flattenTree,
	seedExpandedIds,
	treeItemValue,
	treeRowSignature,
} from '../tree/tree.js';
export class UITreeTableRow extends WebComponent {
	static url = import.meta.url;
	static styles = {
		treeTable: './tree-table.css',
	};
	static state = {
		id: '',
		value: '',
		label: '',
		icon: '',
		depth: 0,
		expandable: false,
		expanded: false,
		selected: false,
		disabled: false,
		cells: [],
	};
	handleActivate() {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('tree-table-row:select', {
			id: this.state.id,
			value: this.state.value,
		});
	}
	handleToggle(domEvent) {
		domEvent.stopPropagation();
		if (this.state.expandable !== true) {
			return;
		}
		this.emit('tree-table-row:toggle', {
			id: this.state.id,
			expanded: this.state.expanded !== true,
		});
	}
	indentVar() {
		return `--depth:${this.state.depth}`;
	}
	caretName() {
		return this.state.expanded ? 'chevron-down' : 'chevron-right';
	}
	isLeaf() {
		return this.state.expandable !== true;
	}
	iconHidden() {
		return !this.state.icon;
	}
	cellKey(item, index) {
		return item?.key ?? index;
	}
	renderCell(item) {
		return html`<span class="tt-td" data-align=${item.align || 'start'}>${item.text}</span>`;
	}
	render() {
		this.html`
			<div class="tt-row" role="row"
				?data-selected=${this.state.selected}
				?data-disabled=${this.state.disabled}
				style=${this.indentVar}
				@click=${this.handleActivate}>
				<div class="tt-tree">
					<button type="button" class="tt-caret" ?disabled=${this.isLeaf} aria-hidden="true" tabindex="-1" @click=${this.handleToggle}>
						<ui-icon .state.name=${this.caretName} .state.size=${'sm'}></ui-icon>
					</button>
					<ui-icon class="tt-icon" ?hidden=${this.iconHidden} .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
					<span class="tt-label">${this.state.label}</span>
				</div>
				${this.list('cells', this.renderCell, this.cellKey)}
			</div>
		`;
	}
}
customElements.define('ui-tree-table-row', UITreeTableRow);
export class UITreeTable extends WebComponent {
	static url = import.meta.url;
	static styles = {
		treeTable: './tree-table.css',
	};
	static state = {
		items: [],
		columns: [],
		rows: [],
		value: '',
		expandDepth: 1,
		emptyMessage: 'No rows.',
		headLabels: [],
	};
	expandedSet = new Set();
	rowsSignature = '';
	onConnect() {
		this.ingest();
		this.observe([
			'items', 'expandDepth', 'columns',
		], this.ingest);
		this.observe(['value'], this.recomputeRows);
	}
	columnKeys() {
		const columns = this.state.columns;
		const keys = [];
		const count = columns.length;
		for (let index = 0; index < count; index += 1) {
			const key = columns[index]?.key;
			if (key && key !== 'label' && key !== 'icon' && key !== 'children') {
				keys.push(key);
			}
		}
		return keys;
	}
	syncHead() {
		const columns = this.state.columns;
		const count = columns.length;
		const parts = [];
		let usedLabel = false;
		for (let index = 0; index < count; index += 1) {
			const column = columns[index];
			if (column.key === 'icon') {
				continue;
			}
			if (column.key === 'label') {
				usedLabel = true;
			}
			parts.push({
				id: column.key || String(index),
				label: column.label || column.key || '',
			});
		}
		if (!usedLabel) {
			parts.unshift({
				id: 'label',
				label: 'Name',
			});
		}
		this.state.headLabels = parts;
	}
	ingest() {
		this.expandedSet = new Set();
		seedExpandedIds(this.state.items, Number(this.state.expandDepth) || 0, this.expandedSet, 0);
		this.syncHead();
		this.recomputeRows();
	}
	attachCells(rows) {
		const columns = this.state.columns;
		const count = rows.length;
		const colCount = columns.length;
		for (let index = 0; index < count; index += 1) {
			const row = rows[index];
			const cells = [];
			for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
				const column = columns[colIndex];
				const key = column.key;
				if (key === 'label' || key === 'icon') {
					continue;
				}
				const raw = row[key];
				cells.push({
					id: `${row.id}:${key}`,
					key,
					text: raw == null ? '' : String(raw),
					align: column.align || 'start',
				});
			}
			row.cells = cells;
		}
	}
	recomputeRows() {
		const selectedSet = new Set();
		if (this.state.value !== '' && this.state.value != null) {
			selectedSet.add(String(this.state.value));
		}
		const rows = flattenTree(this.state.items, {
			expandedSet: this.expandedSet,
			filterText: '',
			selectedSet,
			focusedId: '',
			copyKeys: this.columnKeys(),
		});
		this.attachCells(rows);
		const signature = rows.map(treeRowSignature).join('\n');
		if (signature === this.rowsSignature) {
			return;
		}
		this.rowsSignature = signature;
		this.state.rows = rows;
	}
	handleRowSelect(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		const item = findTreeItem(this.state.items, id);
		this.state.value = item ? treeItemValue(item) : id;
		this.recomputeRows();
		this.emit('tree-table:select', {
			value: this.state.value,
			id,
			item,
		});
	}
	handleRowToggle(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (!id) {
			return;
		}
		if (this.expandedSet.has(id)) {
			this.expandedSet.delete(id);
		} else {
			this.expandedSet.add(id);
		}
		this.recomputeRows();
		this.emit('tree-table:toggle', {
			id,
			expanded: this.expandedSet.has(id),
		});
	}
	gridStyle() {
		const columns = this.state.columns;
		const count = columns.length;
		const parts = ['minmax(12rem, 1.6fr)'];
		for (let index = 0; index < count; index += 1) {
			const key = columns[index]?.key;
			if (key === 'label' || key === 'icon') {
				continue;
			}
			parts.push('minmax(5rem, 1fr)');
		}
		return `--tt-cols:${parts.join(' ')}`;
	}
	headKey(item) {
		return item.id;
	}
	renderHead(item) {
		return html`<span class="tt-th">${item.label}</span>`;
	}
	rowKey(row) {
		return row.id;
	}
	hasRows() {
		return this.state.rows.length > 0;
	}
	render() {
		this.html`
			<div class="tt" style=${this.gridStyle}>
				<div class="tt-head" role="row">
					${this.list('headLabels', this.renderHead, this.headKey)}
				</div>
				<div class="tt-body" role="treegrid" @tree-table-row:select=${this.handleRowSelect} @tree-table-row:toggle=${this.handleRowToggle}>
					${this.list('rows', UITreeTableRow, this.rowKey)}
					<div class="tt-empty" ?hidden=${this.hasRows}>${this.state.emptyMessage}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-tree-table', UITreeTable);
