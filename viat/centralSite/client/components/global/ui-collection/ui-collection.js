import { WebComponent } from '../../core/index.js';
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
 *   ${this.filter('items', renderRow, keepItem)}   // engine-driven keep-predicate
 *
 * Host merges flat listConfig fields (loader, keyFn, pagingStyle, filter, …)
 * via `.state=`; onConnect mirrors them into itemsConfig so the engine
 * applyConfig runs on writes. A reactive `filterArg` drives client-side
 * filtering (engine setFilterArg → retouch → re-filter, no reload); `showBar`
 * suppresses the meta/controls bar for a bare embedded list.
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
export class UICollection extends WebComponent {
	static url = import.meta.url;
	static styles = {
		uiCollection: './ui-collection.css',
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
		// 0-or-1 slot so host renderHead html`` mounts via list() (content
		// spots stringify LightTemplate — only list/htmlElement accept it).
		_head: [],
	};
	onConnect() {
		// Flat host fields → itemsConfig, then ensure on the live proxy bag.
		this.syncItemsConfig();
		this.syncHeadSlot();
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
	}
	handleListLoaded() {
		this.syncUrl();
	}
	syncUrl() {
		const hrefFn = this.state.pageHref;
		if (typeof hrefFn !== 'function') {
			return;
		}
		if (typeof this.checkVisibility === 'function' && !this.checkVisibility()) {
			return;
		}
		const url = hrefFn(this.state.itemsStatus.page);
		if (url) {
			globalThis.history.replaceState(globalThis.history.state, '', url);
		}
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
	/** list() row for the optional head — host may return html`` / Element / string. */
	paintHead() {
		const headFn = this.state.renderHead;
		return typeof headFn === 'function' ? headFn() : '';
	}
	headKey() {
		return 'head';
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
	render() {
		this.html`
			<div class="pl-shell">
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
				<div class="pl-table">
					${this.list('_head', this.paintHead, this.headKey)}
					${this.filter('items', this.state.renderRow, this.collection('items')?.keepItem, this.state.keyFn || undefined)}
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
