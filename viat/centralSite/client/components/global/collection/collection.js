import { WebComponent } from '../../core/index.js';
import { UICollectionItem } from '../collection-item/collection-item.js';
/*
 * `<ui-collection>` — the reusable collection component: a headless
 * CollectionEngine (cursor paging, dedupe, sentinel auto-load) wrapped in a
 * list shell with TWO switchable paging styles:
 *   - loadmore: cumulative (sentinel auto-load + LOAD MORE button), rows accumulate;
 *   - paged:    prev/next, one page at a time (replace) via the collection handle.
 *
 * Loading (preferred API):
 *   this.collection('items', this.state.itemsConfig)  // live reactive config bag
 *   this.collection('items')?.attach / loadMore / …
 * Paint:
 *   ${this.filter('items', renderRow, keepItem, listOpts)}  // virtual by default
 *
 * Host merges flat listConfig fields (loader, keyFn, pagingStyle, filter, …)
 * via `.state=`; onConnect mirrors them into itemsConfig so the engine
 * applyConfig runs on writes. A reactive `filterArg` drives client-side
 * filtering (engine setFilterArg → retouch → re-filter, no reload); `showBar`
 * suppresses the meta/controls bar for a bare embedded list.
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
		itemsStatus: {
			loading: false,
			error: '',
			hasMore: true,
			exhausted: false,
			page: 1,
			hasPrev: false,
			totalCount: 0,
			started: false,
		},
		// Engine config bag — preferred source for this.collection('items', …)
		itemsConfig: {
			loader: null,
			keyFn: null,
			mode: 'both',
			startPage: 1,
			dedupe: true,
		},
		// Host listConfig flat fields (mirrored into itemsConfig)
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
		// Chrome: false hides the meta/controls bar for a bare embedded list.
		showBar: true,
		// Default row (<ui-collection-item>) when renderRow is null/undefined.
		// selectable: show a checkbox; checkboxPosition: 'start' | 'end'.
		selectable: false,
		checkboxPosition: 'start',
		// Virtual list window (list()/filter 4th-arg options). Default ON —
		// estimatedHeight is the seed for unmeasured rows; measure + ResizeObserver
		// self-heal. tableMaxHeight bounds .pl-table so scroll lives inside the
		// collection (null = grow with content; page/ancestor is the scroll root).
		virtual: true,
		estimatedHeight: 40,
		overscan: 4,
		tableMaxHeight: null,
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
	onConnect() {
		// Flat host fields → itemsConfig, then ensure on the live proxy bag.
		this.syncItemsConfig();
		this.syncHeadSlot();
		this.syncSelectableChrome();
		this.observe(['selectable', 'checkboxPosition'], this.syncSelectableChrome);
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
		], this.syncItemsConfig);
		this.observe('renderHead', this.syncHeadSlot);
		this.observe('filterArg', this.syncFilterArg);
		this.collection('items', this.state.itemsConfig);
		this.syncFilterArg();
		this.on('items:loaded', this.handleListLoaded);
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
	handleRefreshRequest() {
		this.refresh();
	}
	handleGoToPageRequest(domEvent) {
		this.goToPage(domEvent.detail?.data);
	}
	/**
	 * Keep itemsConfig in sync with flat host listConfig / chrome fields.
	 * Collection ensure watches itemsConfig — engine applyConfig runs on writes.
	 */
	syncItemsConfig() {
		const cfg = this.state.itemsConfig;
		cfg.loader = this.state.loader;
		cfg.keyFn = this.state.keyFn || null;
		cfg.startPage = this.state.startPage;
		cfg.mode = resolveMode(this.state.pagingStyle);
		cfg.dedupe = true;
		cfg.filter = this.state.filter;
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
	}
	handleListLoaded() {
		this.syncUrl();
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
	}
	/**
	 * Replace the URL via pageHref. In loadmore + pageSize mode, `windowStart`
	 * is the first virtual-window index (scroll position). Paged mode always
	 * uses the engine page.
	 * @param {number} [windowStart] - Virtual window start index when known.
	 */
	syncUrl(windowStart) {
		const hrefFn = this.state.pageHref;
		if (typeof hrefFn !== 'function') {
			return;
		}
		if (typeof this.checkVisibility === 'function' && !this.checkVisibility()) {
			return;
		}
		// Leave the deep-linked URL alone until a page of items is in hand —
		// an empty list + windowStart 0 would otherwise rewrite /page/5/ → /.
		if (!this.state.items.length) {
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
		const status = this.state.itemsStatus;
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
		return visiblePageFor(index, pageSize, status.page, this.state.items.length);
	}
	refresh() {
		this.collection('items')?.reset();
	}
	goToPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (target === this.state.itemsStatus.page && this.state.items.length) {
			return;
		}
		this.collection('items')?.gotoPage(target);
	}
	toggleStyle() {
		// UI chrome + itemsConfig.mode (collection watches itemsConfig → setMode)
		const next = this.state.pagingStyle === LOADMORE ? PAGED : LOADMORE;
		this.state.pagingStyle = next;
		this.state.itemsConfig.mode = next === PAGED ? PAGED : 'both';
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
	loadedLabel() {
		if (this.state.pagingStyle === PAGED) {
			return `page ${this.state.itemsStatus.page}`;
		}
		return `${this.state.items.length.toLocaleString('en-US')} loaded`;
	}
	totalLabel() {
		return Number(this.state.itemsStatus.totalCount || 0).toLocaleString('en-US');
	}
	styleToggleLabel() {
		return this.state.pagingStyle === PAGED ? '≡ Load more' : '⊞ Paged';
	}
	syncHeadSlot() {
		this.state._head = typeof this.state.renderHead === 'function' ? [0] : [];
	}
	/* list() row for the optional head — host may return html`` / Element / string. */
	paintHead() {
		const headFn = this.state.renderHead;
		return typeof headFn === 'function' ? headFn() : '';
	}
	headKey() {
		return 'head';
	}
	/*
	 * 4th arg for filter() — keyFn and (by default) virtual window options.
	 * Install-frozen: first paint wins for virtual/keyFn (ListSpot freezes options).
	 * Virtual list requires a sole-content wrapper host: `.pl-rows>${filter}</div>`
	 * with NO whitespace (parser elides only when open-tag and close-tag abut the expr).
	 */
	rowListOptions() {
		const keyFn = this.state.keyFn;
		if (this.state.virtual === false) {
			return keyFn || undefined;
		}
		const estimatedHeight = this.state.estimatedHeight;
		const height = typeof estimatedHeight === 'number' && estimatedHeight > 0 ? estimatedHeight : 40;
		const overscan = this.state.overscan;
		return {
			keyFn: keyFn || undefined,
			virtual: {
				estimatedHeight: height,
				overscan: typeof overscan === 'number' && overscan >= 0 ? overscan : 4,
			},
		};
	}
	/* Inline max-height on .pl-table when the host bounds the scroll box. */
	tableScrollStyle() {
		const maxHeight = this.state.tableMaxHeight;
		if (maxHeight == null || maxHeight === false || maxHeight === '') {
			return '';
		}
		const value = typeof maxHeight === 'number' ? `${maxHeight}px` : String(maxHeight);
		return `max-block-size:${value};overflow-y:auto`;
	}
	metaStatus() {
		if (this.state.itemsStatus.loading) {
			return 'syncing…';
		}
		if (this.state.itemsStatus.error) {
			return `error: ${this.state.itemsStatus.error}`;
		}
		return '';
	}
	statusText() {
		if (this.state.itemsStatus.loading) {
			return this.state.loadingMessage;
		}
		if (this.state.itemsStatus.error) {
			return this.state.itemsStatus.error;
		}
		return this.state.emptyMessage;
	}
	/* Any row currently visible? Unfiltered → any items; filtered → any item the
	   engine keep-predicate admits, so a filtered-to-empty view still surfaces the
	   empty message. Reads state.items (retouched on load AND on filterArg change),
	   so the empty gate stays reactive to both. */
	hasVisibleItems() {
		const items = this.state.items;
		const count = items.length;
		if (!count) {
			return false;
		}
		const keep = this.collection('items')?.keepItem;
		if (!keep) {
			return true;
		}
		for (let index = 0; index < count; index += 1) {
			if (keep(items[index])) {
				return true;
			}
		}
		return false;
	}
	/* Foot visibility (button / loadmore modes) — bound to `?hidden`, so each
	   returns the HIDDEN condition (a bare method ref, engine-evaluated; a
	   negated `!this.showX` would negate the function, not its result). Mutually
	   exclusive: the LOAD MORE button while a next page exists and idle; the
	   end-of-list loading indicator while a load-more is in flight; the short
	   end-of-results marker once exhausted. */
	loadMoreHidden() {
		const status = this.state.itemsStatus;
		return !(status.started && status.hasMore && !status.loading);
	}
	loadingMoreHidden() {
		return !(this.state.itemsStatus.loading && this.state.items.length > 0);
	}
	endHidden() {
		const status = this.state.itemsStatus;
		return !(status.started && !status.hasMore && this.state.items.length > 0);
	}
	prevDisabled() {
		return this.state.itemsStatus.loading || !this.state.itemsStatus.hasPrev;
	}
	nextDisabled() {
		return this.state.itemsStatus.loading || !this.state.itemsStatus.hasMore;
	}
	/**
	 * Row renderer for filter() — host `renderRow` wins; otherwise the default
	 * <ui-collection-item> component (supports selectable checkboxes).
	 * @returns {Function|typeof WebComponent}
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
	render() {
		// Capture once per render — filter() needs the class/fn value, not a method ref
		// (a method ref would be treated as a light-row renderer).
		this.rowKind = this.resolveRow();
		this.html`
			<div class="pl-shell" @collection-item:change=${this.handleItemChange}>
				<div class="pl-bar" ?hidden=${!this.state.showBar}>
					<div class="pl-meta">
						<span class="pl-num">${this.loadedLabel}</span>
						<span class="pl-label">·</span>
						<span class="pl-num">${this.totalLabel}</span>
						<span class="pl-label">${this.state.itemNoun}</span>
						<span class="pl-status">${this.metaStatus}</span>
					</div>
					<div class="pl-controls">
						<slot name="controls"></slot>
						<button class="pl-btn" @click=${this.toggleStyle}>${this.styleToggleLabel}</button>
						<button class="pl-btn" @click=${this.refresh}>↻ Refresh</button>
					</div>
				</div>
				<div class="pl-table" style=${this.tableScrollStyle} ?data-bounded=${Boolean(this.state.tableMaxHeight)}>
					${this.list('_head', this.paintHead, this.headKey)}
					<div class="pl-rows">${this.filter('items', this.rowKind, this.collection('items')?.keepItem, this.rowListOptions())}</div>
					<div class="pl-empty" ?data-error=${this.state.itemsStatus.error} ?hidden=${this.hasVisibleItems}>${this.statusText}</div>
					<div class="pl-sentinel" #pl_sentinel aria-hidden="true"></div>
				</div>
				<div class="pl-pager" ?hidden=${this.state.pagingStyle !== PAGED}>
					<button class="pl-btn" @click=${this.handlePrev} ?disabled=${this.prevDisabled}>‹ Prev</button>
					<span class="pl-page-label">page ${this.state.itemsStatus.page}</span>
					<button class="pl-btn" @click=${this.handleNext} ?disabled=${this.nextDisabled}>Next ›</button>
				</div>
				<div class="pl-loadmore-bar" ?hidden=${this.state.pagingStyle === PAGED}>
					<button class="pl-loadmore" ?hidden=${this.loadMoreHidden} @click=${this.handleLoadMore}>
						<span>Load more</span>
						<span class="pl-loadmore-arrow" aria-hidden="true">▾</span>
					</button>
					<div class="pl-loading-more" ?hidden=${this.loadingMoreHidden} aria-live="polite">
						<span class="pl-spinner" aria-hidden="true"></span>
						<span>Loading</span>
					</div>
					<div class="pl-end" ?hidden=${this.endHidden} aria-live="polite">End of results</div>
				</div>
			</div>
		`;
	}
}
customElements.define('ui-collection', UICollection);
