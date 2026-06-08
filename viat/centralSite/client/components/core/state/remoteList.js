/*
 * `remoteList` controller — the load orchestration behind the `remoteList(key,
 * renderFn, config)` binding. Rendering/filtering/keying are 100% inherited from
 * ListBinding → ListSpot; this file owns ONLY the remote-load lifecycle:
 *
 *   - resolve the scroll container (config.scroller ref, else nearest scrollable
 *     ancestor) — it is both the near-bottom trigger surface AND the scroll-report
 *     target,
 *   - cursor-based paging (loader({reset, cursor, signal}) → {items, nextCursor,
 *     hasMore}); append on loadMore, replace on reset,
 *   - non-reactive loading / error / exhausted state, reflected imperatively to the
 *     optional spinner / load-more refs and emitted as `${key}:loading|loaded|error|
 *     exhausted` events,
 *   - dedupe-by-key on append, supersede-guard so a stale response can't clobber a
 *     newer one, AbortController per request,
 *   - optional `scroll-report` install on the scroller (reuses the registered
 *     behavior — never reimplemented).
 *
 * Items live in `component.state[key]` (the one reactive surface). The controller
 * persists across re-renders (held in `component.remoteControllers`, keyed by state
 * key); the template mount-hook does get-or-create. Disposed on disconnect.
 */
