import '../../global/ui-stat-table/ui-stat-table.js';
import { WebComponent, each, html } from '../../core/index.js';
import { Perf } from '../../core/debug/perf.js';
import { PerfListItem } from '../../perf/perf-list-item/perf-list-item.js';
// CDN ESM URLs — pinned to majors, fetched once at module load. Top-level await
// is fine in modern modules and matches our "no build step" stance.
//   Lit 3:  https://esm.sh/lit@3 — tagged-template + custom-element runtime
//   Vue 3:  runtime compiler build — the compiler runs on first template
//           instantiation, the apples-to-apples mirror of our runtime parse.
//           VaporMode (compile-first) is excluded by design.
const litMod = await import('https://esm.sh/lit@3');
const litRepeatMod = await import('https://esm.sh/lit@3/directives/repeat.js');
const vueMod = await import('https://unpkg.com/vue@3/dist/vue.esm-browser.js');
const {
	LitElement, html: litHtml,
} = litMod;
const { repeat: litRepeat } = litRepeatMod;
const {
	createApp: vueCreateApp, defineComponent: vueDefine, ref: vueRef, nextTick: vueNextTick,
} = vueMod;
// ── Item builders — same five-spot row shape across all three frameworks ─────
function buildItems(count) {
	const out = new Array(count);
	for (let index = 0; index < count; index++) {
		out[index] = {
			id: index,
			label: `Item ${index}`,
			value: (index * 2654435761) % 10000,
		};
	}
	return out;
}
function itemKey(item) {
	return item.id;
}
// Row CSS for the UWC-light column. Its rows live in the light list's OWN shadow
// (so the host's `.list-host .row` can't reach them) — adopt the identical flex
// layout/colors here so all four columns render the same. The light-DOM columns
// (Vue, Lit) are already styled by the host `.list-host .row` rules.
const SHOOTOUT_ROW_SHEET = new CSSStyleSheet();
SHOOTOUT_ROW_SHEET.replaceSync(`
	.row { display: flex; gap: 12px; padding: 3px 10px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; border-bottom: 1px solid rgba(255,255,255,0.03); align-items: center; }
	.row .id { color: rgba(255,255,255,0.35); min-width: 44px; }
	.row .label { color: rgba(255,255,255,0.85); flex: 1; }
	.row .value { color: #6366f1; font-variant-numeric: tabular-nums; min-width: 50px; text-align: right; }
	.row .doubled { color: rgba(165,180,252,0.75); font-variant-numeric: tabular-nums; min-width: 50px; text-align: right; }
	.row .parity { color: rgba(255,255,255,0.45); min-width: 32px; }
`);
// Op transforms — first-class, uniform `(context)` signature (`{ count,
// preItems }`) so the op table references them directly (no inline arrows, no
// unused positional params). Each returns the NEXT items array; the keyed
// reconcile decides create/update/move/remove per row.
function emptyItems() {
	return [];
}
function fullItems(context) {
	return buildItems(context.count);
}
function doubleItems(context) {
	return buildItems(context.count * 2);
}
function halfItems(context) {
	return buildItems(Math.floor(context.count / 2));
}
function mutateEvery10th(context) {
	const out = context.preItems.slice();
	for (let index = 0; index < out.length; index += 10) {
		const row = out[index];
		out[index] = {
			id: row.id,
			label: row.label,
			value: row.value + 1,
		};
	}
	return out;
}
function swapRows(context) {
	const out = context.preItems.slice();
	if (out.length < 4) {
		return out;
	}
	const low = 1;
	const high = out.length - 2;
	const held = out[low];
	out[low] = out[high];
	out[high] = held;
	return out;
}
// Each op: a `pre` state to establish (setup, untimed) then `next` to apply
// (timed). The keyed diff turns the array transition into the named operation.
const SHOOTOUT_OPS = [
	{
		id: 'create',
		label: 'create',
		makePre: emptyItems,
		makeNext: fullItems,
	},
	{
		id: 'updateAll',
		label: 'update all',
		makePre: fullItems,
		makeNext: fullItems,
	},
	{
		id: 'update10th',
		label: 'upd 10th',
		makePre: fullItems,
		makeNext: mutateEvery10th,
	},
	{
		id: 'append',
		label: 'append',
		makePre: fullItems,
		makeNext: doubleItems,
	},
	{
		id: 'swap',
		label: 'swap',
		makePre: fullItems,
		makeNext: swapRows,
	},
	{
		id: 'removeHalf',
		label: 'remove ½',
		makePre: fullItems,
		makeNext: halfItems,
	},
	{
		id: 'clear',
		label: 'clear',
		makePre: fullItems,
		makeNext: emptyItems,
	},
];
function microtask() {
	return Promise.resolve();
}
// Fewer timed iterations as the workload grows — keeps a full 3-framework × 7-op
// sweep responsive at 10k+ while staying statistically usable at small counts.
function iterationsForCount(count) {
	if (count >= 10000) {
		return 5;
	}
	if (count >= 5000) {
		return 8;
	}
	return 14;
}
// ── UWC implementation — keyed each(), the mirror of Lit repeat / Vue v-for ──
class UwcShootoutList extends WebComponent {
	static url = import.meta.url;
	static state = {
		items: [],
	};
	render() {
		// Bare-read keyed list — `each()` rebuilds the LiveList on the items
		// renderDep change and the list spot keyed-diffs it (create/update/move/
		// remove per `itemKey`). Same contract as Lit's keyed repeat.
		// eslint-disable-next-line no-unused-expressions
		this.html `${each(this.state.items, PerfListItem, itemKey)}`;
	}
}
customElements.define('uwc-shootout-list', UwcShootoutList);
// ── UWC LIGHTWEIGHT implementation — each() with a plain-DOM row (no per-row
// component / shadow / lifecycle). Same five-spot row shape; the list clones a
// shared recipe and surgically patches retained spots. ─────────────────────────
function perfLightRow(item) {
	return html `
		<div class="row">
			<span class="id">#${item.id}</span>
			<span class="label">^text${item.label}</span>
			<span class="value">${item.value}</span>
			<span class="doubled">${item.value * 2}</span>
			<span class="parity">^text${item.value % 2 === 0 ? 'even' : 'odd'}</span>
		</div>`;
}
class UwcLightShootoutList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		row: SHOOTOUT_ROW_SHEET,
	};
	static state = {
		items: [],
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `${each(this.state.items, perfLightRow, itemKey)}`;
	}
}
customElements.define('uwc-light-shootout-list', UwcLightShootoutList);
// ── Lit implementation ───────────────────────────────────────────────────────
// Lit's reactive-property API REQUIRES the `type:` descriptor key; our
// no-`type`-as-key rule targets first-party code, not a third-party framework's
// contract — scoped-disable for the faithful Lit comparison.
/* eslint-disable no-restricted-syntax */
// Lit at its fastest reasonable form: keyed `repeat` with INLINE html rows — no
// per-row custom element (that heavier per-row-component form is the component
// tier, the mirror of UWC's `class` kind). Rows render into light DOM
// (createRenderRoot → this), styled by the host's `.list-host .row`. This is the
// fair lightweight-vs-lightweight comparison against UWC-light.
class LitShootoutList extends LitElement {
	static properties = {
		items: {
			type: Array,
		},
	};
	constructor() {
		super();
		this.items = [];
	}
	createRenderRoot() {
		return this;
	}
	render() {
		return litHtml `${litRepeat(this.items, itemKey, (item) => {
			return litHtml `
				<div class="row">
					<span class="id">#${item.id}</span>
					<span class="label">${item.label}</span>
					<span class="value">${item.value}</span>
					<span class="doubled">${item.value * 2}</span>
					<span class="parity">${item.value % 2 === 0 ? 'even' : 'odd'}</span>
				</div>`;
		})}`;
	}
}
customElements.define('lit-shootout-list', LitShootoutList);
/* eslint-enable no-restricted-syntax */
// ── Vue implementation ───────────────────────────────────────────────────────
// Vue at its fastest reasonable form: INLINE v-for rows, no per-row component.
// Rows are light DOM under the mount host (in the framework-shootout shadow),
// styled by the host's `.list-host .row`.
const VueShootoutList = vueDefine({
	name: 'VueShootoutList',
	setup() {
		const items = vueRef([]);
		return {
			items,
		};
	},
	template: `
		<div class="row" v-for="item in items" :key="item.id">
			<span class="id">#{{ item.id }}</span>
			<span class="label">{{ item.label }}</span>
			<span class="value">{{ item.value }}</span>
			<span class="doubled">{{ item.value * 2 }}</span>
			<span class="parity">{{ item.value % 2 === 0 ? 'even' : 'odd' }}</span>
		</div>
	`,
});
// ── Adapters — one uniform surface per framework ─────────────────────────────
// `applied()` awaits the framework's DOM commit AND its row children's commit,
// so a timed op ends only when the list is "fully applied" (not merely
// scheduled). That child-await is why UWC/Lit pay an async-coordination cost
// that Vue's synchronous tree patch does not — an honest architectural signal.
class UwcAdapter {
	constructor(host) {
		this.label = 'UWC';
		this.host = host;
		this.root = null;
	}
	ensureMounted() {
		if (this.root) {
			return;
		}
		const root = document.createElement('uwc-shootout-list');
		this.host.replaceChildren(root);
		this.root = root;
	}
	setItems(items) {
		this.root.state.items = items;
	}
	rowCount() {
		return this.root.shadowRoot ? this.root.shadowRoot.querySelectorAll('perf-list-item').length : 0;
	}
	async applied() {
		// Let the items renderDep patch pass run (creates/updates child rows).
		await microtask();
		await microtask();
		const shadow = this.root.shadowRoot;
		if (!shadow) {
			return;
		}
		const rows = shadow.querySelectorAll('perf-list-item');
		const pending = [];
		for (let index = 0; index < rows.length; index++) {
			const whenRendered = rows[index].lifecycle?.whenRendered;
			if (whenRendered) {
				pending.push(whenRendered);
			}
		}
		if (pending.length) {
			await Promise.all(pending);
		}
	}
}
class UwcLightAdapter {
	constructor(host) {
		this.label = 'UWC-light';
		this.host = host;
		this.root = null;
	}
	ensureMounted() {
		if (this.root) {
			return;
		}
		const root = document.createElement('uwc-light-shootout-list');
		this.host.replaceChildren(root);
		this.root = root;
	}
	setItems(items) {
		this.root.state.items = items;
	}
	rowCount() {
		return this.root.shadowRoot ? this.root.shadowRoot.querySelectorAll('.row').length : 0;
	}
	async applied() {
		// Light rows render synchronously inside the parent's renderDep patch
		// pass (one scheduled microtask) — no per-row custom element / whenRendered
		// to await. Drain a few microtasks so the patch pass commits.
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
	}
}
class LitAdapter {
	constructor(host) {
		this.label = 'Lit 3';
		this.host = host;
		this.root = null;
	}
	ensureMounted() {
		if (this.root) {
			return;
		}
		const root = document.createElement('lit-shootout-list');
		this.host.replaceChildren(root);
		this.root = root;
	}
	setItems(items) {
		this.root.items = items;
	}
	rowCount() {
		return this.root.querySelectorAll('lit-list-item').length;
	}
	async applied() {
		await this.root.updateComplete;
		const rows = this.root.querySelectorAll('lit-list-item');
		const pending = new Array(rows.length);
		for (let index = 0; index < rows.length; index++) {
			pending[index] = rows[index].updateComplete;
		}
		if (pending.length) {
			await Promise.all(pending);
		}
	}
}
class VueAdapter {
	constructor(host) {
		this.label = 'Vue 3';
		this.host = host;
		this.app = null;
		this.instance = null;
	}
	ensureMounted() {
		if (this.app) {
			return;
		}
		this.app = vueCreateApp(VueShootoutList);
		this.instance = this.app.mount(this.host);
	}
	setItems(items) {
		this.instance.items = items;
	}
	rowCount() {
		return this.host.querySelectorAll('.row').length;
	}
	async applied() {
		// Vue patches the whole component subtree synchronously within the tick;
		// nextTick resolves once that DOM is committed — children included.
		await vueNextTick();
	}
}
// One bench scenario: establish `pre` (untimed setup), then time `next`. Held
// as a class so the Perf.bench callbacks are thin prototype-delegating thunks
// rather than per-call closures over loose state.
class BenchRun {
	constructor(adapter, operation, count) {
		this.adapter = adapter;
		this.operation = operation;
		this.count = count;
		this.preItems = null;
	}
	async setup() {
		this.preItems = this.operation.makePre({
			count: this.count,
			preItems: null,
		});
		this.adapter.setItems(this.preItems);
		await this.adapter.applied();
	}
	async run() {
		this.adapter.setItems(this.operation.makeNext({
			count: this.count,
			preItems: this.preItems,
		}));
		await this.adapter.applied();
	}
}
// ── Results table ────────────────────────────────────────────────────────────
function buildResultColumns() {
	const columns = new Array(SHOOTOUT_OPS.length + 1);
	columns[0] = {
		id: 'framework',
		label: 'framework',
		width: '1.1fr',
	};
	for (let index = 0; index < SHOOTOUT_OPS.length; index++) {
		columns[index + 1] = {
			id: SHOOTOUT_OPS[index].id,
			label: SHOOTOUT_OPS[index].label,
		};
	}
	return columns;
}
const RESULT_COLUMNS = buildResultColumns();
function formatCell(p50Ms, baselineP50Ms) {
	if (p50Ms == null) {
		return '—';
	}
	if (baselineP50Ms == null || baselineP50Ms <= 0) {
		return p50Ms.toFixed(2);
	}
	const ratio = p50Ms / baselineP50Ms;
	return `${p50Ms.toFixed(2)} · ×${ratio.toFixed(2)}`;
}
function buildResultRows(samplesByFramework, baselineLabel) {
	const baseline = samplesByFramework.get(baselineLabel);
	const labels = [...samplesByFramework.keys()];
	const rows = new Array(labels.length);
	for (let labelIndex = 0; labelIndex < labels.length; labelIndex++) {
		const label = labels[labelIndex];
		const opCells = samplesByFramework.get(label);
		const cells = new Array(RESULT_COLUMNS.length);
		cells[0] = label;
		for (let opIndex = 0; opIndex < SHOOTOUT_OPS.length; opIndex++) {
			const opId = SHOOTOUT_OPS[opIndex].id;
			const isBaseline = label === baselineLabel;
			cells[opIndex + 1] = formatCell(opCells[opId], isBaseline ? null : baseline?.[opId]);
		}
		rows[labelIndex] = {
			key: label,
			cells,
		};
	}
	return rows;
}
// ── Host component ───────────────────────────────────────────────────────────
// Persisted run history so results can be tracked over time (survives reloads;
// export to a file to commit a baseline). One record per `benchAll`.
const SHOOTOUT_HISTORY_KEY = 'uwc-shootout-history';
const SHOOTOUT_HISTORY_CAP = 500;
function readHistory() {
	const store = globalThis.localStorage;
	if (!store) {
		return [];
	}
	const raw = store.getItem(SHOOTOUT_HISTORY_KEY);
	if (!raw) {
		return [];
	}
	// JSON.parse only throws if the persisted blob was externally corrupted —
	// a genuinely exceptional case that cannot be checked without parsing.
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (parseError) {
		console.error('[shootout] history parse failed, resetting:', parseError);
		return [];
	}
}
export class FrameworkShootout extends WebComponent {
	static url = import.meta.url;
	static styles = {
		frameworkShootout: './framework-shootout.css',
	};
	static state = {
		count: 50,
		busy: false,
		bootStatus: 'ready — Lit + Vue loaded from CDN.',
		status: 'idle — press "Bench all" to run every operation on each framework.',
		results: [],
		historyCount: 0,
	};
	uwcAdapter = null;
	uwcLightAdapter = null;
	litAdapter = null;
	vueAdapter = null;
	onMount() {
		this.uwcAdapter = new UwcAdapter(this.refs.uwchost);
		this.uwcLightAdapter = new UwcLightAdapter(this.refs.uwclighthost);
		this.litAdapter = new LitAdapter(this.refs.lithost);
		this.vueAdapter = new VueAdapter(this.refs.vuehost);
		this.state.historyCount = readHistory().length;
	}
	saveRun(record) {
		const store = globalThis.localStorage;
		if (!store) {
			return 0;
		}
		const runHistory = readHistory();
		runHistory.push(record);
		const capped = runHistory.length > SHOOTOUT_HISTORY_CAP ? runHistory.slice(runHistory.length - SHOOTOUT_HISTORY_CAP) : runHistory;
		// setItem throws on quota — exceptional; keep the in-memory count honest.
		try {
			store.setItem(SHOOTOUT_HISTORY_KEY, JSON.stringify(capped));
		} catch (storageError) {
			console.error('[shootout] could not persist results:', storageError);
		}
		return capped.length;
	}
	exportResults() {
		const runHistory = readHistory();
		const blobOptions = {};
		blobOptions.type = 'application/json';
		const blob = new Blob([JSON.stringify(runHistory, null, '\t')], blobOptions);
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `uwc-shootout-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}
	clearResults() {
		globalThis.localStorage?.removeItem(SHOOTOUT_HISTORY_KEY);
		this.state.historyCount = 0;
		this.state.status = 'results history cleared.';
	}
	onCountInput(domEvent) {
		const parsed = Number(domEvent.target.value);
		if (Number.isFinite(parsed) && parsed > 0) {
			this.state.count = Math.min(20000, Math.floor(parsed));
		}
	}
	async clearAll() {
		const adapters = [
			this.uwcAdapter,
			this.uwcLightAdapter,
			this.litAdapter,
			this.vueAdapter,
		];
		for (let index = 0; index < adapters.length; index++) {
			const adapter = adapters[index];
			adapter.ensureMounted();
			adapter.setItems([]);
			await adapter.applied();
		}
		this.state.status = 'cleared.';
	}
	async benchAdapter(adapter, count, iterations) {
		const cells = {};
		for (let opIndex = 0; opIndex < SHOOTOUT_OPS.length; opIndex++) {
			const operation = SHOOTOUT_OPS[opIndex];
			this.state.status = `${adapter.label} · ${operation.label}…`;
			const benchRun = new BenchRun(adapter, operation, count);
			const row = await Perf.bench(`${adapter.label}:${operation.id}`, () => {
				return benchRun.run();
			}, {
				warmup: 2,
				iterations,
				setup: () => {
					return benchRun.setup();
				},
			});
			cells[operation.id] = row ? row.p50Ms : null;
		}
		adapter.setItems([]);
		await adapter.applied();
		return cells;
	}
	async benchAll() {
		if (this.state.busy) {
			return;
		}
		this.state.busy = true;
		const count = this.state.count;
		const iterations = iterationsForCount(count);
		this.state.status = `benching ${count} items × ${SHOOTOUT_OPS.length} ops × 4 frameworks…`;
		const adapters = [
			this.uwcAdapter,
			this.uwcLightAdapter,
			this.litAdapter,
			this.vueAdapter,
		];
		for (let index = 0; index < adapters.length; index++) {
			adapters[index].ensureMounted();
		}
		const samplesByFramework = new Map();
		for (let index = 0; index < adapters.length; index++) {
			const adapter = adapters[index];
			const cells = await this.benchAdapter(adapter, count, iterations);
			samplesByFramework.set(adapter.label, cells);
		}
		this.state.results = buildResultRows(samplesByFramework, 'UWC');
		const honest = Perf.forceGc();
		const runRecord = {
			iso: new Date().toISOString(),
			count,
			iterations,
			gcHonest: honest,
			userAgent: globalThis.navigator?.userAgent ?? '',
			ms: Object.fromEntries([...samplesByFramework.entries()]),
		};
		this.state.historyCount = this.saveRun(runRecord);
		this.state.status = `done · ${count} items · p50 ms per op · ×ratio vs UWC · ${this.state.historyCount} runs saved${honest ? '' : ' · (heap not GC-honest — relaunch Chrome with --expose-gc)'}`;
		this.state.busy = false;
	}
	render() {
		const resultTableState = {
			title: 'Per-operation comparison — p50 latency (ms), fully applied',
			hint: 'Each cell = median time for the operation to be FULLY APPLIED (framework + row-children DOM committed). create/append build rows; updateAll/upd-10th/swap reuse keys; remove ½/clear shrink. ×ratio vs UWC. Same five-spot row, same keyed reconcile across all three.',
			columns: RESULT_COLUMNS,
			rows: this.state.results,
			emptyMessage: 'press "Bench all" to populate',
		};
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="page">
				<header class="head">
					<h1>Framework Shootout — UWC vs Lit 3 vs Vue 3</h1>
					<p class="hint">Same row shape, same data, same keyed list across three runtime-template frameworks (no build step). UWC <code>each()</code> ≈ Lit <code>repeat</code> ≈ Vue <code>v-for</code>; each row is a full component (UWC + Lit custom elements, Vue component). Measured with the framework's own GC-honest <code>Perf.bench</code>.</p>
				</header>
				<section class="boot-status">${this.state.bootStatus}</section>
				<section class="controls">
					<label>
						items
						<input type="number" min="1" max="20000" step="100" .value=${String(this.state.count)} @input=${this.onCountInput}>
					</label>
					<button @click=${this.benchAll} ?disabled=${this.state.busy}>Bench all</button>
					<button @click=${this.clearAll} ?disabled=${this.state.busy}>Clear lists</button>
					<button @click=${this.exportResults} ?disabled=${this.state.busy}>Export results (${this.state.historyCount})</button>
					<button @click=${this.clearResults} ?disabled=${this.state.busy}>Clear history</button>
				</section>
				<section class="status">${this.state.status}</section>
				<section class="results">
					<ui-stat-table .state=${resultTableState}></ui-stat-table>
				</section>
				<section class="arena">
					<div class="arena-col">
						<h2>UWC <span class="lib-tag">component (full CE + shadow)</span></h2>
						<div #uwchost class="list-host"></div>
					</div>
					<div class="arena-col">
						<h2>UWC-light <span class="lib-tag">lightweight each() rows (ours)</span></h2>
						<div #uwclighthost class="list-host"></div>
					</div>
					<div class="arena-col">
						<h2>Lit 3 <span class="lib-tag">cdn esm.sh</span></h2>
						<div #lithost class="list-host"></div>
					</div>
					<div class="arena-col">
						<h2>Vue 3 <span class="lib-tag">cdn unpkg, runtime compiler</span></h2>
						<div #vuehost class="list-host"></div>
					</div>
				</section>
			</div>
		`;
	}
}
customElements.define('framework-shootout', FrameworkShootout);
