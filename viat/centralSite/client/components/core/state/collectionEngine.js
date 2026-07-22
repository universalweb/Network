/*
 * CollectionEngine — the HEADLESS async-load engine behind list-driven
 * components (ui-collection, feeds). No element, no template binding, no DOM
 * wiring of its own: the HOST component owns the markup (rows via `list()`/
 * `filter()`, buttons via template `@click`, a sentinel div) and the engine
 * owns the load orchestration:
 *
 *   - cursor-based paging (loader({reset, cursor, signal}) → {items,
 *     nextCursor, hasMore, totalCount?}); append on loadMore, replace on
 *     reset/goto; supersede guard (loadToken) + AbortController per request,
 *   - dedupe-by-key across pages (seenKeys) incl. prepend,
 *   - REACTIVE status: writes `host.state[key]` (the row array) and
 *     `host.state[`${key}Status`]` = {loading, error, hasMore, exhausted,
 *     page, hasPrev, totalCount, started} — hosts bind chrome declaratively
 *     (`?disabled=${…status.loading}`); no imperative DOM reflection,
 *   - near-bottom auto-load via an IntersectionObserver on a host-supplied
 *     SENTINEL element (modes scroll/both) — replaces scroll-position math
 *     and viewport fill-checks: after each load the sentinel is re-observed,
 *     so a still-visible sentinel (short page, tall screen) re-triggers
 *     natively and a display:none page stays silent until revealed.
 *     `maxAutoFill` caps consecutive auto-loads (a filter hiding every row
 *     must not hammer the loader) → `${key}:fill-capped`; a manual
 *     `loadMore()` resets the cap.
 *
 * Host contract (preferred — dual-mode `this.collection`):
 *
 *   onConnect() {
 *     this.collection('items', { loader, mode, startPage, dedupe, keyFn, … });
 *   }
 *   onRendered() { this.collection('items')?.attach({ sentinel: this.refs.s }); }
 *   // load: this.collection('items')?.loadMore() / reset / setMode / …
 *   // paint: ${this.list('items', Row)}  — never store the handle on this.list
 *
 * `this.collection(key, plainConfig)` ensure-registers a CollectionEngine on
 * `component.collections`. Dispose via lifecycle `disposeCollections` (or
 * handle.dispose()).
 *
 * Low-level: CollectionEngine.create(host, config) still works; prefer ensure.
 *
 * config: { key (set from ensure key), loader, keyFn, filter (PURE),
 * filterArg, mode ('scroll'|'button'|'both'|'paged'), auto=true,
 * startPage=1, dedupe=true, prefetch (px), maxAutoFill=8, scrollReport=false }.
 * Loader runs with `this` = host. Events: `${key}:loading|loaded|error|…`.
 */
import { getBehavior } from '../behaviors/registry.js';
import { nextFrame } from '../lifecycle/scheduler.js';
import {
	getValueAtPath,
	isFunction,
	isPlainObject,
	plainEqual,
} from '../utilities.js';
import { track } from './binding.js';
import { STATE_PATH } from './state.js';
const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/;
const DEFAULT_MAX_AUTO_FILL = 8;
/* Same default identity a ListSpot uses — key ?? id ?? index. */
function autoKey(item, index) {
	return item?.key ?? item?.id ?? index;
}
/*
 * Walk up (crossing shadow boundaries via the host) for the nearest element
 * that actually scrolls — the IntersectionObserver root candidate. Best-effort:
 * no scrollable ancestor (document scroll) → null root = the viewport.
 */
function findScrollableAncestor(startElement) {
	let node = startElement;
	while (node && node.nodeType === 1) {
		const overflowY = getComputedStyle(node).overflowY;
		if (SCROLLABLE_OVERFLOW.test(overflowY) && node.scrollHeight > node.clientHeight) {
			return node;
		}
		const ancestor = node.parentNode;
		node = ancestor && ancestor.nodeType === 11 ? ancestor.host : ancestor;
	}
	return null;
}
function readPrefetchPixels(prefetch) {
	if (typeof prefetch === 'number') {
		return prefetch;
	}
	if (typeof prefetch === 'string') {
		return parseFloat(prefetch) || 0;
	}
	return 0;
}
/**
 * Resolve the request cursor + page for a load, shared by the headless engine
 * and the template-bound controller (their status substrates differ — reactive
 * `${key}Status` vs flat fields — but the request math is identical). An
 * explicit cursor (goto) targets that page; a replace without one is page 1
 * (reset — the only case the loader's `reset` flag signals); otherwise the
 * running cursor, whose page is the number itself or the caller's current page.
 * @param {*} runningCursor - The engine's current cursor.
 * @param {number} currentPage - The caller's current page (used when the cursor isn't numeric).
 * @param {boolean} replace - True for a window-replacing load (reset/goto).
 * @param {*} [cursorOverride] - An explicit target cursor (goto), else undefined/null.
 * @returns {{cursor: *, page: number, reset: boolean}} The resolved request.
 */