import { getBehavior } from '../behaviors/registry.js';
import { isFunction } from '../utilities.js';
const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/;
function stripHash(refName) {
	return refName && refName[0] === '#' ? refName.slice(1) : refName;
}
/*
 * Walk up (crossing shadow boundaries via the host) for the nearest element that
 * actually scrolls. Best-effort fallback only — an explicit `scroller` ref is
 * preferred and skips this entirely.
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
class RemoteListController {
	static create(component, stateKey, binding) {
		return new RemoteListController(component, stateKey, binding);
	}
	constructor(component, stateKey, binding) {
		this.component = component;
		this.stateKey = stateKey;
		this.config = binding.remoteConfig;
		this.keyFn = binding.keyFn;
		this.cursor = null;
		this.hasMore = true;
		this.loading = false;
		this.error = '';
		this.started = false;
		this.mounted = false;
		this.disposed = false;
		this.loadToken = 0;
		this.scroller = null;
		this.scrollTarget = null;
		this.paused = false;
		this.loadMoreElement = null;
		this.abortController = null;
		this.scrollReportUninstall = null;
		this.seenKeys = new Set();
	}
	get exhausted() {
		return this.started && !this.hasMore;
	}
	/*
	 * (Re)wire DOM-attached pieces — resolve the scroller, the near-bottom scroll
	 * listener, the load-more click, and the optional scroll-report. Re-render
	 * SAFE: a full re-render recreates the shadow (and thus the scroller / refs),
	 * so we always detach prior wiring first and re-resolve against the fresh DOM.
	 * Deferred to a microtask by the mount-hook because spots install BEFORE refs
	 * register and before the fragment is attached — by the microtask both hold.
	 * The first attach also kicks the auto-load; later ones only re-wire.
	 */
	attach(anchorElement) {
		if (this.disposed) {
			return;
		}
		this.detachDom();
		this.wireTriggers(anchorElement);
		if (this.mounted) {
			this.reflectRefs();
			return;
		}
		this.mounted = true;
		if (this.config.auto === false) {
			this.reflectRefs();
		} else {
			this.reset();
		}
	}
	/* Resolve the scroller and bind the configured triggers (near-bottom scroll,
	   load-more click, optional scroll-report). Split from `attach` so each stays
	   under the cognitive-complexity bar. */
	wireTriggers(anchorElement) {
		const config = this.config;
		const explicitScroller = config.scroller ? this.component.getRef(stripHash(config.scroller)) : null;
		const resolved = explicitScroller ?? findScrollableAncestor(anchorElement);
		if (resolved) {
			this.scroller = resolved;
			this.scrollTarget = resolved;
		} else {
			/*
			 * Documented "else viewport" fallback: under document/body scroll there
			 * is NO scrollable ancestor element — the page itself scrolls. Measure the
			 * scrollingElement (correct viewport scrollTop/clientHeight/scrollHeight)
			 * but listen on the window, where the viewport's scroll event fires (a
			 * scroll listener on documentElement never fires for the root scroller).
			 */
			const ownerDocument = globalThis.document;
			this.scroller = ownerDocument.scrollingElement ?? ownerDocument.documentElement;
			this.scrollTarget = globalThis;
		}
		const mode = config.mode ?? 'scroll';
		if ((mode === 'scroll' || mode === 'both') && this.scrollTarget) {
			this.scrollTarget.addEventListener('scroll', this, {
				passive: true,
			});
		}
		if (mode === 'button' || mode === 'both') {
			const moreRef = config.loadMore ? this.component.getRef(stripHash(config.loadMore)) : null;
			if (moreRef) {
				this.loadMoreElement = moreRef;
				moreRef.addEventListener('click', this);
			}
		}
		if (config.scrollReport && this.scroller) {
			const behavior = getBehavior('scroll-report');
			if (behavior) {
				this.scrollReportUninstall = behavior.install(this.scroller);
			}
		}
	}
	detachDom() {
		if (this.scrollTarget) {
			this.scrollTarget.removeEventListener('scroll', this);
		}
		if (this.loadMoreElement) {
			this.loadMoreElement.removeEventListener('click', this);
			this.loadMoreElement = null;
		}
		if (this.scrollReportUninstall) {
			this.scrollReportUninstall();
			this.scrollReportUninstall = null;
		}
		this.scroller = null;
		this.scrollTarget = null;
	}
	/* Stable-`this` listener for both the scroller `scroll` and the load-more
	   `click` — passed as the listener object so there is no per-instance bind. */
	handleEvent(domEvent) {
		if (domEvent.type === 'scroll') {
			this.onScroll();
			return;
		}
		if (domEvent.type === 'click') {
			this.loadMore();
		}
	}
	onScroll() {
		const scroller = this.scroller;
		if (!scroller || this.loading || this.exhausted || this.paused) {
			return;
		}
		const prefetch = readPrefetchPixels(this.config.prefetch);
		if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - prefetch) {
			this.loadMore();
		}
	}
	reset() {
		this.cursor = null;
		this.hasMore = true;
		this.error = '';
		this.seenKeys.clear();
		this.component.state[this.stateKey] = [];
		return this.load(true);
	}
	refresh() {
		return this.reset();
	}
	loadMore() {
		if (this.loading || this.exhausted || this.paused) {
			return Promise.resolve();
		}
		return this.load(false);
	}
	/*
	 * Jump to a specific page/cursor, REPLACING the current window — the paged
	 * (prev/next) complement to the cumulative loadMore. Unlike reset() (which is
	 * page 1), it loads the given cursor; seenKeys is cleared because a replace
	 * starts a fresh window.
	 */
	goto(targetCursor) {
		this.hasMore = true;
		this.error = '';
		this.seenKeys.clear();
		return this.load(true, targetCursor);
	}
	/*
	 * Prepend a single item to the top of the list — the real-time complement to
	 * cursor paging (a freshly observed item arriving while history loads below).
	 * Goes through the controller so the dedupe `seenKeys` stays authoritative: a
	 * prepended item a later page re-fetches won't double-render. Reassigns the
	 * array (not `.unshift`) to fire the same reactive setter `load()` uses.
	 */
	prepend(item) {
		if (this.config.dedupe !== false) {
			const itemKey = this.keyFn(item, 0);
			if (this.seenKeys.has(itemKey)) {
				return;
			}
			this.seenKeys.add(itemKey);
		}
		const current = Array.isArray(this.component.state[this.stateKey]) ? this.component.state[this.stateKey] : [];
		this.component.state[this.stateKey] = [item].concat(current);
	}
	/* Core load. `replace` clears+replaces the window (reset / goto), else appends
	   (loadMore). `cursorOverride` targets a specific page (goto) instead of page 1
	   (reset, cursor=null) or the running cursor (loadMore). The loader's `reset`
	   flag means page-1 semantics only — a replace WITHOUT an explicit cursor. */
	async load(replace, cursorOverride) {
		const config = this.config;
		if (!isFunction(config.loader)) {
			this.error = 'remoteList: no loader configured';
			this.reflectRefs();
			return;
		}
		if (this.loading) {
			return;
		}
		this.loading = true;
		this.started = true;
		this.error = '';
		this.reflectRefs();
		this.emit('loading');
		const token = this.loadToken + 1;
		this.loadToken = token;
		this.abortController?.abort();
		const abortController = new AbortController();
		this.abortController = abortController;
		const hasCursorOverride = cursorOverride !== undefined && cursorOverride !== null;
		let requestCursor = this.cursor;
		if (hasCursorOverride) {
			requestCursor = cursorOverride;
		} else if (replace) {
			requestCursor = null;
		}
		let result = null;
		let failure = null;
		try {
			result = await config.loader.call(this.component, {
				reset: replace && !hasCursorOverride,
				cursor: requestCursor,
				signal: abortController.signal,
			});
		} catch (loadError) {
			failure = loadError;
		}
		if (token !== this.loadToken) {
			return;
		}
		this.loading = false;
		if (failure || !result) {
			this.error = failure?.message || 'Could not load results';
			this.reflectRefs();
			this.emit('error');
			return;
		}
		const incoming = Array.isArray(result.items) ? result.items : [];
		const additions = config.dedupe === false ? incoming : this.dropDuplicates(incoming);
		const currentItems = Array.isArray(this.component.state[this.stateKey]) ? this.component.state[this.stateKey] : [];
		this.component.state[this.stateKey] = replace ? additions : currentItems.concat(additions);
		this.cursor = result.nextCursor ?? null;
		this.hasMore = Boolean(result.hasMore);
		this.reflectRefs();
		this.emit('loaded');
		if (this.exhausted) {
			this.emit('exhausted');
		}
	}
	dropDuplicates(incoming) {
		const kept = [];
		for (let index = 0; index < incoming.length; index += 1) {
			const item = incoming[index];
			const itemKey = this.keyFn(item, index);
			if (this.seenKeys.has(itemKey)) {
				continue;
			}
			this.seenKeys.add(itemKey);
			kept.push(item);
		}
		return kept;
	}
	reflectRefs() {
		const config = this.config;
		if (config.spinner) {
			const spinner = this.component.getRef(stripHash(config.spinner));
			this.applyRefState(spinner, {
				active: this.loading,
			}, !this.loading, undefined);
		}
		if (this.loadMoreElement) {
			const blocked = this.loading || this.exhausted;
			this.applyRefState(this.loadMoreElement, {
				loading: this.loading,
				disabled: blocked,
				exhausted: this.exhausted,
			}, this.exhausted, blocked);
		}
	}
	/* Reflect status to a ref both ways: `assignState` for a UWC component, and
	   plain `hidden`/`disabled` attributes for a bare element — so the spinner /
	   button can be either, with no hard dependency on a specific component. */
	applyRefState(element, stateBundle, hidden, disabled) {
		if (!element) {
			return;
		}
		if (isFunction(element.assignState)) {
			element.assignState(stateBundle);
		}
		if (hidden) {
			element.setAttribute('hidden', '');
		} else {
			element.removeAttribute('hidden');
		}
		if (disabled === true) {
			element.setAttribute('disabled', '');
		} else if (disabled === false) {
			element.removeAttribute('disabled');
		}
	}
	emit(suffix) {
		this.component.emit?.(`${this.stateKey}:${suffix}`, {
			key: this.stateKey,
			loading: this.loading,
			error: this.error,
			exhausted: this.exhausted,
		});
	}
	dispose() {
		this.disposed = true;
		this.loadToken += 1;
		this.abortController?.abort();
		this.abortController = null;
		this.detachDom();
		this.seenKeys.clear();
	}
}
/**
 * Get-or-create the controller for a RemoteListBinding and mount it once. Called
 * by the template mount-hook after the ListSpot renders. Idempotent across
 * re-renders: the controller persists in `component.remoteControllers`, so a later
 * mount returns the same instance (its scroll wiring lives on the stable scroller,
 * not the re-created rows).
 * @param {WebComponent} component - The owning component.
 * @param {Element} anchorElement - The list spot's container/anchor (scroller auto-detect start).
 * @param {RemoteListBinding} binding - The binding carrying `key` + `remoteConfig`.
 * @returns {RemoteListController} The mounted controller.
 */
