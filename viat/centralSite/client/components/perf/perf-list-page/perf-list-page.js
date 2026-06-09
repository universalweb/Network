import '../../global/ui-stat-table/ui-stat-table.js';
import { PerfDeepNode, PropagationTracker } from '../perf-deep-node/perf-deep-node.js';
import { WebComponent, each } from '../../core/index.js';
import { Perf } from '../../core/debug/perf.js';
import { PerfFullCard } from '../perf-full-card/perf-full-card.js';
import { PerfListItem } from '../perf-list-item/perf-list-item.js';
import { plainEqual } from '../../core/utilities.js';
function itemKey(item) {
	return item.id;
}
function buildPerfListItemElement(item) {
	const el = new PerfListItem();
	el.state = item;
	return el;
}
function buildPerfFullCardElement(item) {
	const el = new PerfFullCard();
	el.state = item;
	return el;
}
const REPORT_COLUMNS = [
	{
		id: 'category',
		label: 'category',
		width: '1.4fr',
	},
	{
		id: 'count',
		label: 'count',
	},
	{
		id: 'totalMs',
		label: 'total ms',
	},
	{
		id: 'avgMs',
		label: 'avg ms',
	},
	{
		id: 'p50Ms',
		label: 'p50 ms',
	},
	{
		id: 'p95Ms',
		label: 'p95 ms',
	},
	{
		id: 'maxMs',
		label: 'max ms',
	},
];
const HISTORY_COLUMNS = [
	{
		id: 'mode',
		label: 'list mode',
		width: '1.4fr',
	},
	{
		id: 'count',
		label: 'items',
	},
	{
		id: 'construct',
		label: 'construct',
	},
	{
		id: 'connect',
		label: 'connect',
	},
	{
		id: 'renderView',
		label: 'renderView',
	},
	{
		id: 'updateView',
		label: 'updateView',
	},
	{
		id: 'patch',
		label: 'patch',
	},
];
const CENSUS_COLUMNS = [
	{
		id: 'metric',
		label: 'metric',
		width: '1.6fr',
	},
	{
		id: 'value',
		label: 'value',
	},
];
const TAG_COLUMNS = [
	{
		id: 'tag',
		label: 'tag',
		width: '2fr',
	},
	{
		id: 'count',
		label: 'live count',
	},
];
const MEMORY_COLUMNS = [
	{
		id: 'metric',
		label: 'metric',
		width: '1.6fr',
	},
	{
		id: 'value',
		label: 'MB',
	},
];
const DEPTH_COLUMNS = [
	{
		id: 'metric',
		label: 'metric',
		width: '2fr',
	},
	{
		id: 'value',
		label: 'value',
	},
];
const DEPTH_HISTORY_COLUMNS = [
	{
		id: 'depth',
		label: 'depth',
	},
	{
		id: 'value',
		label: 'root val',
	},
	{
		id: 'firstMs',
		label: 'first-leaf ms',
	},
	{
		id: 'lastMs',
		label: 'last-leaf ms',
	},
	{
		id: 'leaves',
		label: 'leaves',
	},
	{
		id: 'patchMs',
		label: 'patch total',
	},
	{
		id: 'renderMs',
		label: 'renderView total',
	},
];
const ARCHITECTURE_COLUMNS = [
	{
		id: 'subsystem',
		label: 'subsystem',
		width: '1.4fr',
	},
	{
		id: 'location',
		label: 'location',
		width: '1.6fr',
	},
	{
		id: 'role',
		label: 'role',
		width: '3fr',
	},
];
// Sorted by boot-order / execution-order through a render cycle, then
// alphabetically within the same tier. Reading top-to-bottom traces the
// life of a render: state mutates → schedules → renderView → template
// runs → lifecycle hooks → events fire → styles applied → observers
// downstream.
const ARCHITECTURE_ROWS = [
	{
		key: 'base',
		cells: [
			'1 · WebComponent base',
			'base.js',
			'Custom-element ctor, propertyIndex cache, attachShadow, ensureMergedState/Properties/Config/Attrs',
		],
	},
	{
		key: 'reactive-state',
		cells: [
			'2 · Reactive state',
			'state/*',
			'STATE Proxy + per-component PathSubscriptions bus + smartClone of static state',
		],
	},
	{
		key: 'scheduler',
		cells: [
			'3 · Scheduler',
			'lifecycle/scheduler.js',
			'Single-batch postTask/RAF dedup-by-target queue; Promise.withResolvers deferred batch',
		],
	},
	{
		key: 'render',
		cells: [
			'4 · Render pipeline',
			'render/*',
			'renderView → handleRendered/Mount/Live; renderDep auto-track; patch-pass skips lifecycle',
		],
	},
	{
		key: 'template',
		cells: [
			'5 · Template runtime',
			'template.js',
			'Tagged-template compiler, recipe cache, spot install/patch, keyed list diff, async-text',
		],
	},
	{
		key: 'lifecycle',
		cells: [
			'6 · Lifecycle',
			'lifecycle/*',
			'PHASE state machine; connect/disconnect/move; IntersectionObserver + onIntersect',
		],
	},
	{
		key: 'events',
		cells: [
			'7 · Events + delegation',
			'events/*, dom/delegate.js, hotkeys/*',
			'EventEntry class, scoped delegation, hotkey registry, env-listeners',
		],
	},
	{
		key: 'styles',
		cells: [
			'8 · Styles',
			'styles/*',
			'Compile-once CSSStyleSheet per class, adopted on each shadow root',
		],
	},
	{
		key: 'observer',
		cells: [
			'9 · Observers',
			'state/subscriptions.js',
			'StateKeyObserver / DeferredStateObserver / GlobalObserver — class-based, zero-closure dispatch',
		],
	},
	{
		key: 'ai',
		cells: [
			'10 · AI surface (optional)',
			'ai/*',
			'Component registry, tools/methods registry, JSON-RPC dispatch, MCP transport',
		],
	},
];
function buildItems(count) {
	const out = new Array(count);
	for (let i = 0; i < count; i++) {
		out[i] = {
			id: i,
			label: `Item ${i}`,
			value: Math.floor(Math.random() * 10000),
		};
	}
	return out;
}
function waitForFrames(n) {
	return new Promise((resolve) => {
		let remaining = n;
		const tick = () => {
			remaining -= 1;
			if (remaining <= 0) {
				resolve();
				return;
			}
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
}
function pickReportField(rows, key, field) {
	for (let i = 0; i < rows.length; i++) {
		if (rows[i].category === key) {
			return rows[i][field];
		}
	}
	return 0;
}
function summarizeReport(mode, count, report) {
	const cells = new Array(7);
	cells[0] = mode;
	cells[1] = count;
	cells[2] = pickReportField(report, 'construct', 'totalMs');
	cells[3] = pickReportField(report, 'connect', 'totalMs');
	cells[4] = pickReportField(report, 'renderView', 'totalMs');
	cells[5] = pickReportField(report, 'updateView', 'totalMs');
	cells[6] = pickReportField(report, 'patch', 'totalMs');
	return {
		key: mode,
		cells,
	};
}
function buildRow(rowKey, label, value) {
	const cells = new Array(2);
	cells[0] = label;
	cells[1] = value;
	return {
		key: rowKey,
		cells,
	};
}
function censusToRows(census) {
	if (!census) {
		return [];
	}
	const totals = census.totals;
	return [
		buildRow('totalComponents', 'Live WebComponents', census.totalComponents),
		buildRow('uniqueTags', 'Distinct tags', census.uniqueTags),
		buildRow('stateBusSubs', 'Path-bus subscriptions', totals.stateBusSubs),
		buildRow('renderDeps', 'Render deps (tracked paths)', totals.renderDeps),
		buildRow('observers', 'Observers (state + global)', totals.observers),
		buildRow('events', 'Event entries', totals.eventEntries),
		buildRow('delegates', 'Delegate entries', totals.delegateEntries),
		buildRow('hotkeys', 'Hotkey entries', totals.hotkeyEntries),
		buildRow('refs', 'Active refs', totals.refs),
	];
}
function tagBreakdownRows(census, limit = 8) {
	if (!census) {
		return [];
	}
	const entries = census.byTag.slice(0, limit);
	const rows = new Array(entries.length);
	for (let i = 0; i < entries.length; i++) {
		rows[i] = buildRow(entries[i][0], entries[i][0], entries[i][1]);
	}
	return rows;
}
function memoryRows(memory) {
	if (!memory) {
		return [buildRow('unavailable', 'performance.memory', 'unavailable (Chromium-only)')];
	}
	return [
		buildRow('used', 'Used JS heap', memory.usedHeapMb),
		buildRow('total', 'Total JS heap', memory.totalHeapMb),
		buildRow('limit', 'Heap size limit', memory.heapLimitMb),
	];
}
function depthRows(snapshot, perDepth) {
	if (!snapshot) {
		return [];
	}
	const rows = [
		buildRow('first', 'First-leaf propagation', `${snapshot.firstDeltaMs.toFixed(3)} ms`),
		buildRow('last', 'Last-leaf propagation', `${snapshot.lastDeltaMs.toFixed(3)} ms`),
		buildRow('leaves', 'Leaves reached', snapshot.leafCount),
	];
	if (!perDepth) {
		return rows;
	}
	for (let i = 0; i < perDepth.length; i++) {
		const entry = perDepth[i];
		rows.push(buildRow(`L${entry.depth}`, `L${entry.depth} render total`, `${entry.totalMs.toFixed(3)} ms (×${entry.count})`));
	}
	return rows;
}
function depthHistoryRow(historyEntry) {
	const cells = new Array(7);
	cells[0] = historyEntry.depth;
	cells[1] = historyEntry.value;
	cells[2] = historyEntry.firstMs.toFixed(3);
	cells[3] = historyEntry.lastMs.toFixed(3);
	cells[4] = historyEntry.leaves;
	cells[5] = historyEntry.patchMs.toFixed(3);
	cells[6] = historyEntry.renderMs.toFixed(3);
	return {
		key: `d${historyEntry.depth}-v${historyEntry.value}-${historyEntry.runId}`,
		cells,
	};
}
function collectDepthBreakdown(report) {
	const out = [];
	for (let i = 0; i < report.length; i++) {
		const row = report[i];
		if (row.category.startsWith('depth-L')) {
			out.push({
				depth: Number(row.category.slice(7)),
				totalMs: row.totalMs,
				count: row.count,
			});
		}
	}
	out.sort((a, b) => {
		return b.depth - a.depth;
	});
	return out;
}
function reportRows(report) {
	const rows = new Array(report.length);
	for (let i = 0; i < report.length; i++) {
		const row = report[i];
		const cells = new Array(7);
		cells[0] = row.category;
		cells[1] = row.count;
		cells[2] = row.totalMs;
		cells[3] = row.avgMs;
		cells[4] = row.p50Ms;
		cells[5] = row.p95Ms;
		cells[6] = row.maxMs;
		rows[i] = {
			key: row.category,
			cells,
		};
	}
	return rows;
}
export class PerfListPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		perfListPage: './perf-list-page.css',
	};
	static state = {
		count: 500,
		items: [],
		report: [],
		status: 'idle',
		busy: false,
		listType: 'each-class',
		census: null,
		memory: null,
		history: [],
		depthRoot: null,
		depth: 8,
		depthValue: 0,
		depthSnapshot: null,
		depthBreakdown: [],
		depthHistory: [],
	};
	manualChildren = [];
	depthRunCounter = 0;
	onMount() {
		this.observe('items', this.handleItemsChange);
		this.observe('listType', this.handleListTypeChange);
		this.state.items = buildItems(this.state.count);
		this.refreshCensus();
		// Framework-tracked interval: auto-cleared on disconnect via the
		// `clearIntervals` lifecycle sweep. One arrow allocation at mount —
		// not on a hot path.
		this.addInterval(() => {
			this.refreshCensus();
		}, 5000);
	}
	refreshCensus() {
		// Both Perf.census() and Perf.memory() allocate fresh objects each call.
		// When the document is idle and the heap is stable, those fresh objects
		// are structurally equal to the previous ones — assigning them would
		// trigger the framework's "wasted set" warning and re-patch every
		// observer of `census`/`memory` (ui-stat-table rows, top-tag list,
		// memory rows). Skip the write when structurally equal so the 2s poll
		// is silent during idle periods.
		const nextCensus = Perf.census();
		if (!plainEqual(this.state.census, nextCensus)) {
			this.state.census = nextCensus;
		}
		const nextMemory = Perf.memory();
		if (!plainEqual(this.state.memory, nextMemory)) {
			this.state.memory = nextMemory;
		}
	}
	handleItemsChange() {
		if (this.state.listType === 'manual') {
			this.rebuildManualList();
		}
	}
	handleListTypeChange() {
		if (this.state.listType === 'manual') {
			this.rebuildManualList();
		} else {
			this.clearManualList();
		}
	}
	clearManualList() {
		const container = this.refs?.mlist;
		if (container) {
			container.replaceChildren();
		}
		this.manualChildren = [];
	}
	rebuildManualList() {
		const container = this.refs?.mlist;
		if (!container) {
			return;
		}
		const items = this.state.items;
		const fragment = document.createDocumentFragment();
		const children = new Array(items.length);
		for (let i = 0; i < items.length; i++) {
			const el = new PerfListItem();
			el.state = items[i];
			fragment.appendChild(el);
			children[i] = el;
		}
		container.replaceChildren(fragment);
		this.manualChildren = children;
	}
	updateManualChildren() {
		const items = this.state.items;
		const children = this.manualChildren;
		const len = Math.min(items.length, children.length);
		for (let i = 0; i < len; i++) {
			children[i].assignState(items[i]);
		}
	}
	onCountInput(domEvent) {
		const parsed = Number(domEvent.target.value);
		if (Number.isFinite(parsed) && parsed > 0) {
			this.state.count = Math.min(5000, Math.floor(parsed));
		}
	}
	pickEachClass() {
		this.state.listType = 'each-class';
	}
	pickEachTag() {
		this.state.listType = 'each-tag';
	}
	pickEachFn() {
		this.state.listType = 'each-fn';
	}
	pickFullCard() {
		this.state.listType = 'each-full-card';
	}
	pickManual() {
		this.state.listType = 'manual';
	}
	onDepthInput(domEvent) {
		const parsed = Number(domEvent.target.value);
		if (Number.isFinite(parsed) && parsed >= 1) {
			this.state.depth = Math.min(24, Math.floor(parsed));
		}
	}
	mountDepthTree() {
		const container = this.refs?.depthhost;
		if (!container) {
			return;
		}
		this.disposeDepthTree();
		const root = new PerfDeepNode();
		root.state.maxDepth = this.state.depth;
		root.state.depth = this.state.depth;
		root.state.value = 0;
		root.state.token = 0;
		container.appendChild(root);
		this.state.depthRoot = root;
	}
	disposeDepthTree() {
		const container = this.refs?.depthhost;
		if (container) {
			container.replaceChildren();
		}
		this.state.depthRoot = null;
	}
	async runDepthBench() {
		if (this.state.busy) {
			return;
		}
		this.state.busy = true;
		this.state.status = `depth bench — d${this.state.depth} cold mount…`;
		this.disposeDepthTree();
		await waitForFrames(2);
		Perf.start();
		this.mountDepthTree();
		await waitForFrames(this.state.depth + 4);
		const mountReport = Perf.report();
		Perf.stop();
		const root = this.state.depthRoot;
		if (!root) {
			this.state.status = 'depth bench aborted — root missing';
			this.state.busy = false;
			return;
		}
		this.depthRunCounter += 1;
		const runId = this.depthRunCounter;
		const propagationRuns = 5;
		const runs = new Array(propagationRuns);
		Perf.start();
		for (let i = 0; i < propagationRuns; i++) {
			const nextValue = (i + 1) * 7;
			const nextToken = (runId * 1000) + i + 1;
			PropagationTracker.begin(nextToken);
			root.state.value = nextValue;
			root.state.token = nextToken;
			await waitForFrames(this.state.depth + 4);
			runs[i] = PropagationTracker.snapshot();
		}
		Perf.stop();
		const lastSnapshot = runs[runs.length - 1];
		const propReport = Perf.report();
		const breakdown = collectDepthBreakdown(propReport);
		const patchTotal = pickReportField(propReport, 'patch', 'totalMs');
		const renderTotal = pickReportField(propReport, 'renderView', 'totalMs');
		this.state.depthSnapshot = lastSnapshot;
		this.state.depthBreakdown = breakdown;
		this.state.depthHistory = [
			depthHistoryRow({
				runId,
				depth: this.state.depth,
				value: this.state.depthValue + propagationRuns,
				firstMs: lastSnapshot.firstDeltaMs,
				lastMs: lastSnapshot.lastDeltaMs,
				leaves: lastSnapshot.leafCount,
				patchMs: patchTotal,
				renderMs: renderTotal,
			}),
			...this.state.depthHistory.slice(0, 8),
		];
		this.state.depthValue += propagationRuns;
		this.state.report = mountReport;
		this.state.status = `depth bench done — d${this.state.depth} · first ${lastSnapshot.firstDeltaMs.toFixed(2)}ms · last ${lastSnapshot.lastDeltaMs.toFixed(2)}ms`;
		this.state.busy = false;
		this.refreshCensus();
	}
	regenerateItems() {
		if (this.state.busy) {
			return;
		}
		this.state.items = buildItems(this.state.count);
		this.state.status = `regenerated ${this.state.count} items`;
	}
	async updateAll() {
		if (this.state.busy) {
			return;
		}
		this.state.busy = true;
		this.state.status = 'updating all items…';
		Perf.start();
		const items = this.state.items;
		for (let i = 0; i < items.length; i++) {
			this.state.items[i] = {
				...items[i],
				value: Math.floor(Math.random() * 10000),
			};
		}
		if (this.state.listType === 'manual') {
			this.updateManualChildren();
		}
		await waitForFrames(3);
		Perf.stop();
		this.state.report = Perf.report();
		this.state.status = `updated ${items.length} items`;
		this.state.busy = false;
		this.refreshCensus();
	}
	async replaceStateBench() {
		if (this.state.busy) {
			return;
		}
		this.state.busy = true;
		this.state.status = 'replacing state…';
		Perf.start();
		this.state.items = buildItems(this.state.count);
		await waitForFrames(3);
		Perf.stop();
		this.state.report = Perf.report();
		this.state.status = `replaced state (${this.state.count} items)`;
		this.state.busy = false;
		this.refreshCensus();
	}
	async runMountBenchmark() {
		if (this.state.busy) {
			return;
		}
		this.state.busy = true;
		this.state.status = `mount benchmark — ${this.state.listType} — clearing then refilling…`;
		this.state.items = [];
		await waitForFrames(2);
		Perf.start();
		this.state.items = buildItems(this.state.count);
		await waitForFrames(3);
		Perf.stop();
		const report = Perf.report();
		this.state.report = report;
		this.state.history = [
			summarizeReport(this.state.listType, this.state.count, report),
			...this.state.history.filter((row) => {
				return row.key !== this.state.listType;
			}),
		];
		this.state.status = `mounted ${this.state.count} items (${this.state.listType})`;
		this.state.busy = false;
		this.refreshCensus();
	}
	async runAllModesBenchmark() {
		if (this.state.busy) {
			return;
		}
		const modes = [
			'each-class',
			'each-tag',
			'each-fn',
			'each-full-card',
			'manual',
		];
		const nextHistory = [];
		for (let i = 0; i < modes.length; i++) {
			this.state.listType = modes[i];
			await waitForFrames(8);
			await this.runMountBenchmark();
			const snapshotReport = this.state.report;
			nextHistory.push(summarizeReport(modes[i], this.state.count, snapshotReport));
		}
		this.state.history = nextHistory;
		this.state.status = `swept ${modes.length} list modes`;
	}
	clearReport() {
		Perf.clear();
		this.state.report = [];
		this.state.status = 'report cleared';
	}
	render() {
		const listType = this.state.listType;
		const reportTableState = {
			title: 'Operation stats — last benchmark',
			hint: 'Sync (construct, patch) = cleanest signal. Async (connect/renderView/updateView) wall-time includes overlapping child awaits.',
			columns: REPORT_COLUMNS,
			rows: reportRows(this.state.report),
			emptyMessage: 'run a mount benchmark above to populate',
		};
		const historyTableState = {
			title: 'Per-list-mode history (totalMs)',
			hint: 'Last result captured for each list mode. Use "Run all modes" to populate every row.',
			columns: HISTORY_COLUMNS,
			rows: this.state.history,
			emptyMessage: 'no history — run "Run all modes" or switch list mode then bench',
		};
		const censusTableState = {
			title: 'Live framework census',
			hint: 'Snapshot refreshed every 5s + after every benchmark. Counts DOM-walked WebComponent instances and their subscriptions. Equal snapshots are skipped (no patch).',
			columns: CENSUS_COLUMNS,
			rows: censusToRows(this.state.census),
			emptyMessage: '—',
		};
		const tagTableState = {
			title: 'Top tags (live)',
			columns: TAG_COLUMNS,
			rows: tagBreakdownRows(this.state.census),
			emptyMessage: '—',
		};
		const memoryTableState = {
			title: 'JS heap',
			hint: 'Chromium-only. Coarse but useful for spotting leaks across passes.',
			columns: MEMORY_COLUMNS,
			rows: memoryRows(this.state.memory),
			emptyMessage: '—',
		};
		const archTableState = {
			title: 'Framework architecture (subsystem map)',
			hint: 'Read-only map of the framework subsystems. Useful when discovering where a perf concern lives.',
			columns: ARCHITECTURE_COLUMNS,
			rows: ARCHITECTURE_ROWS,
		};
		const depthTableState = {
			title: 'Propagation timing (last run)',
			hint: 'firstDelta = root mutation → first leaf renders. lastDelta = root → all leaves done. Per-level rows show aggregated render time at each depth.',
			columns: DEPTH_COLUMNS,
			rows: depthRows(this.state.depthSnapshot, this.state.depthBreakdown),
			emptyMessage: 'run a depth bench below to populate',
		};
		const depthHistoryTableState = {
			title: 'Depth bench history (most recent first)',
			hint: 'Each row = one depth-bench run (5 cascading mutations through the tree).',
			columns: DEPTH_HISTORY_COLUMNS,
			rows: this.state.depthHistory,
			emptyMessage: 'no history',
		};
		
		this.html `
			<div class="page">
				<header class="head">
					<h1>UWC Performance Dashboard</h1>
					<p class="hint">Component construction + reactive update profiling for the Universal Web Components (UWC) framework. Read-only and dev-only — gated by <code>IS_PRODUCTION</code>.</p>
				</header>
				<section class="controls">
					<label class="count">
						items
						<input type="number" min="1" max="5000" step="50" .value=${String(this.state.count)} @input=${this.onCountInput}>
					</label>
					<button @click=${this.regenerateItems} ?disabled=${this.state.busy}>Regenerate</button>
					<button @click=${this.runMountBenchmark} ?disabled=${this.state.busy}>Mount bench</button>
					<button @click=${this.runAllModesBenchmark} ?disabled=${this.state.busy}>Run all modes</button>
					<button @click=${this.updateAll} ?disabled=${this.state.busy}>Update all values</button>
					<button @click=${this.replaceStateBench} ?disabled=${this.state.busy}>Replace state</button>
					<button @click=${this.clearReport} ?disabled=${this.state.busy}>Clear report</button>
					<button @click=${this.refreshCensus}>Refresh census</button>
				</section>
				<section class="list-type-row">
					<span class="list-type-label">list mode:</span>
					<button class=${listType === 'each-class' ? 'list-type active' : 'list-type'} @click=${this.pickEachClass} ?disabled=${this.state.busy}>each(items, Class)</button>
					<button class=${listType === 'each-tag' ? 'list-type active' : 'list-type'} @click=${this.pickEachTag} ?disabled=${this.state.busy}>each(items, "tag")</button>
					<button class=${listType === 'each-fn' ? 'list-type active' : 'list-type'} @click=${this.pickEachFn} ?disabled=${this.state.busy}>each(items, builder)</button>
					<button class=${listType === 'each-full-card' ? 'list-type active' : 'list-type'} @click=${this.pickFullCard} ?disabled=${this.state.busy}>each(items, FullCard)</button>
					<button class=${listType === 'manual' ? 'list-type active' : 'list-type'} @click=${this.pickManual} ?disabled=${this.state.busy}>manual appendChild</button>
				</section>
				<section class="status">
					<span class="label">status:</span>
					<span class="value">${this.state.status}</span>
				</section>
				<section class="dashboard">
					<div class="dash-col">
						<ui-stat-table .state=${reportTableState}></ui-stat-table>
						<ui-stat-table .state=${historyTableState}></ui-stat-table>
					</div>
					<div class="dash-col">
						<ui-stat-table .state=${censusTableState}></ui-stat-table>
						<ui-stat-table .state=${memoryTableState}></ui-stat-table>
						<ui-stat-table .state=${tagTableState}></ui-stat-table>
					</div>
				</section>
				<section class="dashboard-wide">
					<ui-stat-table .state=${archTableState}></ui-stat-table>
				</section>
				<section class="list ${listType === 'each-class' ? 'active-list' : 'hidden-list'}" aria-label="each(items, Class)">
					<div class="list-header"><span class="h-cell">id</span><span class="h-cell">label</span><span class="h-cell num">value</span><span class="h-cell num">doubled</span><span class="h-cell num">parity</span></div>
					${each(listType === 'each-class' ? this.state.items : [], PerfListItem, itemKey)}
				</section>
				<section class="list ${listType === 'each-tag' ? 'active-list' : 'hidden-list'}" aria-label="each(items, 'tag')">
					<div class="list-header"><span class="h-cell">id</span><span class="h-cell">label</span><span class="h-cell num">value</span><span class="h-cell num">doubled</span><span class="h-cell num">parity</span></div>
					${each(listType === 'each-tag' ? this.state.items : [], 'perf-list-item', itemKey)}
				</section>
				<section class="list ${listType === 'each-fn' ? 'active-list' : 'hidden-list'}" aria-label="each(items, builder)">
					<div class="list-header"><span class="h-cell">id</span><span class="h-cell">label</span><span class="h-cell num">value</span><span class="h-cell num">doubled</span><span class="h-cell num">parity</span></div>
					${each(listType === 'each-fn' ? this.state.items : [], buildPerfListItemElement, itemKey)}
				</section>
				<section class="list ${listType === 'each-full-card' ? 'active-list' : 'hidden-list'}" aria-label="each(items, FullCard)">
					${each(listType === 'each-full-card' ? this.state.items : [], buildPerfFullCardElement, itemKey)}
				</section>
				<section #mlist class="list ${listType === 'manual' ? 'active-list' : 'hidden-list'}" aria-label="manual appendChild"></section>
				<section class="depth-section">
					<h2>Depth-propagation bench</h2>
					<p class="hint">Cold-mount a tree of <code>&lt;perf-deep-node&gt;</code> N levels deep, then trigger 5 root mutations and measure end-to-end propagation (root → first leaf, root → last leaf). Per-level render aggregates appear in the table.</p>
					<div class="depth-controls">
						<label>
							depth
							<input type="number" min="1" max="24" step="1" .value=${String(this.state.depth)} @input=${this.onDepthInput}>
						</label>
						<button @click=${this.runDepthBench} ?disabled=${this.state.busy}>Run depth bench</button>
						<button @click=${this.disposeDepthTree} ?disabled=${this.state.busy}>Dispose tree</button>
					</div>
					<div class="dashboard">
						<div class="dash-col">
							<ui-stat-table .state=${depthTableState}></ui-stat-table>
						</div>
						<div class="dash-col">
							<ui-stat-table .state=${depthHistoryTableState}></ui-stat-table>
						</div>
					</div>
					<div #depthhost class="depth-tree"></div>
				</section>
			</div>
		`;
	}
}
customElements.define('perf-list-page', PerfListPage);