export function resolveLoadRequest(runningCursor, currentPage, replace, cursorOverride) {
	if (cursorOverride !== undefined && cursorOverride !== null) {
		return {
			cursor: cursorOverride,
			page: cursorOverride,
			reset: false,
		};
	}
	if (replace) {
		return {
			cursor: null,
			page: 1,
			reset: true,
		};
	}
	return {
		cursor: runningCursor,
		page: typeof runningCursor === 'number' ? runningCursor : currentPage,
		reset: false,
	};
}
/**
 * Filter a freshly-loaded page to the items not already seen, recording each
 * kept item's key. Shared by the engine and the controller — the dedupe pass
 * was byte-identical in both (its double-maintenance was a real tk:20 cost).
 * Mutates `seenKeys` (the caller's authoritative dedupe set) in place.
 * @param {Array} incoming - The loader's returned page.
 * @param {(item: any, index: number) => any} keyFn - Item identity function.
 * @param {Set} seenKeys - The running set of seen keys.
 * @returns {Array} The subset of `incoming` not previously seen.
 */
export function dropDuplicates(incoming, keyFn, seenKeys) {
	const kept = [];
	const incomingLength = incoming.length;
	for (let index = 0; index < incomingLength; index += 1) {
		const item = incoming[index];
		const itemKey = keyFn(item, index);
		if (seenKeys.has(itemKey)) {
			continue;
		}
		seenKeys.add(itemKey);
		kept.push(item);
	}
	return kept;
}
/*
 * sentinel element → owning engine. The IO callback is ONE shared module
 * function (house pattern — behaviors/reveal.js); the WeakMap routes each
 * entry to its engine with zero per-instance closures.
 */
