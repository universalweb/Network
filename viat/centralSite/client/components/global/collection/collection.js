import '../filter-bar/filter-bar.js';
import {
	captureRects,
	classList,
	DragReorder,
	indexFromSlotMids,
	isArray,
	isFunction,
	isNumber,
	isPlainObject,
	isTrue,
	noValue,
	playFlip,
	WebComponent,
} from '../../core/index.js';
import { UICollectionItem } from '../collection-item/collection-item.js';
/*
 * `<ui-collection>` — the reusable collection component: a headless
 * CollectionEngine (cursor paging, dedupe, sentinel auto-load) wrapped in a
 * list shell with TWO switchable paging styles:
 *   - loadmore: cumulative (sentinel auto-load + LOAD MORE button), rows accumulate;
 *   - paged:    prev/next, one page at a time (replace) via the collection handle.
 *
 * Loading (preferred API):
 *   this.collection('items', this.itemsConfig)  // instance config bag
 *   this.collection('items')?.attach / loadMore / …
 * Paint:
 *   ${this.filter('items', renderRow, keepItem, listOpts)}  // virtual by default
 *
 * Host merges flat listConfig fields (loader, keyFn, pagingStyle, filter, …)
 * via `.state=`; onConnect mirrors them into `this.itemsConfig` so the engine
 * applyConfig runs on writes. A reactive `filterArg` drives client-side
 * filtering (engine setFilterArg → retouch → re-filter, no reload); `showBar`
 * suppresses the meta/controls bar for a bare embedded list.
 *
 * Built-in filter chrome: a non-empty `filters` array (ui-filter-bar
 * descriptors) mounts <ui-filter-bar> into `.collection-filters` and writes
 * `filterArg` from `filter-bar:change`. `filters: []` (the default) mounts
 * nothing — every existing collection is unchanged. Flat fields, not a nested
 * `filterBar` bag: collection already merges flat listConfig, and a nested
 * bag dies on replaceState (the same reason `itemsConfig` lives off state).
 * Forwarded: `filters`, `collapsible` (default false). Not forwarded: `size`
 * (collection chrome has its own scale; the bar keeps its md default) and
 * `value` (`filterArg` is the criteria bag).
 * Precedence: `filterArg` is the engine's source of truth and stays
 * externally settable. The built-in bar writes it. An external write always
 * reaches the engine. Last write wins. The bar chrome is not a controlled
 * mirror of `filterArg`.
 * `<slot name="controls">` is extra chrome (explorer slots custom filters
 * there). Custom filter UI: leave `filters` empty and slot your own.
 * The keep-predicate `filter` stays with the caller — collection owns the
 * chrome and the criteria plumbing, not the match policy.
 *
 * Selectable rows: when `renderRow` is omitted, rows paint as
 * `<ui-collection-item>` (label + optional description). Set `selectable`
 * to show a checkbox per row (`checkboxPosition`: 'start' | 'end'). Selected
 * rows highlight; emits `collection:select` with `{ id, item, checked }`.
 *
 * Virtualization is ON by default (`virtual: true` + `estimatedHeight` seed).
 * List options are install-frozen — toggle via a full remount, not a mid-life
 * write. Opt out with `virtual: false`. Bound the table with `tableMaxHeight`
 * (e.g. '16rem') so the list scrolls inside the collection rather than the page.
 *
 * Listbox (opt-in `listbox: true`): `.collection-rows` declares `role="listbox"` and
 * owns `aria-activedescendant` pointing at the active row CE. Default OFF.
 * The relationship must live inside the collection shadow — the HOST cannot
 * point into a tree it hosts (not an ancestor scope). `listboxLabel` /
 * `activeId` are the label and option id. ui-command is the one consumer.
 *
 * Reorder (opt-in `reorder: true`): pointer-drag via core/dom/dragReorder.
 * Mutates the SOURCE `items` array. `resolveIndex` returns an ABSOLUTE source
 * index (windowStart is added; never a window-relative index). Writes go
 * through `this.state` + `stateBus.notify('items')` — splice never traps.
 * Default rows (`ui-collection-item`) emit `collection-item:drag`; a custom
 * `renderRow` must emit the same intent to participate.
 * LIMITATION: edge auto-scroll is out of scope this pass. A pointer drag can
 * only target rows in the currently mounted virtual window; items outside
 * that window are not reachable until scrolled into view. `moveItem()` still
 * accepts any source index (tests / programmatic callers).
 * ── EVENTS ───────────────────────────────────────────────────────────
 *   collection:input  { items, from, to }  live during drag
 *   collection:change { items, from, to }  commit (drop / programmatic)
 */
