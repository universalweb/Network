/*
	DESCRIPTION: ui-json-inspector — a collapsible tree view for any JS value or a
	JSON string (raw tx/block payloads, agent tool I/O). Type-tinted values,
	per-row copy-PATH, live search/filter, and a starting depth limit.
	ARCHITECTURE — FLAT ROWS, PARENT OWNS THE DATA. The component holds the value +
	the expand-set and re-flattens the *visible* nodes into `items`; each row is a
	<ui-json-row> carrying only primitive display fields (a string preview, type,
	depth, path) — NEVER the live subtree. That keeps the keyed-list diff cheap and
	sidesteps deep-cloning a payload into every node (the wrong fit for recursive
	child-nesting on large inputs).
	BOUNDED — every walk stops at MAX_DEPTH, so a pathologically deep (or cyclic)
	payload can't overrun the stack / hang the tab. THAT cap is the guarantee. A
	cycle assigned RAW (identity intact) is additionally labelled `[Circular]` by an
	ancestor-scoped `seen` set — but data arriving through another component's
	reactive state is a lazy clone that mints infinite distinct wrappers, defeating
	identity, so there MAX_DEPTH alone holds the line. (`data` is held as a plain
	field, not reactive state, precisely so a raw assignment keeps real identity.)
	FILTER — a search term keeps any node whose key/scalar value matches PLUS its
	ancestors, force-expanding the path to reveal the hit; clearing it restores the
	manual expand-set.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-json-inspector .state.data=${payload} .state.expandDepth=${1}></ui-json-inspector>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import { UIJsonRow } from './json-row.js';
const STRING_PREVIEW_MAX = 60;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const MAX_DEPTH = 100;
function isContainer(value) {
	return value !== null && typeof value === 'object';
}
function typeOf(value) {
	if (value === null) {
		return 'null';
	}
	if (Array.isArray(value)) {
		return 'array';
	}
	return typeof value;
}
function entriesOf(value) {
	if (Array.isArray(value)) {
		return value.map((item, index) => {
			return {
				keyLabel: String(index),
				value: item,
				isIndex: true,
			};
		});
	}
	return Object.keys(value).map((key) => {
		return {
			keyLabel: key,
			value: value[key],
			isIndex: false,
		};
	});
}
function rowSignature(row) {
	return `${row.path}\t${row.expanded ? 1 : 0}\t${row.matched ? 1 : 0}\t${row.preview}`;
}
export class UIJsonInspector extends WebComponent {
	static url = import.meta.url;
	static styles = {
		jsonInspector: './json-inspector.css',
	};
	static state = {
		rootLabel: 'root',
		expandDepth: 1,
		filter: '',
		copyPath: true,
		items: [],
	};
	expandedSet = new Set();
	rootValue = null;
	rawData = null;
	ready = false;
	rowsSignature = '';
	get data() {
		return this.rawData;
	}
	set data(value) {
		this.rawData = value;
		if (this.ready) {
			this.ingest();
		}
	}
	onConnect() {
		this.ready = true;
		this.ingest();
		this.observe([
			'expandDepth',
			'rootLabel',
		], this.ingest);
		this.observe(['filter'], this.recomputeRows);
	}
	ingest() {
		this.rootValue = this.parseData(this.rawData);
		this.expandedSet = new Set();
		this.seedExpanded(this.rootValue, this.rootPath(), 0, new Set());
		this.recomputeRows();
	}
	parseData(raw) {
		if (typeof raw !== 'string') {
			return raw;
		}
		// A string MIGHT be serialized JSON; parse-or-keep is the only honest test
		// (validity isn't checkable without parsing), so try/catch is correct here.
		try {
			return JSON.parse(raw);
		} catch {
			return raw;
		}
	}
	rootPath() {
		return this.state.rootLabel || 'root';
	}
	childPath(parentPath, entry) {
		if (entry.isIndex) {
			return `${parentPath}[${entry.keyLabel}]`;
		}
		if (IDENTIFIER.test(entry.keyLabel)) {
			return `${parentPath}.${entry.keyLabel}`;
		}
		// Non-identifier key (spaces, dots, leading digit, 0x…) → bracket+quote so
		// the copied path actually resolves. JSON.stringify quotes AND escapes.
		return `${parentPath}[${JSON.stringify(entry.keyLabel)}]`;
	}
	seedExpanded(value, path, depth, seen) {
		if (depth >= this.state.expandDepth || depth >= MAX_DEPTH || !isContainer(value) || seen.has(value)) {
			return;
		}
		seen.add(value);
		this.expandedSet.add(path);
		for (const entry of entriesOf(value)) {
			this.seedExpanded(entry.value, this.childPath(path, entry), depth + 1, seen);
		}
		seen.delete(value);
	}
	collectAllPaths(value, path, seen, depth) {
		if (!isContainer(value) || seen.has(value) || depth >= MAX_DEPTH) {
			return;
		}
		seen.add(value);
		this.expandedSet.add(path);
		for (const entry of entriesOf(value)) {
			this.collectAllPaths(entry.value, this.childPath(path, entry), seen, depth + 1);
		}
		seen.delete(value);
	}
	previewFor(value, valueType, childCount) {
		switch (valueType) {
			case 'string': {
				const text = value.length > STRING_PREVIEW_MAX ? `${value.slice(0, STRING_PREVIEW_MAX)}…` : value;
				return `"${text}"`;
			}
			case 'null': {
				return 'null';
			}
			case 'undefined': {
				return 'undefined';
			}
			case 'function': {
				return 'ƒ ()';
			}
			case 'array': {
				return childCount === 0 ? '[ ]' : `[ ${childCount} ]`;
			}
			case 'object': {
				return childCount === 0 ? '{ }' : `{ ${childCount} }`;
			}
			default: {
				return String(value);
			}
		}
	}
	entryMatches(entry, value, valueType, filterText) {
		if (String(entry.keyLabel).toLowerCase().includes(filterText)) {
			return true;
		}
		if (valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'null') {
			return String(value).toLowerCase().includes(filterText);
		}
		return false;
	}
	recomputeRows() {
		const filterText = this.state.filter.trim().toLowerCase();
		const rows = [];
		this.collect({
			keyLabel: this.state.rootLabel,
			value: this.rootValue,
			isIndex: false,
		}, this.rootPath(), 0, rows, filterText, new Set());
		// Skip the write when the flattened result is render-identical — an idempotent
		// recompute (Expand-all twice, a filter keystroke that doesn't change the set)
		// would otherwise reassign a structurally-equal array and trip the wasted-set
		// guard (no new array in state → no echo, matching the controlled-primitive rule).
		const signature = rows.map(rowSignature).join('\n');
		if (signature === this.rowsSignature) {
			return;
		}
		this.rowsSignature = signature;
		this.state.items = rows;
	}
	collect(entry, path, depth, rowsOut, filterText, seen) {
		const value = entry.value;
		const valueType = typeOf(value);
		const container = isContainer(value);
		const cyclic = container && seen.has(value);
		const childEntries = container && !cyclic ? entriesOf(value) : [];
		// Hard depth cap is the real backstop: a value reached through reactive state
		// is a lazy clone with no stable identity, so `seen` can't catch its cycle —
		// only refusing to descend past MAX_DEPTH guarantees termination.
		const expandable = childEntries.length > 0 && depth < MAX_DEPTH;
		const filtering = filterText !== '';
		const selfMatches = filtering && this.entryMatches(entry, value, valueType, filterText);
		const descend = expandable && (filtering || this.expandedSet.has(path));
		const row = {
			id: path,
			path,
			keyLabel: String(entry.keyLabel),
			isIndex: entry.isIndex,
			depth,
			type: valueType,
			expandable,
			expanded: false,
			childCount: childEntries.length,
			preview: cyclic ? '[Circular]' : this.previewFor(value, valueType, childEntries.length),
			matched: selfMatches,
			copyPath: this.state.copyPath,
		};
		rowsOut.push(row);
		const childRows = [];
		const keptChild = descend && this.collectChildren(value, path, depth, childEntries, childRows, filterText, seen);
		if (filtering && !selfMatches && !keptChild) {
			// Ancestor-inclusion: nothing here or below matched → drop the whole subtree.
			rowsOut.pop();
			return false;
		}
		// Non-filter `descend` already folds in expandedSet + expandable, so it doubles
		// as "should these children show"; under a filter only kept subtrees show.
		const showChildren = filtering ? keptChild : descend;
		row.expanded = showChildren;
		if (showChildren) {
			rowsOut.push(...childRows);
		}
		return true;
	}
	collectChildren(value, path, depth, childEntries, childRows, filterText, seen) {
		seen.add(value);
		let keptChild = false;
		for (const childEntry of childEntries) {
			if (this.collect(childEntry, this.childPath(path, childEntry), depth + 1, childRows, filterText, seen)) {
				keptChild = true;
			}
		}
		seen.delete(value);
		return keptChild;
	}
	handleToggle(domEvent) {
		const path = domEvent.detail?.data?.path;
		if (path == null) {
			return;
		}
		if (this.expandedSet.has(path)) {
			this.expandedSet.delete(path);
		} else {
			this.expandedSet.add(path);
		}
		this.recomputeRows();
	}
	expandAll() {
		this.expandedSet = new Set();
		this.collectAllPaths(this.rootValue, this.rootPath(), new Set(), 0);
		this.recomputeRows();
	}
	collapseAll() {
		this.expandedSet = new Set();
		this.recomputeRows();
	}
	clearFilter() {
		this.state.filter = '';
	}
	rowKey(row) {
		return row.id;
	}
	hasRows() {
		return this.state.items.length > 0;
	}
	clearHidden() {
		return this.state.filter === '';
	}
	render() {
		this.html`
			<div class="ji">
				<div class="ji-toolbar">
					<input #search class="ji-search" type="search" placeholder="Filter keys & values…" $value="filter" aria-label="Filter">
					<button type="button" class="ji-btn ji-clear" ?hidden=${this.clearHidden} @click=${this.clearFilter}>Clear</button>
					<button type="button" class="ji-btn" @click=${this.expandAll}>Expand all</button>
					<button type="button" class="ji-btn" @click=${this.collapseAll}>Collapse all</button>
				</div>
				<div class="ji-tree" role="tree" @json-row:toggle=${this.handleToggle}>
					${this.list('items', UIJsonRow, this.rowKey)}
					<div class="ji-empty" ?hidden=${this.hasRows}>No matches</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-json-inspector', UIJsonInspector);