const SENTINEL_OWNERS = new WeakMap();
function dispatchSentinelEntries(entries) {
	const entriesLength = entries.length;
	for (let index = 0; index < entriesLength; index++) {
		const entry = entries[index];
		const engine = SENTINEL_OWNERS.get(entry.target);
		if (engine) {
			engine.handleSentinel(entry.isIntersecting);
		}
	}
}
export class CollectionEngine {
	static create(host, config) {
		return new CollectionEngine(host, config);
	}
	static is(source) {
		return source instanceof CollectionEngine;
	}
	constructor(host, config = {}) {
		this.host = host;
		this.key = config.key || 'items';
		this.statusKey = `${this.key}Status`;
		this.config = {
			loader: config.loader ?? null,
			keyFn: isFunction(config.keyFn) ? config.keyFn : autoKey,
			filter: isFunction(config.filter) ? config.filter : null,
			mode: config.mode ?? 'scroll',
			auto: config.auto !== false,
			startPage: config.startPage ?? 1,
			dedupe: config.dedupe !== false,
			prefetch: config.prefetch ?? 0,
			maxAutoFill: Number.isFinite(config.maxAutoFill) ? config.maxAutoFill : DEFAULT_MAX_AUTO_FILL,
			scrollReport: config.scrollReport === true,
		};
		this.filterArg = config.filterArg ?? null;
		this.cursor = null;
		this.loadToken = 0;
		this.abortController = null;
		this.seenKeys = new Set();
		this.autoFillCount = 0;
		this.capEmitted = false;
		this.mounted = false;
		this.disposed = false;
		this.paused = false;
		this.observer = null;
		this.observedSentinel = null;
		this.sentinelElement = null;
		this.scrollReportBehavior = null;
		this.scrollReportTarget = null;
		/*
		 * The ListSpot predicate a host passes to its `filter()` spot —
		 * `buildListView` invokes it BARE (no `this`), so this is the engine's
		 * one sanctioned per-instance function: a named forwarder into the
		 * prototype `applyFilter`.
		 */
		const engine = this;
		this.keepItem = function keepItem(item) {
			return engine.applyFilter(item);
		};
		this.ensureStatusScope();
	}
	get status() {
		return this.host.state[this.statusKey];
	}
	get items() {
		const current = this.host.state[this.key];
		return Array.isArray(current) ? current : [];
	}
	isExhausted() {
		return this.status.exhausted === true;
	}
	autoScrollMode() {
		return this.config.mode === 'scroll' || this.config.mode === 'both';
	}
	/*
	 * Seed the reactive status scope when the host did not declare it in its
	 * own `static state` (declaring it there is preferred — bindings then
	 * resolve on the very first render, before the engine exists).
	 */
	ensureStatusScope() {
		const existing = this.host.state[this.statusKey];
		if (existing && typeof existing === 'object') {
			return;
		}
		this.host.state[this.statusKey] = {
			loading: false,
			error: '',
			hasMore: true,
			exhausted: false,
			page: 1,
			hasPrev: false,
			totalCount: 0,
			started: false,
		};
	}
	/* Per-key guarded writes — an unchanged value never notifies. */
	writeStatus(partial) {
		const status = this.status;
		const keys = Object.keys(partial);
		const keysLength = keys.length;
		for (let index = 0; index < keysLength; index++) {
			const statusKey = keys[index];
			if (status[statusKey] !== partial[statusKey]) {
				status[statusKey] = partial[statusKey];
			}
		}
	}
	applyFilter(item) {
		const filterFn = this.config.filter;
		if (!filterFn) {
			return true;
		}
		return filterFn(item, this.filterArg) === true;
	}
	/**
	 * Swap the filter argument and retouch the row array (same items, new
	 * reference) so the host's `filter()` spot re-runs the predicate — the
	 * keyed diff recycles retained rows.
	 * @param {*} value - The new second argument for the pure filter predicate.
	 */
	setFilterArg(value) {
		if (this.filterArg === value) {
			return;
		}
		this.filterArg = value;
		const current = this.host.state[this.key];
		if (Array.isArray(current) && current.length > 0) {
			this.host.state[this.key] = current.slice();
		}
	}
	/*
	 * (Re)wire DOM-attached pieces from the host — idempotent and re-render
	 * safe: a full re-render recreates the sentinel, so the host calls this
	 * from `onRendered` and the observer re-arms on the fresh node. The FIRST
	 * attach also kicks the auto-load.
	 */
	attach(options) {
		if (this.disposed) {
			return;
		}
		const sentinel = options?.sentinel ?? null;
		this.sentinelElement = sentinel;
		this.ensureScrollReport(sentinel);
		this.armSentinel(sentinel);
		if (this.mounted) {
			return;
		}
		this.mounted = true;
		if (this.config.auto === false) {
			return;
		}
		this.start();
	}
	/* First load honoring startPage — the manual kick for `auto: false` hosts. */
	start() {
		const startPage = Number(this.config.startPage);
		if (Number.isFinite(startPage) && startPage > 1) {
			return this.goto(startPage);
		}
		return this.reset();
	}
	armSentinel(sentinel) {
		if (!sentinel || !this.autoScrollMode()) {
			this.disarmSentinel();
			return;
		}
		if (this.observedSentinel === sentinel && this.observer) {
			return;
		}
		this.disarmSentinel();
		const ancestor = findScrollableAncestor(sentinel);
		/*
		 * IO requires a REAL containing ancestor as root — a scrollable "ancestor"
		 * reached across a shadow hop fails contains() and would observe nothing.
		 * Null root = viewport; intersectionRect is still clipped by inner
		 * scrollers, only the prefetch margin applies at the viewport instead.
		 */
		const root = ancestor && ancestor.contains(sentinel) ? ancestor : null;
		this.observer = new IntersectionObserver(dispatchSentinelEntries, {
			root,
			rootMargin: `0px 0px ${readPrefetchPixels(this.config.prefetch)}px 0px`,
		});
		SENTINEL_OWNERS.set(sentinel, this);
		this.observedSentinel = sentinel;
		this.observer.observe(sentinel);
	}
	disarmSentinel() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
		if (this.observedSentinel) {
			SENTINEL_OWNERS.delete(this.observedSentinel);
			this.observedSentinel = null;
		}
	}
	/*
	 * IO always delivers a fresh initial record on observe — re-observing after
	 * a load re-fires the sentinel if the new rows still leave it visible (the
	 * short-first-page top-up), with no layout math on our side. Deferred one
	 * frame so the row patch has flushed and laid out first.
	 */
	async rearmAfterLoad() {
		if (!this.observer || !this.observedSentinel) {
			return;
		}
		await nextFrame();
		if (this.disposed || !this.observer || !this.observedSentinel) {
			return;
		}
		this.observer.unobserve(this.observedSentinel);
		this.observer.observe(this.observedSentinel);
	}
	handleSentinel(isIntersecting) {
		if (!isIntersecting) {
			this.autoFillCount = 0;
			this.capEmitted = false;
			return;
		}
		this.autoLoadMore();
	}
	autoLoadMore() {
		const status = this.status;
		if (this.disposed || this.paused || status.loading || !status.started || status.exhausted) {
			return;
		}
		if (!this.autoScrollMode()) {
			return;
		}
		if (this.autoFillCount >= this.config.maxAutoFill) {
			if (!this.capEmitted) {
				this.capEmitted = true;
				this.emitEvent('fill-capped');
			}
			return;
		}
		this.autoFillCount += 1;
		this.load(false);
	}
	ensureScrollReport(sentinel) {
		if (!this.config.scrollReport || !sentinel) {
			return;
		}
		const target = findScrollableAncestor(sentinel);
		if (!target || target === this.scrollReportTarget) {
			return;
		}
		this.removeScrollReport();
		const behavior = getBehavior('scroll-report');
		if (behavior) {
			behavior.install(target);
			this.scrollReportBehavior = behavior;
			this.scrollReportTarget = target;
		}
	}
	removeScrollReport() {
		if (this.scrollReportBehavior && this.scrollReportTarget) {
			this.scrollReportBehavior.uninstall(this.scrollReportTarget);
		}
		this.scrollReportBehavior = null;
		this.scrollReportTarget = null;
	}
	/* Runtime mode swap (loadmore ↔ paged). Switching INTO paged collapses the
	   accumulated window down to the single current page. */
	setMode(mode) {
		if (this.config.mode === mode) {
			return;
		}
		this.config.mode = mode;
		this.armSentinel(this.sentinelElement);
		if (mode === 'paged') {
			this.goto(this.status.page);
		}
	}
	reset() {
		this.cursor = null;
		this.autoFillCount = 0;
		this.capEmitted = false;
		this.seenKeys.clear();
		this.writeStatus({
			hasMore: true,
			exhausted: false,
			error: '',
			page: 1,
			hasPrev: false,
		});
		/*
		 * Skip a wasted []→[] reassign. The state set trap only
		 * ref-equality-skips, so a fresh [] over an already-empty list still
		 * notifies → a no-op patch pass. Clearing a non-empty list still runs.
		 */
		const currentItems = this.host.state[this.key];
		if (!Array.isArray(currentItems) || currentItems.length > 0) {
			this.host.state[this.key] = [];
		}
		return this.load(true);
	}
	refresh() {
		return this.reset();
	}
	loadMore() {
		const status = this.status;
		if (status.loading || status.exhausted || this.paused) {
			return Promise.resolve();
		}
		/* A manual load is user intent — it re-opens the auto-fill budget. */
		this.autoFillCount = 0;
		this.capEmitted = false;
		return this.load(false);
	}
	/*
	 * Jump to a specific page/cursor, REPLACING the current window — the paged
	 * (prev/next) complement to the cumulative loadMore. seenKeys clears
	 * because a replace starts a fresh window.
	 */
	goto(targetCursor) {
		this.autoFillCount = 0;
		this.capEmitted = false;
		this.seenKeys.clear();
		this.writeStatus({
			hasMore: true,
			exhausted: false,
			error: '',
		});
		return this.load(true, targetCursor);
	}
	gotoPage(targetPage) {
		const page = Number.isFinite(targetPage) && targetPage >= 1 ? targetPage : 1;
		return this.goto(page);
	}
	goPrev() {
		const status = this.status;
		if (status.loading || !status.hasPrev) {
			return Promise.resolve();
		}
		return this.gotoPage(status.page - 1);
	}
	goNext() {
		const status = this.status;
		if (status.loading || !status.hasMore) {
			return Promise.resolve();
		}
		return this.gotoPage(status.page + 1);
	}
	/*
	 * Prepend a single item — the real-time complement to cursor paging.
	 * Routed through the engine so `seenKeys` stays authoritative: a prepended
	 * item a later page re-fetches won't double-render. Reassigns the array
	 * (not `.unshift`) to fire the same reactive setter `load()` uses.
	 */
	prepend(item) {
		if (this.config.dedupe) {
			const itemKey = this.config.keyFn(item, 0);
			if (this.seenKeys.has(itemKey)) {
				return;
			}
			this.seenKeys.add(itemKey);
		}
		this.host.state[this.key] = [item].concat(this.items);
	}
	/* Core load. `replace` clears+replaces the window (reset / goto), else
	   appends (loadMore). `cursorOverride` targets a specific page (goto). */
	async load(replace, cursorOverride) {
		const config = this.config;
		if (!isFunction(config.loader)) {
			this.writeStatus({
				error: 'collection: no loader configured',
			});
			return;
		}
		/*
		 * A replace-load (reset/goto) SUPERSEDES an in-flight load — the token
		 * bump + abort turn the stale response into a no-op; only additive
		 * loads are gated, else the supersede machinery is unreachable.
		 */
		if (this.status.loading && !replace) {
			return;
		}
		const token = this.loadToken + 1;
		this.loadToken = token;
		this.abortController?.abort();
		const abortController = new AbortController();
		this.abortController = abortController;
		const request = resolveLoadRequest(this.cursor, this.status.page, replace, cursorOverride);
		this.writeStatus({
			loading: true,
			started: true,
			error: '',
			page: request.page,
			hasPrev: request.page > 1,
		});
		this.emitEvent('loading');
		let result = null;
		let failure = null;
		try {
			result = await config.loader.call(this.host, {
				reset: request.reset,
				cursor: request.cursor,
				signal: abortController.signal,
			});
		} catch (loadError) {
			failure = loadError;
		}
		if (token !== this.loadToken) {
			return;
		}
		if (failure || !result) {
			this.writeStatus({
				loading: false,
				error: failure?.message || 'Could not load results',
			});
			this.emitEvent('error');
			return;
		}
		const incoming = Array.isArray(result.items) ? result.items : [];
		const additions = config.dedupe ? dropDuplicates(incoming, config.keyFn, this.seenKeys) : incoming;
		const currentItems = this.items;
		const nextItems = replace ? additions : currentItems.concat(additions);
		/*
		 * Reuse the existing reference when the result is structurally identical
		 * — a new-but-equal array would notify a no-op patch pass. plainEqual
		 * bails on a length mismatch first, so the append path (always longer)
		 * pays only a length check.
		 */
		if (!plainEqual(currentItems, nextItems)) {
			this.host.state[this.key] = nextItems;
		}
		this.cursor = result.nextCursor ?? null;
		const hasMore = Boolean(result.hasMore);
		const statusPatch = {
			loading: false,
			hasMore,
			exhausted: !hasMore,
		};
		if (replace && typeof result.totalCount === 'number') {
			statusPatch.totalCount = result.totalCount;
		}
		this.writeStatus(statusPatch);
		this.emitEvent('loaded');
		if (!hasMore) {
			this.emitEvent('exhausted');
		}
		this.rearmAfterLoad();
	}
	emitEvent(suffix) {
		const status = this.status;
		this.host.emit?.(`${this.key}:${suffix}`, {
			key: this.key,
			loading: status.loading,
			error: status.error,
			hasMore: status.hasMore,
			exhausted: status.exhausted,
			page: status.page,
			totalCount: status.totalCount,
			count: this.items.length,
		});
	}
	dispose() {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.clearConfigWatch();
		this.loadToken += 1;
		this.abortController?.abort();
		this.abortController = null;
		this.disarmSentinel();
		this.removeScrollReport();
		this.sentinelElement = null;
		this.seenKeys.clear();
	}
	/**
	 * Apply a subset of config on an already-live engine (ensure re-entry).
	 * Mode changes go through setMode (sentinel + paged collapse).
	 * @param {object} config - Partial engine config.
	 */
	applyConfig(config) {
		if (!config || this.disposed) {
			return;
		}
		if (config.loader != null) {
			this.config.loader = config.loader;
		}
		if (isFunction(config.keyFn)) {
			this.config.keyFn = config.keyFn;
		} else if (config.keyFn === null) {
			// Explicit null clears a custom keyFn back to the default.
			this.config.keyFn = autoKey;
		}
		if (config.dedupe != null) {
			this.config.dedupe = config.dedupe !== false;
		}
		if (config.auto != null) {
			this.config.auto = config.auto !== false;
		}
		if (config.startPage != null) {
			this.config.startPage = config.startPage;
		}
		if (config.prefetch != null) {
			this.config.prefetch = config.prefetch;
		}
		if (Number.isFinite(config.maxAutoFill)) {
			this.config.maxAutoFill = config.maxAutoFill;
		}
		if (config.filterArg !== undefined) {
			this.filterArg = config.filterArg;
		}
		if (isFunction(config.filter)) {
			this.config.filter = config.filter;
		}
		if (config.mode != null && config.mode !== this.config.mode) {
			this.setMode(config.mode);
		}
	}
	/** Tear down reactive config watchers (ensure factory / { from } bindings). */
	clearConfigWatch() {
		this.configWatchBundle?.unsubscribe?.();
		this.configWatchBundle = null;
		this.configWatchPaths = null;
		this.configFactory = null;
		this.configSource = null;
	}
}
/*
 * Reactive config resolution for ensure:
 *  1) Live state object — this.collection(key, this.state.itemsConfig)
 *     (proxy carries STATE_PATH; observe that path for nested writes)
 *  2) Factory fn — track(this.state reads) → observe those paths → re-apply
 *  3) Plain object with { from: 'stateKey', map? } fields
 *  4) Plain snapshot — one-shot (no watchers)
 */
