import { WebComponent, remoteList } from '../../core/index.js';
/*
 * `<paged-list>` — a reusable remoteList-driven list shell with TWO switchable
 * paging styles:
 *   - loadmore: cumulative (scroll + LOAD MORE button), rows accumulate;
 *   - paged:    prev/next, one page at a time (replace) via the controller's goto().
 * It owns the table frame, the load controller, the meta/status line, the pager /
 * LOAD MORE, empty/error/loading, refresh, and the style toggle. URL sync is
 * delegated to the host's `pageHref(page)` (replaceState — no history spam). Rows
 * render in this shadow, styled by the host's `importStyles` sheet.
 *
 * The host passes its data contract as ONE bundle through `.state` (the framework's
 * child-merge: preserves this component's runtime-state defaults, adds the host's
 * keys; proxy-safe + upgrade-rescued, unlike a plain field or a #private setter):
 *
 *   // host: a stable field (NOT a render-local)
 *   listConfig = { loader, renderRow, keyFn, renderHead, pageHref,
 *                  itemNoun, emptyText, loadingText, pagingStyle, startPage };
 *   <paged-list .state=${this.listConfig} .importStyles=${ROW_STYLES} #list></paged-list>
 *
 *   loader({reset,cursor,signal}) => {items, nextCursor, hasMore, totalCount?}
 *   renderRow / keyFn  — remoteList renderFn + key (rows must be self-contained:
 *                        shape row data in the loader, not from page `this`)
 *   renderHead()       — header-row markup string
 *   pageHref(page)     — URL for the page (omit → no URL sync)
 *
 * The cursor IS the page number (the host's cursor=page bridge), so the wrapper
 * derives the current page as `cursor - 1`.
 */
const PAGED = 'paged';
const LOADMORE = 'loadmore';
export class PagedList extends WebComponent {
	static url = import.meta.url;
	static styles = {
		pagedList: './paged-list.css',
	};
	static state = {
		// runtime
		items: [],
		totalCount: 0,
		loading: false,
		error: '',
		currentPage: 1,
		hasMore: false,
		// host contract (filled via `.state=${listConfig}`)
		loader: null,
		renderRow: null,
		keyFn: null,
		renderHead: null,
		pageHref: null,
		startPage: 1,
		itemNoun: 'items',
		emptyText: 'Nothing here yet.',
		loadingText: 'Loading…',
		pagingStyle: LOADMORE,
	};
	onConnect() {
		this.on('items:loading', this.handleListLoading);
		this.on('items:loaded', this.handleListLoaded);
		this.on('items:error', this.handleListError);
	}
	onMount() {
		this.startInitial();
	}
	/* fillViewport reveal trigger. This SPA mounts route pages hidden (display:none)
	   and reveals them on navigation, so the controller's post-load fill check runs
	   while the list has no layout box and bails. Re-run it when this list becomes
	   visible — the shared IntersectionObserver fires onIntersect on reveal (and once
	   on first observe). No-op unless fillViewport is on and the list is short. */
	onIntersect(isIntersecting) {
		if (isIntersecting) {
			this.remote('items')?.scheduleFillCheck();
		}
	}
	/* Drive the first load (controller is auto:false) so it honors startPage and
	   the active style. Retries on a microtask until the controller has mounted
	   (it attaches a microtask after the first render). */
	startInitial() {
		const controller = this.remote('items');
		if (!controller) {
			queueMicrotask(() => {
				return this.startInitial();
			});
			return;
		}
		const page = Number(this.state.startPage) > 1 ? Number(this.state.startPage) : 1;
		this.state.currentPage = page;
		if (page > 1) {
			controller.goto(page);
		} else {
			controller.reset();
		}
	}
	handleListLoading() {
		this.assignState({
			loading: true,
			error: '',
		});
	}
	handleListLoaded() {
		const controller = this.remote('items');
		this.assignState({
			loading: false,
			hasMore: controller ? controller.hasMore : false,
			currentPage: controller ? controller.page : this.state.currentPage,
		});
		this.syncUrl();
	}
	handleListError(domEvent) {
		this.assignState({
			loading: false,
			error: domEvent?.detail?.data?.error || 'Could not load results',
		});
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
		const url = hrefFn(this.state.currentPage);
		if (url) {
			globalThis.history.replaceState(globalThis.history.state, '', url);
		}
	}
	/* remoteList's loader (called with `this` = wrapper) → host loader; captures the
	   optional totalCount on a fresh window for the meta line. */
	async runLoader(options) {
		const loaderFn = this.state.loader;
		if (typeof loaderFn !== 'function') {
			return null;
		}
		const result = await loaderFn(options);
		if (result && options.reset && typeof result.totalCount === 'number') {
			this.state.totalCount = result.totalCount;
		}
		return result;
	}
	refresh() {
		this.state.currentPage = 1;
		this.remote('items')?.reset();
	}
	/* Public: jump to a page (the host's router calls this on a route change).
	   Works in both styles — paged shows page N, loadmore starts the window at N.
	   Prev/Next clicks are wired by the controller (paged mode); this is only the
	   programmatic route entry. */
	goToPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (target === this.state.currentPage && this.state.items.length) {
			return;
		}
		this.state.currentPage = target;
		this.remote('items')?.gotoPage(target);
	}
	toggleStyle() {
		const next = this.state.pagingStyle === LOADMORE ? PAGED : LOADMORE;
		this.state.pagingStyle = next;
		/* Core owns the swap: setMode re-wires triggers (scroll/loadMore ↔ prev/next)
		   and, switching INTO paged, collapses the window to the current page. */
		this.remote('items')?.setMode(next === PAGED ? PAGED : 'both');
	}
	loadedLabel() {
		if (this.state.pagingStyle === PAGED) {
			return `page ${this.state.currentPage}`;
		}
		return `${this.state.items.length.toLocaleString('en-US')} loaded`;
	}
	totalLabel() {
		return Number(this.state.totalCount || 0).toLocaleString('en-US');
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
		if (this.state.loading) {
			return 'syncing…';
		}
		if (this.state.error) {
			return `error: ${this.state.error}`;
		}
		return '';
	}
	/* The empty/loading/error block (shown only when there are no rows). */
	statusText() {
		if (this.state.loading) {
			return this.state.loadingText;
		}
		if (this.state.error) {
			return this.state.error;
		}
		return this.state.emptyText;
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
					${remoteList('items', this.state.renderRow, {
						loader: this.runLoader,
						mode: this.state.pagingStyle === PAGED ? PAGED : 'both',
						keyFn: this.state.keyFn,
						loadMore: '#pl_load_more',
						prev: '#pl_prev',
						next: '#pl_next',
						dedupe: true,
						fillViewport: true,
					})}
					<div class=${() => {
						return this.state.error ? 'pl-empty pl-error' : 'pl-empty';
					}} ?hidden=${() => {
						return this.state.items.length > 0;
					}}>${this.statusText}</div>
				</div>
				<div class="pl-pager" ?hidden=${() => {
					return this.state.pagingStyle !== PAGED;
				}}>
					<button class="pl-btn" #pl_prev>‹ Prev</button>
					<span class="pl-page-label">page ${this.state.currentPage}</span>
					<button class="pl-btn" #pl_next>Next ›</button>
				</div>
				<div class="pl-loadmore-bar" ?hidden=${() => {
					return this.state.pagingStyle === PAGED;
				}}>
					<button class="pl-btn pl-loadmore" #pl_load_more>LOAD MORE ▾</button>
				</div>
			</div>
		`;
	}
}
customElements.define('paged-list', PagedList);