/*
 * Host → collection control channel. The host EMITS one of these on itself and
 * the mounted <ui-collection> — which listens on its parent host — reacts. This
 * replaces `this.refs.list?.refresh()`: the host no longer needs a ref, no
 * longer needs to know the collection's method names, and a host whose
 * collection has not rendered yet simply has no listener rather than silently
 * hitting an undefined ref.
 */
export const COLLECTION_EVENT = Object.freeze({
	GO_TO_PAGE: 'collection:goToPage',
	REFRESH: 'collection:refresh',
});
const PAGED = 'paged';
const LOADMORE = 'loadmore';
const BUTTON = 'button';
const EMPTY_ITEMS = Object.freeze([]);
const IDLE_STATUS = Object.freeze({
	loading: false,
	error: '',
	hasMore: true,
	exhausted: false,
	page: 1,
	hasPrev: false,
	totalCount: 0,
	started: false,
});
/* pagingStyle → engine mode. 'button' = manual LOAD MORE only (no sentinel
   auto-load); 'paged' = prev/next replace; anything else = 'both' (scroll +
   button). */
function resolveMode(pagingStyle) {
	if (pagingStyle === PAGED) {
		return PAGED;
	}
	if (pagingStyle === BUTTON) {
		return BUTTON;
	}
	return 'both';
}
/**
 * True when a descendant row's host id matches the listbox activeId.
 * @param {Element} row - Candidate component.
 * @param {string} activeId - Option id to match.
 * @returns {boolean} Strict true on a hit (findComponent requires === true).
 */
function optionHasId(row, activeId) {
	return Boolean(row) && row.id === activeId;
}
/**
 * Page number for the item at `index` in a cumulative (loadmore) window.
 * Supports a window that started mid-list via goto (base page ≠ 1).
 * @param {number} index - Absolute index in the accumulated items array.
 * @param {number} pageSize - Loader page size (items per page).
 * @param {number} loadedPage - Engine status.page (highest/last loaded page).
 * @param {number} itemCount - Accumulated item count.
 * @returns {number} 1-based page for URL / chrome.
 */