const CONFIG_LIVE = 'live';
const CONFIG_FACTORY = 'factory';
const CONFIG_PLAIN = 'plain';
function isFromBinding(value) {
	return isPlainObject(value) && typeof value.from === 'string';
}
function liveStatePath(value) {
	const meta = value?.[STATE_PATH];
	if (!meta || typeof meta.path !== 'string' || meta.path === '') {
		return null;
	}
	return meta.path;
}
function flattenDepPaths(deps) {
	const paths = [];
	if (!deps) {
		return paths;
	}
	for (const pathSet of deps.values()) {
		for (const path of pathSet) {
			paths.push(path);
		}
	}
	return paths;
}
/**
 * Resolve a plain config, expanding `{ from, map }` reactive field descriptors.
 * @param {object} host - Component instance.
 * @param {object} config - Ensure config.
 * @returns {{ resolved: object, paths: string[] }} Snapshot + watched paths.
 */
function resolvePlainConfig(host, config) {
	const resolved = {};
	const paths = [];
	const keys = Object.keys(config);
	const keyCount = keys.length;
	for (let index = 0; index < keyCount; index += 1) {
		const field = keys[index];
		const value = config[field];
		if (isFromBinding(value)) {
			paths.push(value.from);
			const raw = getValueAtPath(host.state, value.from);
			resolved[field] = isFunction(value.map) ? value.map.call(host, raw) : raw;
		} else {
			resolved[field] = value;
		}
	}
	return {
		resolved,
		paths,
	};
}
/**
 * Resolve config from a factory under state tracking (same dep system as templates).
 * @param {object} host - Component instance.
 * @param {Function} configFactory - `function () { return { loader, mode, … }; }`
 * @returns {{ resolved: object, paths: string[] }} Snapshot + watched paths.
 */
