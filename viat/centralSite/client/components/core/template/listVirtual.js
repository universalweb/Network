/*
 * Variable-height list window controller — leaf (no template.js / list.js import).
 *
 * estimatedHeight = seed for unmeasured keys only.
 * Per-key size cache { height, atWidth } invalidates when the list host width
 * changes. Mounted rows are measured after patch; ResizeObserver self-heals
 * drift. Layout is NEVER written through reactive assignState.
 *
 * Layout reads go through overridable methods so happy-dom tests can stub.
 */
import { findScrollableAncestor } from '../dom/scrollRoot.js';
const PASSIVE_SCROLL = {
	passive: true,
};
/**
 * Non-reactive layout stamp on a row element (component or light).
 * Survives only while the element lives; durable cache is sizeByKey.
 */
export const LIST_ROW_LAYOUT = Symbol.for('uwc.listRowLayout');
/**
 * @typedef {object} VirtualConfig
 * @property {boolean} enabled
 * @property {number} estimatedHeight - Seed for unmeasured rows (px).
 * @property {number} overscan
 * @property {Element|null} scrollRoot
 */
/**
 * @typedef {object} SizeEntry
 * @property {number} height
 * @property {number} atWidth - List host clientWidth when measured.
 */
export class ListVirtualController {
	spot = null;
	config = null;
	scrollRoot = null;
	windowStart = 0;
	windowEnd = 0;
	padTop = 0;
	padBottom = 0;
	rafId = 0;
	attached = false;
	/** @type {Map<*, SizeEntry>} durable sizes by item key */
	sizeByKey = new Map();
	/** Host width that current size entries were measured against. */
	containerWidth = 0;
	/** @type {ResizeObserver|null} */
	hostObserver = null;
	/** @type {ResizeObserver|null} */
	rowObserver = null;
	/** @type {Map<Element, *>} mounted element → item key */
	observedRows = new Map();
	/*
	 * Last pads actually written to the host's inline style. Most scroll frames
	 * land inside the SAME window and recompute identical pads — writing them
	 * again dirties the CSSOM (and invalidates layout) for no visual change.
	 */
	appliedPadTop = 0;
	appliedPadBottom = 0;
	/*
	 * Something that could move the scroll root happened (attach, host resize,
	 * window resize) — the next recompute re-walks. Scroll frames never set it,
	 * which is what keeps the walk off the hot path. See healScrollRoot.
	 */
	scrollRootDirty = true;
	/** Tier-3 rAF forwarder. */
	scrollFrameTick = null;
	constructor(spot, config) {
		this.spot = spot;
		this.config = config;
		this.scrollFrameTick = () => {
			this.onScrollFrame();
		};
	}
	static is(value) {
		return value instanceof ListVirtualController;
	}
	/** Viewport height of the scroll root (overridable in tests). */
	readViewportHeight() {
		const root = this.scrollRoot;
		if (!root) {
			return 0;
		}
		if (root === document.documentElement || root === document.scrollingElement) {
			return globalThis.innerHeight || root.clientHeight || 0;
		}
		return root.clientHeight || 0;
	}
	/** Scroll offset of the root (overridable in tests). */
	readScrollTop() {
		const root = this.scrollRoot;
		if (!root) {
			return 0;
		}
		if (root === document.documentElement || root === document.scrollingElement) {
			return globalThis.scrollY ?? root.scrollTop ?? 0;
		}
		return root.scrollTop || 0;
	}
	/**
	 * Content-Y of the list host's border-box top inside the scroll root.
	 * Do NOT subtract padTop: padding-block lives inside the border box, so
	 * getBoundingClientRect().top is stable across pad changes. Subtracting
	 * padTop fed back into local → padTop (startTarget climbed to totalHeight
	 * and the window collapsed to 0 rows on scroll).
	 */
	readListOffset() {
		const root = this.scrollRoot;
		const element = this.spot?.element;
		if (!root || !element) {
			return 0;
		}
		if (root === element) {
			return 0;
		}
		const rootRect = root.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();
		return (elementRect.top - rootRect.top) + this.readScrollTop();
	}
	/** List host content width (overridable in tests). */
	readContainerWidth() {
		return this.spot?.element?.clientWidth || 0;
	}
	/** Row outer height (overridable in tests). */
	readRowHeight(element) {
		return element?.offsetHeight || 0;
	}
	attach() {
		if (this.attached) {
			return;
		}
		this.attached = true;
		this.ensureScrollRoot();
		globalThis.addEventListener('resize', this, PASSIVE_SCROLL);
		this.ensureObservers();
		const host = this.spot?.element;
		if (host && this.hostObserver) {
			this.hostObserver.observe(host);
		}
		this.containerWidth = this.readContainerWidth();
	}
	detach() {
		if (!this.attached) {
			return;
		}
		this.unbindScrollRoot();
		globalThis.removeEventListener('resize', this, PASSIVE_SCROLL);
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
		this.teardownObservers();
		this.scrollRoot = null;
		this.attached = false;
		this.clearPadding();
	}
	/**
	 * Re-resolve the scroll root and rebind the scroll listener when it changes.
	 * First attach often runs while an overlay scroll-lock has set the real
	 * shell scroller to overflow:hidden — the walk then falls through to
	 * document and never hears shell scrolls. Re-checking on every recompute
	 * heals once the lock releases (overflow returns to auto/scroll).
	 */
	ensureScrollRoot() {
		this.scrollRootDirty = false;
		const next = this.resolveScrollRoot();
		if (next === this.scrollRoot) {
			return;
		}
		this.unbindScrollRoot();
		this.scrollRoot = next;
		if (this.attached && next) {
			next.addEventListener('scroll', this, PASSIVE_SCROLL);
		}
	}
	unbindScrollRoot() {
		const root = this.scrollRoot;
		if (root) {
			root.removeEventListener('scroll', this, PASSIVE_SCROLL);
		}
	}
	/**
	 * Per-recompute heal, gated. `ensureScrollRoot` costs a `getComputedStyle`
	 * (and, on the scroll-lock branch, a `scrollHeight`/`clientHeight` layout
	 * read) for EVERY ancestor up to the root — running it on each scroll frame
	 * was the controller's largest fixed per-frame cost.
	 *
	 * Two states still need the walk. (1) The bound root is the DOCUMENT
	 * FALLBACK — what a detached install or an overlay scroll-lock hiding the
	 * real scroller leaves behind (see ensureScrollRoot). (2) `scrollRootDirty`
	 * — something that can MOVE the root happened. Both re-entry paths that
	 * matter raise it via the host ResizeObserver, because both change the
	 * host's box: `ui-collection` flipping `tableMaxHeight` from null makes a
	 * NEARER ancestor scrollable, and the `htmlElementCache` retain path
	 * (template.js — a cached subtree keeps live spots while detached, so
	 * `unsubscribe`/`detach` may never fire) can re-insert the list under a
	 * different scroller with `attached` still true.
	 *
	 * A plain scroll frame raises neither, so the walk stays off the hot path.
	 */
	healScrollRoot() {
		const root = this.scrollRoot;
		if (
			!this.scrollRootDirty &&
			root &&
			root !== document.scrollingElement &&
			root !== document.documentElement
		) {
			return;
		}
		this.ensureScrollRoot();
	}
	ensureObservers() {
		if (typeof ResizeObserver !== 'function') {
			return;
		}
		/*
		 * ResizeObserver has no thisArg — one tier-3 forwarder per observer,
		 * created once in attach via ensureObservers (not per entry callback).
		 */
		if (!this.hostObserver) {
			this.hostResizeTick = (entries) => {
				this.onHostResizeEntries(entries);
			};
			this.hostObserver = new ResizeObserver(this.hostResizeTick);
		}
		if (!this.rowObserver) {
			this.rowResizeTick = (entries) => {
				this.onRowResizeEntries(entries);
			};
			this.rowObserver = new ResizeObserver(this.rowResizeTick);
		}
	}
	teardownObservers() {
		if (this.hostObserver) {
			this.hostObserver.disconnect();
			this.hostObserver = null;
		}
		if (this.rowObserver) {
			this.rowObserver.disconnect();
			this.rowObserver = null;
		}
		this.observedRows.clear();
	}
	resolveScrollRoot() {
		const configured = this.config.scrollRoot;
		if (configured) {
			return configured;
		}
		const element = this.spot?.element;
		if (!element?.isConnected) {
			// Detached install — prefer document until the host lands in the tree.
			return document.scrollingElement || document.documentElement;
		}
		const ancestor = findScrollableAncestor(element, {
			requireOverflow: false,
		});
		if (ancestor) {
			return ancestor;
		}
		return document.scrollingElement || document.documentElement;
	}
	handleEvent(domEvent) {
		const eventType = domEvent.type;
		if (eventType === 'scroll' || eventType === 'resize') {
			if (eventType === 'resize') {
				this.checkContainerWidth();
				this.scrollRootDirty = true;
			}
			this.scheduleRecompute();
		}
	}
	onHostResizeEntries() {
		this.checkContainerWidth();
		/* The host's box moved — a nearer ancestor may have become the scroller
		 * (tableMaxHeight), or the list was re-inserted elsewhere. Re-walk once. */
		this.scrollRootDirty = true;
		this.scheduleRecompute();
	}
	onRowResizeEntries(entries) {
		const width = this.containerWidth || this.readContainerWidth();
		let changed = false;
		const entryCount = entries.length;
		for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
			const entry = entries[entryIndex];
			const element = entry.target;
			const itemKey = this.observedRows.get(element);
			if (itemKey === undefined) {
				continue;
			}
			const height = this.readRowHeight(element);
			if (!(height > 0)) {
				continue;
			}
			if (this.recordSize(itemKey, element, height, width)) {
				changed = true;
			}
		}
		if (changed) {
			this.scheduleRecompute();
		}
	}
	/**
	 * If host width changed, drop all size entries (they were measured under
	 * another wrap width). Row elements keep LIST_ROW_LAYOUT only when width matches.
	 */
	checkContainerWidth() {
		const nextWidth = this.readContainerWidth();
		if (nextWidth === this.containerWidth) {
			return false;
		}
		this.containerWidth = nextWidth;
		this.sizeByKey.clear();
		return true;
	}
	scheduleRecompute() {
		if (this.rafId) {
			return;
		}
		this.rafId = requestAnimationFrame(this.scrollFrameTick);
	}
	onScrollFrame() {
		this.rafId = 0;
		const spot = this.spot;
		if (!spot?.element?.isConnected) {
			this.detach();
			return;
		}
		if (spot.virtualController === this && spot.requestVirtualRefresh) {
			spot.requestVirtualRefresh();
		}
	}
	/**
	 * Height for one view index — cached measure or estimated seed.
	 * @param {*} itemKey
	 * @returns {number}
	 */
	heightForKey(itemKey) {
		const entry = this.sizeByKey.get(itemKey);
		if (entry && entry.atWidth === this.containerWidth) {
			return entry.height;
		}
		return this.config.estimatedHeight;
	}
	/**
	 * Record a measured size. Returns true when the cache changed.
	 * @param {*} itemKey
	 * @param {Element|null} element
	 * @param {number} height
	 * @param {number} width
	 * @returns {boolean}
	 */
	recordSize(itemKey, element, height, width) {
		const previous = this.sizeByKey.get(itemKey);
		if (previous && previous.height === height && previous.atWidth === width) {
			if (element) {
				element[LIST_ROW_LAYOUT] = previous;
			}
			return false;
		}
		const entry = {
			height,
			atWidth: width,
		};
		this.sizeByKey.set(itemKey, entry);
		if (element) {
			element[LIST_ROW_LAYOUT] = entry;
		}
		return true;
	}
	/**
	 * Measure every mounted row in keyMap; sync row ResizeObservers.
	 * @param {Map} keyMap - key → element
	 */
	measureMounted(keyMap) {
		if (!keyMap) {
			return;
		}
		// Same width-invalidation mechanic as the RO/resize path — one owner.
		this.checkContainerWidth();
		const width = this.containerWidth;
		const stillObserved = new Set();
		let changed = false;
		keyMap.forEach((element, itemKey) => {
			stillObserved.add(element);
			const layout = element[LIST_ROW_LAYOUT];
			if (layout && layout.atWidth === width && layout.height > 0) {
				// Promote element stamp into durable map if missing.
				if (!this.sizeByKey.has(itemKey)) {
					this.sizeByKey.set(itemKey, layout);
				}
			} else {
				const height = this.readRowHeight(element);
				if (height > 0 && this.recordSize(itemKey, element, height, width)) {
					changed = true;
				}
			}
			this.observeRow(element, itemKey);
		});
		// Drop observers for rows that left the window.
		this.observedRows.forEach((itemKey, element) => {
			if (!stillObserved.has(element)) {
				this.unobserveRow(element);
			}
		});
		if (changed) {
			this.scheduleRecompute();
		}
	}
	observeRow(element, itemKey) {
		/* No RO (test env / old engine) — rows never enter observedRows at all,
		 * so there is nothing to keep in sync either. */
		if (!this.rowObserver) {
			return;
		}
		if (this.observedRows.has(element)) {
			// patchList reused this element for another key — remap, stay observed.
			this.observedRows.set(element, itemKey);
			return;
		}
		this.observedRows.set(element, itemKey);
		this.rowObserver.observe(element);
	}
	unobserveRow(element) {
		if (this.rowObserver && this.observedRows.has(element)) {
			this.rowObserver.unobserve(element);
		}
		this.observedRows.delete(element);
	}
	/**
	 * Drop size entries for keys no longer in the view (removes / filter).
	 * @param {Set} liveKeys
	 */
	pruneToKeys(liveKeys) {
		this.sizeByKey.forEach((entry, itemKey) => {
			if (!liveKeys.has(itemKey)) {
				this.sizeByKey.delete(itemKey);
			}
		});
	}
	/**
	 * Compute window + padding for a full view array (variable height).
	 * @param {Array} viewItems - Full filtered/source view.
	 * @param {(item:*, index:number)=>*} keyFn - Absolute-index keyFn.
	 * @returns {{start:number, end:number, items:Array}}
	 */
	recompute(viewItems, keyFn) {
		// Heal a document fallback chosen while scroll-lock hid the real scroller.
		this.healScrollRoot();
		const itemCount = viewItems.length;
		const overscan = this.config.overscan;
		const estimatedHeight = this.config.estimatedHeight;
		if (this.containerWidth === 0) {
			this.containerWidth = this.readContainerWidth();
		}
		if (itemCount === 0) {
			this.windowStart = 0;
			this.windowEnd = 0;
			this.padTop = 0;
			this.padBottom = 0;
			this.sizeByKey.clear();
			this.applyPadding();
			return {
				start: 0,
				end: 0,
				items: viewItems,
			};
		}
		// Heights + live key prune in one pass.
		const heights = new Array(itemCount);
		const liveKeys = new Set();
		for (let index = 0; index < itemCount; index++) {
			const itemKey = keyFn(viewItems[index], index);
			liveKeys.add(itemKey);
			heights[index] = this.heightForKey(itemKey);
		}
		this.pruneToKeys(liveKeys);
		const viewportHeight = this.readViewportHeight();
		const scrollTop = this.readScrollTop();
		const listOffset = this.readListOffset();
		const local = Math.max(0, scrollTop - listOffset);
		// windowStart: first index whose bottom edge is past (local - overscan*avg)
		const overscanPx = overscan * estimatedHeight;
		const startTarget = Math.max(0, local - overscanPx);
		let windowStart = 0;
		let padTop = 0;
		while (windowStart < itemCount && padTop + heights[windowStart] <= startTarget) {
			padTop += heights[windowStart];
			windowStart += 1;
		}
		// Scrolled past the list end (or startTarget ≥ totalHeight) — pin to tail.
		if (windowStart >= itemCount && itemCount > 0) {
			const want = Math.max(viewportHeight, estimatedHeight) + overscanPx;
			let back = 0;
			windowStart = itemCount;
			while (windowStart > 0 && back < want) {
				windowStart -= 1;
				back += heights[windowStart];
			}
			padTop = 0;
			for (let index = 0; index < windowStart; index++) {
				padTop += heights[index];
			}
		}
		// windowEnd: cover viewport + overscan below
		const endTarget = local + Math.max(viewportHeight, estimatedHeight) + overscanPx;
		let windowEnd = windowStart;
		let span = 0;
		while (windowEnd < itemCount && (windowEnd === windowStart || padTop + span < endTarget)) {
			span += heights[windowEnd];
			windowEnd += 1;
		}
		if (windowEnd === windowStart && windowEnd < itemCount) {
			windowEnd = windowStart + 1;
		}
		// Recompute padTop strictly as sum[0..start); padBottom as sum[end..N)
		padTop = 0;
		for (let index = 0; index < windowStart; index++) {
			padTop += heights[index];
		}
		let padBottom = 0;
		for (let index = windowEnd; index < itemCount; index++) {
			padBottom += heights[index];
		}
		/*
		 * No total-consistency clamp: padTop is sum[0..start), padBottom is
		 * sum[end..N) and 0 ≤ start ≤ end ≤ N, so the mounted span is
		 * sum[start..end) — non-negative by construction over non-negative
		 * heights. The old `mountedHeight < 0` branch was unreachable.
		 */
		this.windowStart = windowStart;
		this.windowEnd = windowEnd;
		this.padTop = padTop;
		this.padBottom = padBottom;
		this.applyPadding();
		return {
			start: windowStart,
			end: windowEnd,
			items: viewItems.slice(windowStart, windowEnd),
		};
	}
	/** Full-N dry-run: window = entire list, zero pads. */
	fullWindow(viewItems) {
		const itemCount = viewItems.length;
		this.windowStart = 0;
		this.windowEnd = itemCount;
		this.padTop = 0;
		this.padBottom = 0;
		this.applyPadding();
		return {
			start: 0,
			end: itemCount,
			items: viewItems,
		};
	}
	applyPadding() {
		if (this.padTop === this.appliedPadTop && this.padBottom === this.appliedPadBottom) {
			return;
		}
		const element = this.spot?.element;
		if (!element?.style) {
			return;
		}
		element.style.paddingBlockStart = this.padTop ? `${this.padTop}px` : '';
		element.style.paddingBlockEnd = this.padBottom ? `${this.padBottom}px` : '';
		this.appliedPadTop = this.padTop;
		this.appliedPadBottom = this.padBottom;
	}
	clearPadding() {
		const element = this.spot?.element;
		if (!element?.style) {
			return;
		}
		element.style.paddingBlockStart = '';
		element.style.paddingBlockEnd = '';
		this.appliedPadTop = 0;
		this.appliedPadBottom = 0;
	}
	/**
	 * Scroll so absolute index is near the top of the viewport.
	 * @param {number} absoluteIndex - Source index.
	 * @param {Array} [viewItems] - When provided with keyFn, uses measured heights.
	 * @param {Function} [keyFn]
	 */
	scrollToIndex(absoluteIndex, viewItems, keyFn) {
		const root = this.scrollRoot || this.resolveScrollRoot();
		if (!root) {
			return;
		}
		const listOffset = this.readListOffset();
		let offset = 0;
		if (viewItems && keyFn) {
			const limit = Math.min(Math.max(0, absoluteIndex), viewItems.length);
			for (let index = 0; index < limit; index++) {
				offset += this.heightForKey(keyFn(viewItems[index], index));
			}
		} else {
			offset = Math.max(0, absoluteIndex) * this.config.estimatedHeight;
		}
		const target = listOffset + offset;
		if (root === document.documentElement || root === document.scrollingElement) {
			globalThis.scrollTo(0, target);
		} else {
			root.scrollTop = target;
		}
	}
}
