/*
	DESCRIPTION: ui-tree — hierarchical expand/collapse select.
	Parent owns `items` + an expandedSet and re-flattens only VISIBLE nodes into
	`rows`. Each <ui-tree-node> carries primitive display fields only — never the
	live subtree (json-inspector flat-rows pattern). Bounded by TREE_MAX_DEPTH.
	── EVENTS ───────────────────────────────────────────────────────────
	  tree:select { value, id, item, selected }
	  tree:change { value, values }
	  tree:toggle { id, expanded }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-tree .state.items=${nodes} .state.value=${'base'} @tree:select=${this.onPick}></ui-tree>
	  items: [{ id, label, children?, icon?, value?, disabled? }]
	──────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export const TREE_MAX_DEPTH = 100;
export function treeItemId(item) {
	if (!item) {
		return '';
	}
	if (item.id != null && item.id !== '') {
		return String(item.id);
	}
	if (item.value != null && item.value !== '') {
		return String(item.value);
	}
	return '';
}
export function treeItemValue(item) {
	if (!item) {
		return '';
	}
	if (item.value != null && item.value !== '') {
		return item.value;
	}
	return treeItemId(item);
}
export function treeItemLabel(item) {
	if (!item) {
		return '';
	}
	if (item.label != null && item.label !== '') {
		return String(item.label);
	}
	return String(treeItemValue(item));
}
export function treeChildren(item) {
	const kids = item?.children;
	if (!Array.isArray(kids)) {
		return [];
	}
	return kids;
}
export function findTreeItem(items, needle, depth) {
	const walkDepth = depth ?? 0;
	if (!Array.isArray(items) || walkDepth >= TREE_MAX_DEPTH || needle == null || needle === '') {
		return null;
	}
	const target = String(needle);
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item) {
			continue;
		}
		// Match id OR value — tree emits treeItemValue while form hosts may store either.
		if (treeItemId(item) === target || String(treeItemValue(item)) === target) {
			return item;
		}
		const found = findTreeItem(treeChildren(item), target, walkDepth + 1);
		if (found) {
			return found;
		}
	}
	return null;
}
export function treeRowSignature(row) {
	// cells/icon/disabled included so tree-table column stamps and tree chrome
	// changes force recomputeRows (signature gate otherwise keeps stale rows).
	const cells = Array.isArray(row.cells)
		? row.cells.map((cell) => {
			return `${cell?.key ?? ''}:${cell?.text ?? ''}`;
		}).join('|')
		: '';
	return `${row.id}\t${row.expanded ? 1 : 0}\t${row.selected ? 1 : 0}\t${row.focused ? 1 : 0}\t${row.label}\t${row.icon || ''}\t${row.disabled ? 1 : 0}\t${cells}`;
}
function itemMatchesFilter(item, filterText) {
	if (!filterText) {
		return true;
	}
	const label = treeItemLabel(item).toLowerCase();
	const idText = treeItemId(item).toLowerCase();
	return label.includes(filterText) || idText.includes(filterText);
}
function stampCopyKeys(row, item, copyKeys) {
	if (!copyKeys) {
		return;
	}
	const keyCount = copyKeys.length;
	for (let index = 0; index < keyCount; index += 1) {
		const key = copyKeys[index];
		if (key === 'children' || key === 'id' || key === 'label' || key === 'icon') {
			continue;
		}
		const raw = item[key];
		if (raw == null || typeof raw === 'object') {
			row[key] = raw == null ? '' : String(raw);
			continue;
		}
		row[key] = raw;
	}
}
function collectVisible(items, depth, rowsOut, ctx) {
	if (!Array.isArray(items) || depth >= TREE_MAX_DEPTH) {
		return false;
	}
	const count = items.length;
	let keptAny = false;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item) {
			continue;
		}
		const id = treeItemId(item);
		const kids = treeChildren(item);
		const expandable = kids.length > 0 && depth < TREE_MAX_DEPTH;
		const selfMatch = itemMatchesFilter(item, ctx.filterText);
		const descend = expandable && (Boolean(ctx.filterText) || ctx.expandedSet.has(id));
		const row = {
			id,
			value: treeItemValue(item),
			label: treeItemLabel(item),
			icon: item.icon || '',
			depth,
			expandable,
			expanded: false,
			selected: ctx.selectedSet.has(id) || ctx.selectedSet.has(String(treeItemValue(item))),
			focused: ctx.focusedId === id,
			disabled: item.disabled === true,
		};
		stampCopyKeys(row, item, ctx.copyKeys);
		rowsOut.push(row);
		const childRows = [];
		let keptChild = false;
		if (descend) {
			keptChild = collectVisible(kids, depth + 1, childRows, ctx);
		}
		if (ctx.filterText && !selfMatch && !keptChild) {
			rowsOut.pop();
			continue;
		}
		const showChildren = ctx.filterText ? keptChild : descend;
		row.expanded = showChildren;
		if (showChildren) {
			const childCount = childRows.length;
			for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
				rowsOut.push(childRows[childIndex]);
			}
		}
		keptAny = true;
	}
	return keptAny;
}
export function flattenTree(items, options) {
	const rows = [];
	const selectedSet = options.selectedSet instanceof Set ? options.selectedSet : new Set();
	collectVisible(Array.isArray(items) ? items : [], 0, rows, {
		expandedSet: options.expandedSet instanceof Set ? options.expandedSet : new Set(),
		filterText: options.filterText || '',
		selectedSet,
		focusedId: options.focusedId || '',
		copyKeys: options.copyKeys || null,
	});
	return rows;
}
export function seedExpandedIds(items, expandDepth, expandedSet, depth) {
	const walkDepth = depth ?? 0;
	if (!Array.isArray(items) || walkDepth >= expandDepth || walkDepth >= TREE_MAX_DEPTH) {
		return;
	}
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item) {
			continue;
		}
		const kids = treeChildren(item);
		if (kids.length === 0) {
			continue;
		}
		expandedSet.add(treeItemId(item));
		seedExpandedIds(kids, expandDepth, expandedSet, walkDepth + 1);
	}
}
export function collectAllExpandableIds(items, expandedSet, depth) {
	const walkDepth = depth ?? 0;
	if (!Array.isArray(items) || walkDepth >= TREE_MAX_DEPTH) {
		return;
	}
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item) {
			continue;
		}
		const kids = treeChildren(item);
		if (kids.length === 0) {
			continue;
		}
		expandedSet.add(treeItemId(item));
		collectAllExpandableIds(kids, expandedSet, walkDepth + 1);
	}
}
export class UITreeNode extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tree: './tree.css',
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
		focused: false,
		disabled: false,
	};
	handleActivate() {
		if (this.state.disabled === true) {
			return;
		}
		this.emit('tree-node:select', {
			id: this.state.id,
			value: this.state.value,
		});
	}
	handleToggle(domEvent) {
		domEvent.stopPropagation();
		if (this.state.expandable !== true || this.state.disabled === true) {
			return;
		}
		this.emit('tree-node:toggle', {
			id: this.state.id,
			expanded: this.state.expanded !== true,
		});
	}
	indentVar() {
		return `--depth:${this.state.depth}`;
	}
	ariaLevel() {
		return this.state.depth + 1;
	}
	ariaExpanded() {
		return this.state.expandable ? String(this.state.expanded) : null;
	}
	caretName() {
		return this.state.expanded ? 'chevron-down' : 'chevron-right';
	}
	isLeaf() {
		return this.state.expandable !== true;
	}
	tabIndex() {
		return this.state.focused ? 0 : -1;
	}
	iconHidden() {
		return !this.state.icon;
	}
	render() {
		this.html`
			<div class="tn" role="treeitem"
				data-depth=${this.state.depth}
				?data-selected=${this.state.selected}
				?data-focused=${this.state.focused}
				?data-disabled=${this.state.disabled}
				?data-expanded=${this.state.expanded}
				aria-level=${this.ariaLevel}
				aria-selected=${this.state.selected ? 'true' : 'false'}
				aria-expanded=${this.ariaExpanded}
				aria-disabled=${this.state.disabled ? 'true' : 'false'}
				tabindex=${this.tabIndex}
				style=${this.indentVar}
				@click=${this.handleActivate}>
				<button type="button" class="tn-caret" ?disabled=${this.isLeaf} aria-hidden="true" tabindex="-1" @click=${this.handleToggle}>
					<ui-icon .state.name=${this.caretName} .state.size=${'sm'}></ui-icon>
				</button>
				<ui-icon class="tn-icon" ?hidden=${this.iconHidden} .state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
				<span class="tn-label">${this.state.label}</span>
			</div>
		`;
	}
}
customElements.define('ui-tree-node', UITreeNode);
export class UITree extends WebComponent {
	static url = import.meta.url;
	static styles = {
		tree: './tree.css',
	};
	static state = {
		items: [],
		rows: [],
		value: '',
		values: [],
		multiple: false,
		filter: '',
		expandDepth: 1,
		activeIndex: '',
		disabled: false,
		emptyMessage: 'No items.',
		showFilter: false,
	};
	expandedSet = new Set();
	rowsSignature = '';
	ready = false;
	onConnect() {
		this.ready = true;
		this.ingest();
		this.observe(['items', 'expandDepth'], this.ingest);
		this.observe([
			'filter', 'value', 'values', 'activeIndex', 'multiple',
		], this.recomputeRows);
		this.on('keydown', this.handleKeydown);
	}
	ingest() {
		this.expandedSet = new Set();
		seedExpandedIds(this.state.items, Number(this.state.expandDepth) || 0, this.expandedSet, 0);
		this.recomputeRows();
	}
	selectedSet() {
		const next = new Set();
		if (this.state.multiple === true) {
			const values = this.state.values;
			if (Array.isArray(values)) {
				const count = values.length;
				for (let index = 0; index < count; index += 1) {
					next.add(String(values[index]));
				}
			}
			return next;
		}
		if (this.state.value !== '' && this.state.value != null) {
			next.add(String(this.state.value));
		}
		return next;
	}
	filterText() {
		return String(this.state.filter || '').trim().toLowerCase();
	}
	recomputeRows() {
		const rows = flattenTree(this.state.items, {
			expandedSet: this.expandedSet,
			filterText: this.filterText(),
			selectedSet: this.selectedSet(),
			focusedId: String(this.state.activeIndex || ''),
		});
		const signature = rows.map(treeRowSignature).join('\n');
		if (signature === this.rowsSignature) {
			this.ensureActiveIndex(rows);
			return;
		}
		this.rowsSignature = signature;
		this.state.rows = rows;
		this.ensureActiveIndex(rows);
	}
	/**
	 * Roving tabindex seed — first enabled visible row when activeIndex is empty/stale.
	 * @param {object[]} rows - Flattened tree rows.
	 */
	ensureActiveIndex(rows) {
		if (!Array.isArray(rows) || rows.length === 0) {
			return;
		}
		if (this.state.activeIndex && this.rowById(this.state.activeIndex)) {
			return;
		}
		const rowCount = rows.length;
		for (let index = 0; index < rowCount; index += 1) {
			if (rows[index].disabled !== true) {
				this.state.activeIndex = rows[index].id;
				return;
			}
		}
	}
	/** Move DOM focus onto the active ui-tree-node face (roving tabindex). */
	focusActiveRow() {
		const id = String(this.state.activeIndex || '');
		if (!id) {
			return;
		}
		const nodes = this.getChildren('ui-tree-node');
		const nodeCount = nodes.length;
		for (let index = 0; index < nodeCount; index += 1) {
			const node = nodes[index];
			if (String(node.state?.id) !== id) {
				continue;
			}
			const face = node.shadowRoot?.querySelector?.('.tn') || node;
			face.focus?.();
			return;
		}
	}
	rowById(id) {
		const rows = this.state.rows;
		const count = rows.length;
		const needle = String(id);
		for (let index = 0; index < count; index += 1) {
			if (rows[index].id === needle) {
				return rows[index];
			}
		}
		return null;
	}
	rowIndexById(id) {
		const rows = this.state.rows;
		const count = rows.length;
		const needle = String(id);
		for (let index = 0; index < count; index += 1) {
			if (rows[index].id === needle) {
				return index;
			}
		}
		return -1;
	}
	emitSelection(id) {
		const item = findTreeItem(this.state.items, id);
		const value = item ? treeItemValue(item) : id;
		const selectedSet = this.selectedSet();
		this.emit('tree:select', {
			value,
			id,
			item,
			selected: selectedSet.has(String(id)) || selectedSet.has(String(value)),
		});
		if (this.state.multiple === true) {
			this.emit('tree:change', {
				value: this.state.values,
				values: this.state.values,
			});
			return;
		}
		this.emit('tree:change', {
			value: this.state.value,
			values: this.state.values,
		});
	}
	applySingle(id) {
		const item = findTreeItem(this.state.items, id);
		this.state.value = item ? treeItemValue(item) : id;
		this.state.activeIndex = id;
		this.recomputeRows();
		this.emitSelection(id);
	}
	applyMultiple(id) {
		const item = findTreeItem(this.state.items, id);
		const token = String(item ? treeItemValue(item) : id);
		const current = Array.isArray(this.state.values) ? this.state.values.slice() : [];
		const count = current.length;
		let found = -1;
		for (let index = 0; index < count; index += 1) {
			if (String(current[index]) === token) {
				found = index;
				break;
			}
		}
		if (found >= 0) {
			current.splice(found, 1);
		} else {
			current.push(item ? treeItemValue(item) : id);
		}
		this.state.values = current;
		this.state.activeIndex = id;
		this.recomputeRows();
		this.emitSelection(id);
	}
	handleNodeSelect(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (id == null || id === '' || this.state.disabled === true) {
			return;
		}
		const row = this.rowById(id);
		if (row?.disabled === true) {
			return;
		}
		if (this.state.multiple === true) {
			this.applyMultiple(id);
			return;
		}
		this.applySingle(id);
	}
	handleNodeToggle(domEvent) {
		const id = domEvent.detail?.data?.id;
		if (id == null || id === '' || this.state.disabled === true) {
			return;
		}
		if (this.expandedSet.has(id)) {
			this.expandedSet.delete(id);
		} else {
			this.expandedSet.add(id);
		}
		this.recomputeRows();
		this.emit('tree:toggle', {
			id,
			expanded: this.expandedSet.has(id),
		});
	}
	moveFocus(delta) {
		const rows = this.state.rows;
		const count = rows.length;
		if (count === 0) {
			return;
		}
		let current = this.rowIndexById(this.state.activeIndex);
		if (current < 0) {
			current = delta > 0 ? -1 : count;
		}
		let next = current + delta;
		if (next < 0) {
			next = 0;
		} else if (next >= count) {
			next = count - 1;
		}
		this.state.activeIndex = rows[next].id;
		this.focusActiveRow();
	}
	toggleFocused() {
		const id = this.state.activeIndex;
		const row = this.rowById(id);
		if (!row || row.expandable !== true) {
			return;
		}
		if (this.expandedSet.has(id)) {
			this.expandedSet.delete(id);
		} else {
			this.expandedSet.add(id);
		}
		this.recomputeRows();
		this.emit('tree:toggle', {
			id,
			expanded: this.expandedSet.has(id),
		});
	}
	handleKeydown(domEvent) {
		if (this.state.disabled === true) {
			return;
		}
		const target = domEvent.target;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
			return;
		}
		switch (domEvent.key) {
			case 'ArrowDown': {
				domEvent.preventDefault();
				this.moveFocus(1);
				break;
			}
			case 'ArrowUp': {
				domEvent.preventDefault();
				this.moveFocus(-1);
				break;
			}
			case 'Home': {
				domEvent.preventDefault();
				if (this.state.rows[0]) {
					this.state.activeIndex = this.state.rows[0].id;
					this.focusActiveRow();
				}
				break;
			}
			case 'End': {
				domEvent.preventDefault();
				const last = this.state.rows.at(-1);
				if (last) {
					this.state.activeIndex = last.id;
					this.focusActiveRow();
				}
				break;
			}
			case 'ArrowRight': {
				domEvent.preventDefault();
				const row = this.rowById(this.state.activeIndex);
				if (row?.expandable === true && this.expandedSet.has(row.id) !== true) {
					this.expandedSet.add(row.id);
					this.recomputeRows();
					this.emit('tree:toggle', {
						id: row.id,
						expanded: true,
					});
				}
				break;
			}
			case 'ArrowLeft': {
				domEvent.preventDefault();
				const row = this.rowById(this.state.activeIndex);
				if (row?.expandable === true && this.expandedSet.has(row.id)) {
					this.expandedSet.delete(row.id);
					this.recomputeRows();
					this.emit('tree:toggle', {
						id: row.id,
						expanded: false,
					});
				}
				break;
			}
			case 'Enter':
			case ' ': {
				domEvent.preventDefault();
				const id = this.state.activeIndex;
				if (!id) {
					break;
				}
				if (this.state.multiple === true) {
					this.applyMultiple(id);
					break;
				}
				this.applySingle(id);
				break;
			}
			default: {
				break;
			}
		}
	}
	expandAll() {
		this.expandedSet = new Set();
		collectAllExpandableIds(this.state.items, this.expandedSet, 0);
		this.recomputeRows();
	}
	collapseAll() {
		this.expandedSet = new Set();
		this.recomputeRows();
	}
	rowKey(row) {
		return row.id;
	}
	hasRows() {
		return this.state.rows.length > 0;
	}
	filterHidden() {
		return this.state.showFilter !== true;
	}
	render() {
		this.html`
			<div class="tr" ?data-disabled=${this.state.disabled}>
				<input #search class="tr-search" type="search" placeholder="Filter…" aria-label="Filter tree"
					?hidden=${this.filterHidden} $value="filter">
				<div class="tr-tree" role="tree" tabindex="0"
					@tree-node:select=${this.handleNodeSelect}
					@tree-node:toggle=${this.handleNodeToggle}
					@focusin=${this.handleTreeFocusIn}>
					${this.list('rows', UITreeNode, this.rowKey)}
					<div class="tr-empty" ?hidden=${this.hasRows}>${this.state.emptyMessage}</div>
				</div>
			</div>
		`;
	}
	/** First focus into the tree lands on the roving active row. */
	handleTreeFocusIn(domEvent) {
		if (domEvent.target !== domEvent.currentTarget) {
			return;
		}
		this.focusActiveRow();
	}
}
customElements.define('ui-tree', UITree);