function resolveFactoryConfig(host, configFactory) {
	const tracked = track(configFactory, host);
	if (!isPlainObject(tracked.value)) {
		throw new TypeError('this.collection(key, factory): factory must return a plain config object');
	}
	return {
		resolved: tracked.value,
		paths: flattenDepPaths(tracked.deps),
	};
}
/**
 * Snapshot a live state config object (proxy). Nested writes under its path
 * re-fire via a single observe on the root path (path-overlap bus).
 * @param {object} liveConfig - this.state.itemsConfig (state proxy subtree).
 * @param {string} configPath - STATE path e.g. 'itemsConfig'.
 * @returns {{ resolved: object, paths: string[] }}
 */
function resolveLiveConfig(liveConfig, configPath) {
	const resolved = {};
	const keys = Object.keys(liveConfig);
	const keyCount = keys.length;
	for (let index = 0; index < keyCount; index += 1) {
		const field = keys[index];
		resolved[field] = liveConfig[field];
	}
	return {
		resolved,
		paths: [configPath],
	};
}
function wireConfigWatch(host, handle, key, source, mode, livePath) {
	handle.clearConfigWatch();
	let resolve;
	if (mode === CONFIG_FACTORY) {
		resolve = () => {
			return resolveFactoryConfig(host, source);
		};
	} else if (mode === CONFIG_LIVE) {
		resolve = () => {
			// Re-read the live proxy from state so we always see latest keys/values
			const live = getValueAtPath(host.state, livePath);
			if (!isPlainObject(live)) {
				return {
					resolved: {},
					paths: [livePath],
				};
			}
			return resolveLiveConfig(live, livePath);
		};
	} else {
		resolve = () => {
			return resolvePlainConfig(host, source);
		};
	}
	const first = resolve();
	handle.applyConfig(first.resolved);
	const paths = first.paths;
	if (!paths.length || !isFunction(host.observeAsync)) {
		return first.resolved;
	}
	const onConfigDep = () => {
		if (handle.disposed) {
			return;
		}
		const next = resolve();
		handle.applyConfig(next.resolved);
		const nextPaths = next.paths;
		const prevPaths = handle.configWatchPaths;
		if (mode !== CONFIG_LIVE && !pathSetsEqual(prevPaths, nextPaths)) {
			wireConfigWatch(host, handle, key, source, mode, livePath);
		}
	};
	handle.configWatchPaths = paths.slice();
	handle.configFactory = mode === CONFIG_FACTORY ? source : null;
	handle.configSource = source;
	handle.configLivePath = livePath || null;
	handle.configWatchBundle = host.observeAsync(paths, onConfigDep);
	return first.resolved;
}
function pathSetsEqual(left, right) {
	if (!left || !right || left.length !== right.length) {
		return false;
	}
	const seen = new Set(left);
	const rightLength = right.length;
	for (let index = 0; index < rightLength; index += 1) {
		if (!seen.has(right[index])) {
			return false;
		}
	}
	return true;
}
/**
 * `this.collection(key, config | factory | this.state.itemsConfig)` — get-or-create
 * a headless CollectionEngine. Config is reactive when:
 *   - live state object (`this.state.itemsConfig` — preferred; one proxy bag),
 *   - factory fn that reads `this.state.*` (deps tracked),
 *   - plain object with `{ from: 'stateKey', map? }` field descriptors.
 * Re-entry updates the same instance. Do not mix with template collection on one key.
 * @param {string} key - State array key (also `${key}Status`).
 * @param {object|Function} configOrFactory - Live state bag, snapshot, or factory.
 * @returns {CollectionEngine} Live handle.
 */
