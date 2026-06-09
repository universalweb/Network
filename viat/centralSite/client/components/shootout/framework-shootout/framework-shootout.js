import '../../global/ui-stat-table/ui-stat-table.js';
import {
	WebComponent, each, html, list,
} from '../../core/index.js';
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
/*
 * Precision update — a SCALPEL test. Touch a fixed, scattered set of exact rows
 * (deterministic fractions of N, so the same spread is hit at any size) in one
 * transition. A surgical reconcile should patch ONLY these rows and leave every
 * other row's DOM untouched; a rebuild-everything strategy pays for all N. The
 * gap between this and `updateAll` is the value of keyed in-place patching.
 */
const PRECISION_FRACTIONS = [
	0, 0.13, 0.27, 0.41, 0.53, 0.67, 0.81, 0.94,
];
function precisionPositions(itemCount) {
	const positions = [];
	let previous = -1;
	for (let fractionIndex = 0; fractionIndex < PRECISION_FRACTIONS.length; fractionIndex++) {
		const position = Math.min(itemCount - 1, Math.floor(itemCount * PRECISION_FRACTIONS[fractionIndex]));
		if (position > previous) {
			positions.push(position);
			previous = position;
		}
	}
	return positions;
}
function precisionUpdate(context) {
	const out = context.preItems.slice();
	const positions = precisionPositions(out.length);
	for (let positionIndex = 0; positionIndex < positions.length; positionIndex++) {
		const index = positions[positionIndex];
		const row = out[index];
		out[index] = {
			id: row.id,
			label: row.label,
			value: row.value + 1,
		};
	}
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
		id: 'precision',
		label: 'precision',
		makePre: fullItems,
		makeNext: precisionUpdate,
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
			<span class="label">${item.label}</span>
			<span class="value">${item.value}</span>
			<span class="doubled">${item.value * 2}</span>
			<span class="parity">${item.value % 2 === 0 ? 'even' : 'odd'}</span>
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
		
		this.html `${each(this.state.items, perfLightRow, itemKey)}`;
	}
}
customElements.define('uwc-light-shootout-list', UwcLightShootoutList);
// ── UWC list() — render-less SMART list. `list('items', …)` returns a ListBinding
// that installs a SUBSCRIBING ListSpot keyed to the `items` state path: on change
// the spot keyed-diffs directly (LiveList-backed: reuse / move / deep-mutation
// surgical path) with NO component render() rerun — that rerun is each()'s extra
// cost. Distinct job from each(): a fixed state-key source, maximally smart. ─────
class UwcListShootoutList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		row: SHOOTOUT_ROW_SHEET,
	};
	static state = {
		items: [],
	};
	render() {
		
		this.html `${list('items', perfLightRow, itemKey)}`;
	}
}
customElements.define('uwc-list-shootout-list', UwcListShootoutList);
// ── UWC arrow-each — `${() => each(…)}`. The arrow compiles to a ComputedSpot:
// evaluated inside a tracking session (captures `items` as a dep), routed through
// the LIST patcher, then subscribed DIRECTLY to that dep — render-less like list(),
// but driven by an ARBITRARY expression instead of a fixed state-key. Proves the
// render-less win is reachable from the universal each() form via the arrow (the
// bare `${each()}` form can't be: it's evaluated before the engine sees it). ─────
class UwcArrowEachShootoutList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		row: SHOOTOUT_ROW_SHEET,
	};
	static state = {
		items: [],
	};
	render() {
		
		this.html `${() => {
			return each(this.state.items, perfLightRow, itemKey);
		}}`;
	}
}
customElements.define('uwc-arrow-each-shootout-list', UwcArrowEachShootoutList);
// ── UWC no-shadow (scoped light DOM) — `static useShadow = false`. Rows render into
// the host's LIGHT DOM (no per-list shadow root); `static styles` inject ONCE as
// `@scope(tag){…}`. Same each() reconcile as UWC-light — isolates the cost of the
// shadow boundary itself (this column vs UWC-light each()). ──────────────────────
class UwcNoShadowScopedShootoutList extends WebComponent {
	static url = import.meta.url;
	static useShadow = false;
	static styles = {
		row: SHOOTOUT_ROW_SHEET,
	};
	static state = {
		items: [],
	};
	render() {
		
		this.html `${each(this.state.items, perfLightRow, itemKey)}`;
	}
}
customElements.define('uwc-noshadow-scoped-shootout-list', UwcNoShadowScopedShootoutList);
// ── UWC no-shadow UNSCOPED — `useShadow = false` + `scopeStyles = false`. A plain
// element with ZERO style isolation; `static styles` emit as a global <head>
// <style>. The leanest UWC DOM (no shadow, no @scope) — the "just HTML" floor. ────
class UwcNoShadowUnscopedShootoutList extends WebComponent {
	static url = import.meta.url;
	static useShadow = false;
	static scopeStyles = false;
	static styles = {
		row: SHOOTOUT_ROW_SHEET,
	};
	static state = {
		items: [],
	};
	render() {
		
		this.html `${each(this.state.items, perfLightRow, itemKey)}`;
	}
}
customElements.define('uwc-noshadow-unscoped-shootout-list', UwcNoShadowUnscopedShootoutList);
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
		this.prevRows = null;
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
		/*
		 * `applied()` = DOM committed + rows VISUALLY rendered (`whenRendered`) — the
		 * apples-to-apples "fully applied" for every timed op, and the fair mirror of
		 * Lit's `updateComplete` (render-committed, NOT full lifecycle). The FULL
		 * connect cycle (`pendingConnect`) settles a scheduler macrotask later; that's
		 * what `handleDisconnect` awaits, so a row torn down before its connect settles
		 * stalls a frame. We do NOT await it here (that would inflate every create with
		 * lifecycle work Lit's metric excludes) — instead the untimed `settle()` fully
		 * settles the pre-state in `setup()`, so clear/remove are honest without
		 * inflating create. The snapshot becomes `prevRows` for the NEXT applied().
		 */
		const snapshot = new Array(rows.length);
		const pending = [];
		for (let index = 0; index < rows.length; index++) {
			const row = rows[index];
			snapshot[index] = row;
			const whenRendered = row.lifecycle?.whenRendered;
			if (whenRendered) {
				pending.push(whenRendered);
			}
		}
		const prevRows = this.prevRows;
		this.prevRows = snapshot;
		if (pending.length) {
			await Promise.all(pending);
		}
		/*
		 * Teardown-honesty: count the async per-component teardown of any row this
		 * transition removed. UWC detaches a removed row's DOM synchronously but runs
		 * its disconnect bookkeeping (unsub, unregister, cleanupTemplate) on a later
		 * task — counting it keeps clear/removeHalf honest vs Lit's/Vue's synchronous
		 * unmount. A row ends `handleDisconnect` by setting `phase === 'disconnected'`
		 * (the framework no longer fires a `whenDisconnected` promise — removed as
		 * dead weight), so poll that phase: the reliable, allocation-free signal.
		 */
		if (prevRows) {
			await this.awaitTeardown(prevRows);
		}
	}
	async awaitTeardown(rows) {
		/*
		 * Microtask poll until every row removed by the current op finishes teardown
		 * (`phase === 'disconnected'`). Teardown completes in ~3 microtask generations
		 * once connect is settled (the untimed `setup()` `settle()` guarantees that);
		 * the 64-generation cap can never spin on a row that was reused / reconnected
		 * (those stay `isConnected`, so the guard skips them).
		 */
		for (let drain = 0; drain < 64; drain++) {
			let pendingTeardown = false;
			for (let index = 0; index < rows.length; index++) {
				const row = rows[index];
				if (!row.isConnected && row.phase !== 'disconnected' && row.phase !== 'destroyed') {
					pendingTeardown = true;
					break;
				}
			}
			if (!pendingTeardown) {
				return;
			}
			await Promise.resolve();
		}
	}
	/*
	 * Fully SETTLE the connect cycle of the current rows — call after `applied()` in
	 * the UNTIMED `setup()` only. Each row's `handleConnect` resolves `pendingConnect`
	 * a scheduler macrotask after `whenRendered`; `handleDisconnect` opens with
	 * `await this.pendingConnect`, so tearing a row down before its connect settles
	 * stalls a frame (the 14ms-clear-at-50 artifact). Awaiting it here (untimed)
	 * leaves the pre-state fully connected so the timed clear/remove measures only
	 * teardown — without inflating the timed create (which stays on `whenRendered`).
	 */
	async settle() {
		const shadow = this.root?.shadowRoot;
		if (!shadow) {
			return;
		}
		const rows = shadow.querySelectorAll('perf-list-item');
		const pending = [];
		for (let index = 0; index < rows.length; index++) {
			const pendingConnect = rows[index].pendingConnect;
			if (pendingConnect) {
				pending.push(pendingConnect);
			}
		}
		if (pending.length) {
			await Promise.all(pending);
		}
	}
}
// Generic adapter for every UWC list VARIANT that renders plain `.row` light
// rows (each / list / arrow-each / no-shadow / dumb). `queryLight` picks where the
// rows live: the host's shadowRoot (shadow variants) or the element itself (no-
// shadow). No per-row custom element ⇒ no whenRendered / teardown to await — the
// rows commit inside the parent's patch pass / the spot's own refresh, so draining
// a few microtasks is enough for an honest "fully applied".
class UwcVariantAdapter {
	constructor(host, label, tag, queryLight) {
		this.host = host;
		this.label = label;
		this.tag = tag;
		this.queryLight = queryLight;
		this.root = null;
	}
	ensureMounted() {
		if (this.root) {
			return;
		}
		const root = document.createElement(this.tag);
		this.host.replaceChildren(root);
		this.root = root;
	}
	setItems(items) {
		this.root.state.items = items;
	}
	listRoot() {
		return this.queryLight ? this.root : this.root.shadowRoot;
	}
	rowCount() {
		const root = this.listRoot();
		return root ? root.querySelectorAll('.row').length : 0;
	}
	async applied() {
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
// Every column the shootout races, in display order. UWC ships several list
// STRATEGIES for different jobs — smart-keyed (list), render-driven (each),
// render-less computed (arrow-each), and no-shadow light DOM — raced head-to-head
// against Lit / Vue. The 'UWC' full-component row is the ×ratio baseline; labels
// are unique (used as the per-column sample-map key).
const ADAPTER_SPECS = [
	{
		kind: 'uwc-full',
		libTag: 'component (full CE + shadow)',
	},
	{
		kind: 'variant',
		label: 'UWC-light each()',
		libTag: 'lightweight each() rows',
		tag: 'uwc-light-shootout-list',
		queryLight: false,
	},
	{
		kind: 'variant',
		label: 'UWC list()',
		libTag: 'render-less subscribing ListSpot',
		tag: 'uwc-list-shootout-list',
		queryLight: false,
	},
	{
		kind: 'variant',
		label: 'UWC arrow-each',
		libTag: 'render-less computed () => each()',
		tag: 'uwc-arrow-each-shootout-list',
		queryLight: false,
	},
	{
		kind: 'variant',
		label: 'UWC no-shadow',
		libTag: 'light DOM, @scope styles',
		tag: 'uwc-noshadow-scoped-shootout-list',
		queryLight: true,
	},
	{
		kind: 'variant',
		label: 'UWC no-shadow unscoped',
		libTag: 'light DOM, global head css',
		tag: 'uwc-noshadow-unscoped-shootout-list',
		queryLight: true,
	},
	{
		kind: 'lit',
		libTag: 'cdn esm.sh',
	},
	{
		kind: 'vue',
		libTag: 'cdn unpkg, runtime compiler',
	},
];
function makeAdapter(spec, host) {
	if (spec.kind === 'uwc-full') {
		return new UwcAdapter(host);
	}
	if (spec.kind === 'lit') {
		return new LitAdapter(host);
	}
	if (spec.kind === 'vue') {
		return new VueAdapter(host);
	}
	return new UwcVariantAdapter(host, spec.label, spec.tag, spec.queryLight);
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
		/*
		 * Fully settle the pre-state OUTSIDE the timed region (UWC-full only — its
		 * per-row components have a `pendingConnect` that `handleDisconnect` awaits).
		 * Without this the timed clear/remove stalls a frame on rows whose connect
		 * hasn't settled. No-op for adapters that settle synchronously in applied().
		 */
		if (this.adapter.settle) {
			await this.adapter.settle();
		}
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
	adapters = null;
	onMount() {
		// Build one arena column per spec and wire its adapter to that column's
		// host. The whole arena lives under a single `#arena` ref — columns are
		// scaffolding the adapters own, so they're created imperatively here (once)
		// rather than via a template that couldn't hand each adapter its host.
		const arena = this.refs.arena;
		const adapters = new Array(ADAPTER_SPECS.length);
		for (let index = 0; index < ADAPTER_SPECS.length; index++) {
			const spec = ADAPTER_SPECS[index];
			const column = document.createElement('div');
			column.className = 'arena-col';
			const listHost = document.createElement('div');
			listHost.className = 'list-host';
			const adapter = makeAdapter(spec, listHost);
			const heading = document.createElement('h2');
			heading.append(document.createTextNode(`${adapter.label} `));
			const libTag = document.createElement('span');
			libTag.className = 'lib-tag';
			libTag.textContent = spec.libTag ?? adapter.libTag ?? '';
			heading.appendChild(libTag);
			column.append(heading, listHost);
			arena.appendChild(column);
			adapters[index] = adapter;
		}
		this.adapters = adapters;
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
		const adapters = this.adapters;
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
				/*
				 * 4 warmup cycles (not 2): the cold first-create — recipe parse +
				 * per-class style compile + CE upgrade + cold JIT — plus the first
				 * timed iteration's residual JIT/GC blip both land in warmup, so the
				 * timed samples are the cache-optimized steady state (full-CE create:
				 * cold run#1 ≈ 38ms → warm ≈ 16ms; excluded).
				 */
				warmup: 4,
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
		const adapters = this.adapters;
		this.state.status = `benching ${count} items × ${SHOOTOUT_OPS.length} ops × ${adapters.length} columns…`;
		/*
		 * Prime each column OUTSIDE measurement: mount it, then run one full
		 * create→settle→clear cycle. This warms the per-type caches the first timed
		 * create would otherwise pay cold (recipe parse, per-class style compile, CE
		 * upgrade, cold JIT) and lets the connect cycle settle once up front — so no
		 * timed op inherits a half-initialized class. Untimed, so it never pollutes a
		 * sample; complements the per-op warmup inside Perf.bench.
		 */
		const primeCount = Math.min(count, 100);
		for (let index = 0; index < adapters.length; index++) {
			const adapter = adapters[index];
			adapter.ensureMounted();
			adapter.setItems(buildItems(primeCount));
			await adapter.applied();
			adapter.setItems([]);
			await adapter.applied();
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
			hint: 'Each cell = median time for the operation to be FULLY APPLIED (framework + row-children DOM committed). create/append build rows; updateAll/upd-10th/precision/swap reuse keys (precision = a fixed scattered handful — the scalpel test); remove ½/clear shrink. ×ratio vs UWC. Same five-spot row across every column.',
			columns: RESULT_COLUMNS,
			rows: this.state.results,
			emptyMessage: 'press "Bench all" to populate',
		};
		
		this.html `
			<div class="page">
				<header class="head">
					<h1>Framework Shootout — UWC strategies vs Lit 3 vs Vue 3</h1>
					<p class="hint">Same row shape, same data, same keyed reconcile (no build step). UWC ships several list STRATEGIES for different jobs — <code>list()</code> (smart subscribing keyed), <code>each()</code> (render-driven), <code>() => each()</code> (render-less computed), and no-shadow light DOM — raced head-to-head against Lit <code>repeat</code> and Vue <code>v-for</code>. Measured with the GC-honest <code>Perf.bench</code>; ×ratio vs the full-component UWC baseline.</p>
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
				<div #arena class="arena"></div>
			</div>
		`;
	}
}
customElements.define('framework-shootout', FrameworkShootout);
