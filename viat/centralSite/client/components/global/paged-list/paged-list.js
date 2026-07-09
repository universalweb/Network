import { list, RemoteListEngine, WebComponent } from '../../core/index.js';
/*
 * `<paged-list>` — a reusable remote-loaded list shell with TWO switchable
 * paging styles:
 *   - loadmore: cumulative (sentinel auto-load + LOAD MORE button), rows accumulate;
 *   - paged:    prev/next, one page at a time (replace) via the engine's goto().
 * It owns the table frame, the meta/status line, the pager / LOAD MORE,
 * empty/error/loading, refresh, and the style toggle. URL sync is delegated to
 * the host's `pageHref(page)` (replaceState — no history spam). Rows render in
 * this shadow, styled by the host's `importStyles` sheet.
 *
 * Loading is driven by a headless `RemoteListEngine` (core/state/
 * remoteListEngine.js): created in onConnect, handed the sentinel in
 * onRendered, disposed in onDisconnect. The engine writes the reactive
 * `state.items` + `state.itemsStatus` scope this template binds — no event
 * mirroring, no ref-wired listeners; buttons are plain template `@click`.
 *
 * The host passes its data contract as ONE bundle through `.state` (the framework's
 * child-merge: preserves this component's runtime-state defaults, adds the host's
 * keys; proxy-safe + upgrade-rescued, unlike a plain field or a #private setter):
 *
 *   // host: a stable field (NOT a render-local)
 *   listConfig = { loader, renderRow, keyFn, renderHead, pageHref,
 *                  itemNoun, emptyMessage, loadingMessage, pagingStyle, startPage };
 *   <paged-list .state=${this.listConfig} .importStyles=${ROW_STYLES} #list></paged-list>
 *
 *   loader({reset,cursor,signal}) => {items, nextCursor, hasMore, totalCount?}
 *   renderRow / keyFn  — list renderFn + key (rows must be self-contained:
 *                        shape row data in the loader, not from page `this`)
 *   renderHead()       — header-row markup string
 *   pageHref(page)     — URL for the page (omit → no URL sync)
 *
 * The cursor IS the page number (the host's cursor=page bridge), so the engine
 * tracks the current page directly in `itemsStatus.page`.
 */
const PAGED = 'paged';
const LOADMORE = 'loadmore';
export class PagedList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pagedList: './paged-list.css',
	};
	static state = {
		// runtime (written by the RemoteListEngine)
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
		// host contract (filled via `.state=${listConfig}`)
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
	};
	onConnect() {
		/* Dispose is terminal — a reconnect builds a fresh engine (its first
		   attach re-runs the auto-load, matching a fresh mount). */
		if (!this.list || this.list.disposed) {
			this.list = RemoteListEngine.create(this, {
				key: 'items',
				loader: this.state.loader,
				keyFn: this.state.keyFn || undefined,
				mode: this.state.pagingStyle === PAGED ? PAGED : 'both',
				startPage: this.state.startPage,
				dedupe: true,
			});
		}
		/* Status is reactive; this hook is the URL side-effect only. */
		this.on('items:loaded', this.handleListLoaded);
	}
	/*
	 * onRendered runs on the first render AND every full re-render (skipped on
	 * patch passes) — exactly when the sentinel node may be new. The engine's
	 * attach is idempotent: it re-arms the observer on a fresh sentinel and only
	 * the FIRST call kicks the auto-load (honoring startPage).
	 */
	onRendered() {
		this.list?.attach({
			sentinel: this.refs.pl_sentinel,
		});
	}
	onDisconnect() {
		this.list?.dispose();
	}
	handleListLoaded() {
		this.syncUrl();
	}
	syncUrl() {
		const hrefFn = this.state.pageHref;
		if (typeof hrefFn !== 'function') {
			return;
		}
		/* Only the VISIBLE page owns the URL. SPA pages stay mounted (hidden); a
		   background list loading must not replaceState over the active route — that
		   clobbers the URL and desyncs the router. checkVisibility() is false for a
		   display:none subtree. */
		if (typeof this.checkVisibility === 'function' && !this.checkVisibility()) {
			return;
		}
		const url = hrefFn(this.state.itemsStatus.page);
		if (url) {
			globalThis.history.replaceState(globalThis.history.state, '', url);
		}
	}
	refresh() {
		this.list?.reset();
	}
	/* Public: jump to a page (the host's router calls this on a route change).
	   Works in both styles — paged shows page N, loadmore starts the window at N.
	   Prev/Next clicks route through handlePrev/handleNext; this is only the
	   programmatic route entry. */
	goToPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (target === this.state.itemsStatus.page && this.state.items.length) {
			return;
		}
		this.list?.gotoPage(target);
	}
	toggleStyle() {
		const next = this.state.pagingStyle === LOADMORE ? PAGED : LOADMORE;
		this.state.pagingStyle = next;
		/* The engine owns the swap: setMode re-arms/disarms the sentinel and,
		   switching INTO paged, collapses the window to the current page. */
		this.list?.setMode(next === PAGED ? PAGED : 'both');
	}
	handleLoadMore() {
		this.list?.loadMore();
	}
	handlePrev() {
		this.list?.goPrev();
	}
	handleNext() {
		this.list?.goNext();
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
	headHtml() {
		const headFn = this.state.renderHead;
		return typeof headFn === 'function' ? headFn() : '';
	}
	/* Transient status for the meta line (hidden when idle via `.pl-status:empty`). */
	metaStatus() {
		if (this.state.itemsStatus.loading) {
			return 'syncing…';
		}
		if (this.state.itemsStatus.error) {
			return `error: ${this.state.itemsStatus.error}`;
		}
		return '';
	}
	/* The empty/loading/error block (shown only when there are no rows). */
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
		this.html `
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
					^html${this.headHtml}
					${list('items', this.state.renderRow, this.state.keyFn || undefined)}
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
