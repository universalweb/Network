import { WebComponent } from '../../core/index.js';
/*
 * `<paged-list>` — a reusable collection-loaded list shell with TWO switchable
 * paging styles:
 *   - loadmore: cumulative (sentinel auto-load + LOAD MORE button), rows accumulate;
 *   - paged:    prev/next, one page at a time (replace) via the collection handle.
 *
 * Loading (preferred API):
 *   this.collection('items', this.state.itemsConfig)  // live reactive config bag
 *   this.collection('items')?.attach / loadMore / …
 * Paint:
 *   ${this.list('items', renderRow)}
 *
 * Host still merges flat listConfig fields (loader, keyFn, pagingStyle, …);
 * onConnect mirrors them into itemsConfig so existing hosts need no change.
 * Writes to itemsConfig (or those flat keys) re-apply the engine automatically.
 */
const PAGED = 'paged';
const LOADMORE = 'loadmore';
export class PagedList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pagedList: './paged-list.css',
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
		this.collection('items', this.state.itemsConfig);
		this.on('items:loaded', this.handleListLoaded);
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
		cfg.mode = this.state.pagingStyle === PAGED ? PAGED : 'both';
		cfg.dedupe = true;
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
	moreDisabled() {
		return this.state.itemsStatus.loading || this.state.itemsStatus.exhausted;
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
				<div class="pl-bar">
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
					${this.list('items', this.state.renderRow, this.state.keyFn || undefined)}
					<div class="pl-empty" ?data-error=${this.state.itemsStatus.error} ?hidden=${this.state.items.length > 0}>${this.statusText}</div>
					<div class="pl-sentinel" #pl_sentinel aria-hidden="true"></div>
				</div>
				<div class="pl-pager" ?hidden=${this.state.pagingStyle !== PAGED}>
					<button class="pl-btn" @click=${this.handlePrev} ?disabled=${this.prevDisabled}>‹ Prev</button>
					<span class="pl-page-label">page ${this.state.itemsStatus.page}</span>
					<button class="pl-btn" @click=${this.handleNext} ?disabled=${this.nextDisabled}>Next ›</button>
				</div>
				<div class="pl-loadmore-bar" ?hidden=${this.state.pagingStyle === PAGED}>
					<button class="pl-btn pl-loadmore" @click=${this.handleLoadMore} ?disabled=${this.moreDisabled}>LOAD MORE ▾</button>
				</div>
			</div>
		`;
	}
}
customElements.define('paged-list', PagedList);