export function mountRemoteController(component, anchorElement, binding) {
	const stateKey = binding.key;
	let registry = component.remoteControllers;
	if (!registry) {
		registry = new Map();
		component.remoteControllers = registry;
	}
	let controller = registry.get(stateKey);
	if (!controller) {
		controller = RemoteListController.create(component, stateKey, binding);
		registry.set(stateKey, controller);
	}
	/*
	 * Spots install BEFORE refs register and before the fragment attaches (see the
	 * render pipeline: PHASE-2 install, then registerRef). Defer wiring to a
	 * microtask — by then `getRef` resolves and the DOM is laid out. Re-runs on
	 * every full re-render, re-wiring the persisted controller to the fresh DOM.
	 */
	queueMicrotask(() => {
		controller.attach(anchorElement);
	});
	return controller;
}
/**
 * `this.remote(key)` — the controller handle for a mounted remoteList. Drives
 * `reset()` / `loadMore()` / `refresh()` and reads `loading` / `error` / `exhausted`.
 * @param {string} stateKey - The remoteList's state key (its first arg).
 * @returns {RemoteListController|null} The controller, or null if none.
 */
export function remote(stateKey) {
	return this.remoteControllers?.get(stateKey) ?? null;
}
/**
 * Dispose every remoteList controller on this component (scroll listeners,
 * in-flight fetches, scroll-report). Called from `handleDisconnect`.
 */
export function disposeRemoteLists() {
	const registry = this.remoteControllers;
	if (!registry) {
		return;
	}
	for (const controller of registry.values()) {
		controller.dispose();
	}
	registry.clear();
	this.remoteControllers = null;
}