export function visiblePageFor(index, pageSize, loadedPage, itemCount) {
	if (!(pageSize > 0)) {
		return loadedPage >= 1 ? loadedPage : 1;
	}
	const count = itemCount > 0 ? itemCount : 0;
	const pagesLoaded = Math.max(1, Math.ceil(count / pageSize) || 1);
	const basePage = Math.max(1, (loadedPage >= 1 ? loadedPage : 1) - pagesLoaded + 1);
	const safeIndex = index > 0 ? index : 0;
	return basePage + Math.floor(safeIndex / pageSize);
}
export class UICollection extends WebComponent {
	static url = import.meta.url;
	static styles = {
		collection: './collection.css',
	};
	static state = {
		items: [],
		// Host listConfig flat fields (mirrored into this.itemsConfig)
		loader: null,
		renderRow: null,
		keyFn: null,
		renderHead: null,
		pageHref: null,
		startPage: 1,
		itemNoun: 'items',
		emptyMessage: 'Nothing here yet.',
		loadingMessage: 'Loading…',
		pagingStyle: LOADMORE,
		// Client-side filtering: `filter` is a pure keep-predicate (item, arg) =>
		// boolean handed to the engine; `filterArg` is its reactive second arg
		// (a tab / query). A filterArg write retouches the row array through
		// setFilterArg — instant re-filter over the accumulated window, no reload.
		filter: null,
		filterArg: null,
		/*
		 * Built-in ui-filter-bar chrome. Empty `filters` mounts nothing.
		 * `collapsible` forwards to that bar; see module header for precedence
		 * vs an external `filterArg` write.
		 */
		filters: [],
		collapsible: false,
		/*
		 * ── CHROME ───────────────────────────────────────────────────────
		 * `showBar` is the master switch for the meta/controls bar. The rest are
		 * TRISTATE: true forces on, false forces off, and null (the default)
		 * AUTO-DERIVES from whether a `loader` exists.
		 *
		 * A collection with no loader is already fully materialised, so paging,
		 * refresh and load-more have nothing to act on — showing them is offering
		 * the user a button that cannot do anything. Deriving beats a `local: true`
		 * preset because it needs no caller bookkeeping and cannot fall out of sync
		 * with reality: the moment a loader is set, the controls come back.
		 */
		showBar: true,
		showCount: null,
		showPagingToggle: null,
		showRefresh: null,
		showPager: null,
		showLoadMore: null,
		/* Mask the scroll box edges (core util-scroll-fade): true | 'start' | 'end'. */
		scrollFade: false,
		// Default row (<ui-collection-item>) when renderRow is null/undefined.
		// selectable: show a checkbox; checkboxPosition: 'start' | 'end'.
		selectable: false,
		checkboxPosition: 'start',
		// Virtual list window (list()/filter 4th-arg options). Default ON —
		// estimatedHeight is the seed for unmeasured rows; measure + ResizeObserver
		// self-heal. tableMaxHeight bounds .collection-table so scroll lives inside the
		// collection (null = grow with content; page/ancestor is the scroll root).
		virtual: true,
		estimatedHeight: 40,
		overscan: 4,
		tableMaxHeight: null,
		/*
		 * How the rows are ARRANGED: 'list' (default, a single column) | 'grid'
		 * (responsive equal-height tracks) | 'masonry' (CSS columns, natural
		 * heights). Sizing comes from --collection-column and --collection-gap, so
		 * a caller tunes the shape without a second stylesheet.
		 *
		 * This component owns FEATURES — filtering, paging, load-more, virtual
		 * scroll, selection, reorder. It should not also dictate structure, which
		 * is why the layout is a choice and why .collection-table paints nothing.
		 */
		layout: 'list',
		// Opt-in pointer-drag reorder of the SOURCE items array (see header).
		reorder: false,
		/*
		 * Opt-in listbox semantics. Default OFF — existing consumers
		 * (explorer, accounts, schedule-board, reorder) are untouched.
		 * When true, `.collection-rows` (same shadow as the row CEs) is the listbox
		 * and owns aria-activedescendant. The HOST must not: hosting a
		 * shadow is not an ancestor scope, so host→row reflection is inert.
		 */
		listbox: false,
		listboxLabel: '',
		activeId: '',
		// Loader page size (items per page). When > 0 and pageHref is set in
		// loadmore mode, the URL tracks the *visible* page from the virtual
		// window (scroll up lowers /page/N/, not only the highest loaded page).
		pageSize: 0,
		// 0-or-1 slot so host renderHead html`` mounts via list() (content
		// spots stringify LightTemplate — only list/htmlElement accept it).
		_head: [],
	};
	/* Last page written to the URL — skip redundant history.replaceState. */
	urlPage = 0;
	slotMids = null;
	slotWindowStart = 0;
	firstRects = null;
	/*
	 * Engine config lives OFF state. `this.state = {…}` is replaceState
	 * (`{ ...incoming }`, no static-default re-merge) and would wipe a nested
	 * bag — then onConnect throwing on `.itemsConfig.loader =` is the defect.
	 * Same shape as command/explorer/accounts-list `listConfig`.
	 */
	itemsConfig = {
		loader: null,
		keyFn: null,
		mode: 'both',
		startPage: 1,
		dedupe: true,
	};
	onInit() {
		/**
		 * Do not declare `drag = null` as a class field — fields initialize
		 * AFTER super()/onInit and would wipe this controller.
		 * @engram em:network/code/class-fields-initialize-after-oninit-and-wipe-ctor-setup
		 */
		this.drag = new DragReorder({
			owner: this,
			host: this,
			resolveIndex: 'resolveDragIndex',
			onMove: 'moveItem',
			onCommit: 'commitDrag',
			onEnd: 'handleDragEnd',
			locked: 'dragIsLocked',
		});
		this.flipTick = () => {
			this.applyRowFlip();
		};
	}
	onConnect() {
		if (!isArray(this.state.items)) {
			this.state.items = [];
		}
		this.syncItemsConfig();
		this.syncHeadSlot();
		this.syncSelectableChrome();
		this.observe(['selectable', 'checkboxPosition'], this.syncSelectableChrome);
		this.syncReorderChrome();
		this.observe('reorder', this.syncReorderChrome);
		// Seed so a deep-linked startPage is not briefly replaced with /page/1/
		// before the first load settles (visible index 0 on an empty list).
		const startPage = Number(this.state.startPage);
		if (Number.isFinite(startPage) && startPage > 1) {
			this.urlPage = startPage;
		}
		this.observe([
			'loader',
			'keyFn',
			'startPage',
			'pagingStyle',
			'filter',
		], this.syncItemsConfig);
		this.observe('renderHead', this.syncHeadSlot);
		this.observe('filterArg', this.syncFilterArg);
		this.syncFilterArg();
		this.on('items:loaded', this.handleListLoaded);
		this.observe([
			'listbox',
			'listboxLabel',
			'activeId',
		], this.syncListboxActive);
		/*
		 * Listen on the HOST, not on ourselves — the host emits control events on
		 * itself and has no reason to know we exist. addEvent tracks the entry, so
		 * it is released with this component on disconnect.
		 */
		const host = this.parentComponent;
		if (host) {
			this.addEvent(COLLECTION_EVENT.REFRESH, this.handleRefreshRequest, host);
			this.addEvent(COLLECTION_EVENT.GO_TO_PAGE, this.handleGoToPageRequest, host);
		}
	}
	onDisconnect() {
		this.drag?.end();
	}
	handleRefreshRequest() {
		this.refresh();
	}
	handleGoToPageRequest(domEvent) {
		this.goToPage(domEvent.detail?.data);
	}
	/**
	 * Keep the instance config bag in sync with flat host listConfig / chrome
	 * fields, then re-ensure so applyConfig runs (the bag is not a state proxy).
	 */
	syncItemsConfig() {
		const cfg = this.itemsConfig;
		const prevLoader = cfg.loader;
		cfg.loader = this.state.loader;
		cfg.keyFn = this.state.keyFn || null;
		cfg.startPage = this.state.startPage;
		cfg.mode = resolveMode(this.state.pagingStyle);
		cfg.dedupe = true;
		cfg.filter = this.state.filter;
		this.collection('items', cfg);
		if (prevLoader != null && prevLoader !== cfg.loader && isFunction(cfg.loader)) {
			this.collection('items')?.reset();
		}
	}
	/**
	 * Engine status lives on state when the handle has seeded it. replaceState
	 * is a shallow `{ ...incoming }` with no default re-merge, so render and
	 * computed spots must not dereference the nested bag raw.
	 * @returns {object} Live status bag, or idle defaults.
	 */
	statusChrome() {
		const live = this.state.itemsStatus;
		if (isPlainObject(live)) {
			return live;
		}
		return IDLE_STATUS;
	}
	itemList() {
		const items = this.state.items;
		return isArray(items) ? items : EMPTY_ITEMS;
	}
	statusError() {
		return this.statusChrome().error;
	}
	statusPage() {
		return this.statusChrome().page;
	}
	/* Push the reactive filterArg into the engine — setFilterArg retouches the
	   row array so the filter() spot re-runs over the accumulated window. */
	syncFilterArg() {
		this.collection('items')?.setFilterArg(this.state.filterArg);
	}
	onRendered() {
		this.collection('items')?.attach({
			sentinel: this.refs.pl_sentinel,
		});
		this.wireVirtualUrlSync();
		this.syncListboxActive();
	}
	handleListLoaded() {
		this.syncUrl();
		this.syncListboxActive();
	}
	/**
	 * Point an ARIA relationship at an ELEMENT rather than an id string.
	 * @param {Element} host - Element carrying the relationship.
	 * @param {string} property - Reflection property.
	 * @param {Element|Element[]|null} target - What it should point at.
	 * @returns {boolean} True when the property existed and was assigned.
	 */
	linkAriaElement(host, property, target) {
		if (!host || !(property in host)) {
			return false;
		}
		host[property] = target;
		return true;
	}
	/**
	 * Resolve activedescendant against a row in THIS shadow. Host→row is
	 * inert (hosting a tree is not ancestor scope); `.collection-rows` and the
	 * option CEs share one tree, so the reflection is real.
	 */
	syncListboxActive() {
		const rows = this.refs.pl_rows;
		if (!rows) {
			return;
		}
		if (!isTrue(this.state.listbox)) {
			rows.removeAttribute('role');
			rows.removeAttribute('aria-label');
			rows.removeAttribute('aria-activedescendant');
			this.linkAriaElement(rows, 'ariaActiveDescendantElement', null);
			return;
		}
		rows.setAttribute('role', 'listbox');
		const label = this.state.listboxLabel;
		if (label) {
			rows.setAttribute('aria-label', label);
		} else {
			rows.removeAttribute('aria-label');
		}
		const activeId = this.state.activeId;
		let option = null;
		if (activeId) {
			rows.setAttribute('aria-activedescendant', activeId);
			option = this.findComponent((row) => {
				return optionHasId(row, activeId);
			});
		} else {
			rows.removeAttribute('aria-activedescendant');
		}
		this.linkAriaElement(rows, 'ariaActiveDescendantElement', option || null);
	}
	/**
	 * Hook ListSpot virtual window changes so pageHref tracks scroll position
	 * (not only the highest loaded page after each load).
	 */
	wireVirtualUrlSync() {
		const spot = this.list('items')?.spot;
		if (!spot) {
			return;
		}
		spot.onVirtualWindow = this.handleVirtualWindow;
	}
	handleVirtualWindow(windowStart) {
		this.syncUrl(windowStart);
		this.syncListboxActive();
	}
	/**
	 * Replace the URL via pageHref. In loadmore + pageSize mode, `windowStart`
	 * is the first virtual-window index (scroll position). Paged mode always
	 * uses the engine page.
	 * @param {number} [windowStart] - Virtual window start index when known.
	 */
	syncUrl(windowStart) {
		const hrefFn = this.state.pageHref;
		if (!isFunction(hrefFn)) {
			return;
		}
		if (isFunction(this.checkVisibility) && !this.checkVisibility()) {
			return;
		}
		// Leave the deep-linked URL alone until a page of items is in hand —
		// an empty list + windowStart 0 would otherwise rewrite /page/5/ → /.
		if (!this.itemList().length) {
			return;
		}
		const page = this.resolveUrlPage(windowStart);
		if (page === this.urlPage) {
			return;
		}
		this.urlPage = page;
		const url = hrefFn(page);
		if (url) {
			globalThis.history.replaceState(globalThis.history.state, '', url);
		}
	}
	resolveUrlPage(windowStart) {
		const status = this.statusChrome();
		if (this.state.pagingStyle === PAGED) {
			return status.page >= 1 ? status.page : 1;
		}
		const pageSize = Number(this.state.pageSize);
		if (!(pageSize > 0)) {
			return status.page >= 1 ? status.page : 1;
		}
		let index = windowStart;
		if (!Number.isFinite(index)) {
			index = this.list('items')?.spot?.virtualController?.windowStart ?? 0;
		}
		return visiblePageFor(index, pageSize, status.page, this.itemList().length);
	}
	refresh() {
		this.collection('items')?.reset();
	}
	goToPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (target === this.statusChrome().page && this.itemList().length) {
			return;
		}
		this.collection('items')?.gotoPage(target);
	}
	toggleStyle() {
		this.state.pagingStyle = this.state.pagingStyle === LOADMORE ? PAGED : LOADMORE;
		this.syncItemsConfig();
	}
	handleLoadMore() {
		this.collection('items')?.loadMore();
	}
	handlePrev() {
		this.collection('items')?.goPrev();
	}
	handleNext() {
		this.collection('items')?.goNext();
	}
	/**
	 * No loader means the caller handed us the whole array — nothing to page,
	 * refresh or load more of.
	 * @returns {boolean} True for a fully-materialised local list.
	 */
	isLocal() {
		return !isFunction(this.state.loader);
	}
	/**
	 * Resolve one tristate chrome flag. Explicit true/false wins; null derives.
	 * @param {string} key - State key holding the tristate.
	 * @param {boolean} auto - Value to use for a local list when unset.
	 * @returns {boolean} Whether to show that piece of chrome.
	 */
	chromeVisible(key, auto) {
		const explicit = this.state[key];
		if (explicit === true || explicit === false) {
			return explicit;
		}
		return this.isLocal() ? auto : true;
	}
	countHidden() {
		return !this.chromeVisible('showCount', true);
	}
	pagingToggleHidden() {
		return !this.chromeVisible('showPagingToggle', false);
	}
	refreshHidden() {
		return !this.chromeVisible('showRefresh', false);
	}
	pagerHidden() {
		if (!this.chromeVisible('showPager', false)) {
			return true;
		}
		return this.state.pagingStyle !== PAGED;
	}
	loadMoreBarHidden() {
		if (!this.chromeVisible('showLoadMore', false)) {
			return true;
		}
		return this.state.pagingStyle === PAGED;
	}
	/**
	 * How many items survive the engine's keep-predicate. This is the ONE place
	 * that walk lives — `hasVisibleItems` reads it too, so the empty gate and the
	 * count can never disagree.
	 * @returns {number} Visible row count.
	 */
	visibleCount() {
		const items = this.itemList();
		const count = items.length;
		const keep = this.collection('items')?.keepItem;
		if (!keep) {
			return count;
		}
		let visible = 0;
		for (let index = 0; index < count; index += 1) {
			if (keep(items[index])) {
				visible += 1;
			}
		}
		return visible;
	}
	/**
	 * The one count readout. A LOCAL list knows its own totals, so it reports
	 * "N noun" and narrows to "M of N noun" under an active filter — the host has
	 * no reason to render a second copy of this beside the component that owns it.
	 * A REMOTE list still reports loaded-vs-server-total, which is the only thing
	 * it can honestly say.
	 * @returns {string} Human count.
	 */
	countLabel() {
		const noun = this.state.itemNoun;
		const total = this.itemList().length;
		if (this.isLocal()) {
			const visible = this.visibleCount();
			if (visible === total) {
				return `${total.toLocaleString('en-US')} ${noun}`;
			}
			return `${visible.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} ${noun}`;
		}
		if (this.state.pagingStyle === PAGED) {
			return `page ${this.statusChrome().page} · ${noun}`;
		}
		const serverTotal = Number(this.statusChrome().totalCount || 0);
		if (serverTotal > 0) {
			return `${total.toLocaleString('en-US')} of ${serverTotal.toLocaleString('en-US')} ${noun}`;
		}
		return `${total.toLocaleString('en-US')} ${noun}`;
	}
	styleToggleLabel() {
		return this.state.pagingStyle === PAGED ? '≡ Load more' : '⊞ Paged';
	}
	syncHeadSlot() {
		this.state._head = isFunction(this.state.renderHead) ? [0] : [];
	}
	/* list() row for the optional head — host may return html`` / Element / string. */
	paintHead() {
		const headFn = this.state.renderHead;
		return isFunction(headFn) ? headFn() : '';
	}
	headKey() {
		return 'head';
	}
	/*
	 * 4th arg for filter() — keyFn and (by default) virtual window options.
	 * Install-frozen: first paint wins for virtual/keyFn (ListSpot freezes options).
	 * Virtual list requires a sole-content wrapper host: `.collection-rows>${filter}</div>`
	 * with NO whitespace (parser elides only when open-tag and close-tag abut the expr).
	 */
	/**
	 * The arrangement, normalised. An unknown value falls back to 'list' rather
	 * than reaching the stylesheet as a data attribute nothing styles.
	 * @returns {string} 'list' | 'grid' | 'masonry'.
	 */
	layoutMode() {
		const layout = this.state.layout;
		return layout === 'grid' || layout === 'masonry' ? layout : 'list';
	}
	/**
	 * Virtualisation is a SINGLE-COLUMN feature and this is where that is
	 * enforced. The windowing maths sums per-item heights into a padTop that
	 * offsets the rows box, which is only the scroll distance when exactly one
	 * item occupies each vertical slot. Under a grid it would over-count by the
	 * column count; under masonry, items in the same visual band have different
	 * heights and no single sum describes them.
	 *
	 * So a multi-column layout renders every row. That is a real limit, stated
	 * here rather than left as a subtly wrong scroll position.
	 * @returns {boolean} True when the virtual window can be used.
	 */
	canVirtualize() {
		return this.state.virtual !== false && this.layoutMode() === 'list';
	}
	rowListOptions() {
		const keyFn = this.state.keyFn;
		if (!this.canVirtualize()) {
			return keyFn || undefined;
		}
		const estimatedHeight = this.state.estimatedHeight;
		const height = isNumber(estimatedHeight) && estimatedHeight > 0 ? estimatedHeight : 40;
		const overscan = this.state.overscan;
		return {
			keyFn: keyFn || undefined,
			virtual: {
				estimatedHeight: height,
				overscan: isNumber(overscan) && overscan >= 0 ? overscan : 4,
			},
		};
	}
	/**
	 * Scroll box classes. `scrollFade` reuses the core `util-scroll-fade` module
	 * (already adopted into every shadow root) rather than re-declaring the mask —
	 * true fades both edges, 'start' / 'end' / 'x' pick a single direction.
	 * @returns {string} Class string for .collection-table.
	 */
	tableClass() {
		const fade = this.state.scrollFade;
		return classList('collection-table', {
			'scroll-fade': fade === true,
			'scroll-fade-start': fade === 'start',
			'scroll-fade-end': fade === 'end',
			'scroll-fade-x': fade === 'x',
		});
	}
	/* Inline max-height on .collection-table when the host bounds the scroll box. */
	tableScrollStyle() {
		const maxHeight = this.state.tableMaxHeight;
		if (noValue(maxHeight) || maxHeight === false || maxHeight === '') {
			return '';
		}
		const value = isNumber(maxHeight) ? `${maxHeight}px` : String(maxHeight);
		return `max-block-size:${value};overflow-y:auto`;
	}
	metaStatus() {
		if (this.statusChrome().loading) {
			return 'syncing…';
		}
		if (this.statusChrome().error) {
			return `error: ${this.statusChrome().error}`;
		}
		return '';
	}
	statusText() {
		if (this.statusChrome().loading) {
			return this.state.loadingMessage;
		}
		if (this.statusChrome().error) {
			return this.statusChrome().error;
		}
		return this.state.emptyMessage;
	}
	/* Any row currently visible? Unfiltered → any items; filtered → any item the
	   engine keep-predicate admits, so a filtered-to-empty view still surfaces the
	   empty message. Reads state.items (retouched on load AND on filterArg change),
	   so the empty gate stays reactive to both. */
	hasVisibleItems() {
		return this.visibleCount() > 0;
	}
	/* Foot visibility (button / loadmore modes) — bound to `?hidden`, so each
	   returns the HIDDEN condition (a bare method ref, engine-evaluated; a
	   negated `!this.showX` would negate the function, not its result). Mutually
	   exclusive: the LOAD MORE button while a next page exists and idle; the
	   end-of-list loading indicator while a load-more is in flight; the short
	   end-of-results marker once exhausted. */
	loadMoreHidden() {
		const status = this.statusChrome();
		return !(status.started && status.hasMore && !status.loading);
	}
	loadingMoreHidden() {
		return !(this.statusChrome().loading && this.itemList().length > 0);
	}
	endHidden() {
		const status = this.statusChrome();
		return !(status.started && !status.hasMore && this.itemList().length > 0);
	}
	prevDisabled() {
		return this.statusChrome().loading || !this.statusChrome().hasPrev;
	}
	nextDisabled() {
		return this.statusChrome().loading || !this.statusChrome().hasMore;
	}
	/**
	 * Row renderer for filter() — host `renderRow` wins; otherwise the default
	 * <ui-collection-item> component (supports selectable checkboxes).
	 * @returns {Function|typeof WebComponent} Light-row function or row component class.
	 */
	resolveRow() {
		const row = this.state.renderRow;
		if (row) {
			return row;
		}
		return UICollectionItem;
	}
	/* Mirror selectable + checkbox side onto the host for CSS inheritance into
	   row shadows (order tokens) and optional host styling. */
	syncSelectableChrome() {
		const selectable = Boolean(this.state.selectable);
		this.toggleAttribute('data-selectable', selectable);
		const position = this.state.checkboxPosition === 'end' ? 'end' : 'start';
		this.dataset.checkboxPos = position;
	}
	syncReorderChrome() {
		this.toggleAttribute('data-reorder', isTrue(this.state.reorder));
	}
	dragIsLocked() {
		return !isTrue(this.state.reorder);
	}
	indexOfId(id) {
		const items = this.state.items;
		if (!isArray(items)) {
			return -1;
		}
		const needle = String(id);
		const count = items.length;
		for (let index = 0; index < count; index += 1) {
			const item = items[index];
			if (!item) {
				continue;
			}
			if (String(item.id ?? item.key ?? '') === needle) {
				return index;
			}
		}
		return -1;
	}
	virtualWindow() {
		const vc = this.list('items')?.spot?.virtualController;
		const count = isArray(this.state.items) ? this.state.items.length : 0;
		const windowStart = vc?.windowStart ?? 0;
		const windowEnd = vc?.windowEnd ?? count;
		return {
			windowStart,
			windowEnd,
		};
	}
	rowAt(index) {
		return this.list('items')?.at(index) ?? null;
	}
	rowElements() {
		const handle = this.list('items');
		const items = this.state.items;
		const elements = [];
		if (!handle || !isArray(items)) {
			return elements;
		}
		const {
			windowStart, windowEnd,
		} = this.virtualWindow();
		const dragRow = this.drag?.dragRow;
		for (let index = windowStart; index < windowEnd; index += 1) {
			const row = handle.at(index);
			if (!row || row === dragRow) {
				continue;
			}
			elements.push(row);
		}
		return elements;
	}
	/**
	 * Reorder the SOURCE items array. Live drag emits collection:input;
	 * programmatic / drop emit collection:change.
	 * @param {number} fromIndex - Absolute source index.
	 * @param {number} toIndex - Absolute source index.
	 * @param {boolean} [live] - True during pointer drag.
	 * @returns {boolean} True when the array mutated.
	 */
	moveItem(fromIndex, toIndex, live) {
		const items = this.state.items;
		if (!isArray(items)) {
			return false;
		}
		const count = items.length;
		if (fromIndex < 0 || toIndex < 0 || fromIndex >= count || toIndex >= count || fromIndex === toIndex) {
			return false;
		}
		if (!this.firstRects) {
			this.firstRects = captureRects(this.rowElements());
		}
		const [spliced] = items.splice(fromIndex, 1);
		items.splice(toIndex, 0, spliced);
		this.stateBus?.notify('items');
		queueMicrotask(this.flipTick);
		const payload = {
			items,
			from: fromIndex,
			to: toIndex,
		};
		if (isTrue(live)) {
			this.emit('collection:input', payload);
		} else {
			this.emit('collection:change', payload);
		}
		return true;
	}
	commitDrag(fromIndex, toIndex) {
		this.emit('collection:change', {
			items: this.state.items,
			from: fromIndex,
			to: toIndex,
		});
	}
	handleDragEnd() {
		this.slotMids = null;
	}
	handleDragBegin(domEvent) {
		if (!isTrue(this.state.reorder) || this.drag.active) {
			return;
		}
		const id = domEvent.detail?.data?.id;
		const fromIndex = this.indexOfId(id);
		if (fromIndex < 0) {
			return;
		}
		const row = this.rowAt(fromIndex);
		if (!row) {
			return;
		}
		this.snapshotSlotMids();
		this.drag.start(domEvent, fromIndex, row);
	}
	resolveDragIndex(pointerEvent) {
		if (!this.slotMids) {
			this.snapshotSlotMids();
		}
		const relativeFallback = this.drag.dragIndex - this.slotWindowStart;
		const relative = indexFromSlotMids(this.slotMids, pointerEvent.clientY, relativeFallback);
		return this.slotWindowStart + relative;
	}
	snapshotSlotMids() {
		const handle = this.list('items');
		const items = this.state.items;
		if (!handle || !isArray(items)) {
			this.slotMids = null;
			this.slotWindowStart = 0;
			return;
		}
		const {
			windowStart, windowEnd,
		} = this.virtualWindow();
		this.slotWindowStart = windowStart;
		const row = this.drag.dragRow;
		const previous = row ? row.style.transform : '';
		if (row) {
			row.style.transform = '';
		}
		const mids = [];
		for (let index = windowStart; index < windowEnd; index += 1) {
			const slotRow = handle.at(index);
			if (!slotRow) {
				mids.push(0);
				continue;
			}
			const box = slotRow.getBoundingClientRect();
			mids.push(box.top + (box.height / 2));
		}
		if (row) {
			row.style.transform = previous;
		}
		this.slotMids = mids;
	}
	applyRowFlip() {
		if (this.isDisconnected) {
			this.firstRects = null;
			return;
		}
		const first = this.firstRects;
		this.firstRects = null;
		this.drag?.relayoutFollow();
		if (first) {
			playFlip(this.rowElements(), first);
		}
	}
	handleItemChange(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		// Deep-write checked on the bound item so list assignState stays in sync
		// when the same id reappears (virtual recycle / re-filter).
		const items = this.state.items;
		const itemCount = items.length;
		const id = data.id;
		for (let index = 0; index < itemCount; index++) {
			const item = items[index];
			if (item && (item.id === id || item.key === id)) {
				if (item.checked !== data.checked) {
					item.checked = data.checked;
				}
				break;
			}
		}
		this.emit('collection:select', {
			id: data.id,
			checked: data.checked,
			item: data.item,
		});
	}
	hasFilterBar() {
		const series = this.state.filters;
		return isArray(series) && series.length > 0;
	}
	handleFilterBarChange(domEvent) {
		const value = domEvent.detail?.data?.value;
		this.state.filterArg = isPlainObject(value) ? value : {};
	}
	filterBarMarkup() {
		if (!this.hasFilterBar()) {
			return '';
		}
		return this.htmlElement`
			<div class="collection-filters">
				<ui-filter-bar
					.state.filters=${this.state.filters}
					.state.value=${this.state.filterArg}
					.state.collapsible=${this.state.collapsible}
					@filter-bar:change=${this.handleFilterBarChange}></ui-filter-bar>
			</div>
		`;
	}
	render() {
		// Capture once per render — filter() needs the class/fn value, not a method ref
		// (a method ref would be treated as a light-row renderer).
		this.rowKind = this.resolveRow();
		this.html`
			<div class="collection-shell" @collection-item:change=${this.handleItemChange} @collection-item:drag=${this.handleDragBegin}>
				${this.filterBarMarkup}
				<div class="collection-bar" ?hidden=${!this.state.showBar}>
					<div class="collection-meta">
						<span class="collection-num" ?hidden=${this.countHidden}>${this.countLabel}</span>
						<span class="collection-status">${this.metaStatus}</span>
					</div>
					<div class="collection-controls">
						<slot name="controls"></slot>
						<button class="collection-btn" ?hidden=${this.pagingToggleHidden} @click=${this.toggleStyle}>${this.styleToggleLabel}</button>
						<button class="collection-btn" ?hidden=${this.refreshHidden} @click=${this.refresh}>↻ Refresh</button>
					</div>
				</div>
				<div class=${this.tableClass()} style=${this.tableScrollStyle} ?data-bounded=${Boolean(this.state.tableMaxHeight)}>
					${this.list('_head', this.paintHead, this.headKey)}
						<div class="collection-rows" data-layout=${this.layoutMode} #pl_rows>${this.filter('items', this.rowKind, this.collection('items')?.keepItem, this.rowListOptions())}</div>
					<div class="collection-empty" ?data-error=${this.statusError} ?hidden=${this.hasVisibleItems}>${this.statusText}</div>
					<div class="collection-sentinel" #pl_sentinel aria-hidden="true"></div>
				</div>
				<div class="collection-pager" ?hidden=${this.pagerHidden}>
					<button class="collection-btn" @click=${this.handlePrev} ?disabled=${this.prevDisabled}>‹ Prev</button>
					<span class="collection-page-label">page ${this.statusPage}</span>
					<button class="collection-btn" @click=${this.handleNext} ?disabled=${this.nextDisabled}>Next ›</button>
				</div>
				<div class="collection-loadmore-bar" ?hidden=${this.loadMoreBarHidden}>
					<button class="collection-loadmore" ?hidden=${this.loadMoreHidden} @click=${this.handleLoadMore}>
						<span>Load more</span>
						<span class="collection-loadmore-arrow" aria-hidden="true">▾</span>
					</button>
					<div class="collection-loading-more" ?hidden=${this.loadingMoreHidden} aria-live="polite">
						<span class="collection-spinner" aria-hidden="true"></span>
						<span>Loading</span>
					</div>
					<div class="collection-end" ?hidden=${this.endHidden} aria-live="polite">End of results</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-collection', UICollection);