export function ensureCollection(key, configOrFactory = {}) {
	const isFactory = isFunction(configOrFactory);
	if (!isFactory && !isPlainObject(configOrFactory)) {
		throw new TypeError('this.collection(key, config): config must be a plain object or a factory function');
	}
	const livePath = isFactory ? null : liveStatePath(configOrFactory);
	const configMode = livePath ? CONFIG_LIVE : CONFIG_PLAIN;
	const mode = isFactory ? CONFIG_FACTORY : configMode;
	let registry = this.collections;
	if (!registry) {
		registry = new Map();
		this.collections = registry;
	}
	let handle = registry.get(key);
	if (handle && !handle.disposed) {
		wireConfigWatch(this, handle, key, configOrFactory, mode, livePath);
		return handle;
	}
	let initial;
	if (mode === CONFIG_FACTORY) {
		initial = resolveFactoryConfig(this, configOrFactory);
	} else if (mode === CONFIG_LIVE) {
		initial = resolveLiveConfig(configOrFactory, livePath);
	} else {
		initial = resolvePlainConfig(this, configOrFactory);
	}
	handle = CollectionEngine.create(this, {
		...initial.resolved,
		key,
	});
	registry.set(key, handle);
	wireConfigWatch(this, handle, key, configOrFactory, mode, livePath);
	return handle;
}
/**
 * `this.collection(key)` — the live handle for a mounted collection: drives
 * `reset()` / `loadMore()` / `attach()` / `gotoPage()` / … and reads its
 * reactive `${key}Status`. Row find/search for the same key: `this.list(key)`.
 * @param {string} stateKey - The collection's state key (its first arg).
 * @returns {CollectionEngine|null} The engine, or null if none registered.
 */
export function collectionCtrl(stateKey) {
	return this.collections?.get(stateKey) ?? null;
}
/**
 * Dispose every collection engine on this component (in-flight fetches, the
 * IntersectionObserver, scroll-report). Called from `handleDisconnect`.
 */
export function disposeCollections() {
	const registry = this.collections;
	if (!registry) {
		return;
	}
	for (const handle of registry.values()) {
		handle.dispose();
	}
	// Drop the last ref — Map.clear() before null is wasted work.
	this.collections = null;
}
