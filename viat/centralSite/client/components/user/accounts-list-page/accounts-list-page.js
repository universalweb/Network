import '../../global/icon/icon.js';
import AppView from '../../../modules/app.js';
import { html, routerStore, WebComponent } from '../../core/index.js';
import { COLLECTION_EVENT } from '../../global/collection/collection.js';
const PAGE_SIZE = 20;
const ROW_STYLES = new URL('./accounts-rows.css', import.meta.url).href;
function shortAddress(value) {
	if (!value) {
		return '—';
	}
	if (value.length <= 16) {
		return value;
	}
	return `${value.slice(0, 8)}…${value.slice(-6)}`;
}
function formatAmount(value) {
	if (value == null) {
		return '0';
	}
	const num = Number(value);
	if (!Number.isFinite(num)) {
		return String(value);
	}
	return num.toLocaleString('en-US');
}
function formatTimestamp(value) {
	if (!value) {
		return '—';
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return String(value);
	}
	return date.toISOString().replace('T', ' ').replace(/\..+$/, '');
}
function accountKey(account) {
	return account.address;
}
function pageHrefFor(page) {
	return !page || page <= 1 ? '/accounts/' : `/accounts/page/${page}/`;
}
/* Route page-number → a 1-based page, defaulting to 1 for absent/garbage. */
function pageFromParams(params) {
	const raw = Number(params?.page);
	return Number.isFinite(raw) && raw >= 1 ? raw : 1;
}
/* Loader page: prefer explicit cursor (goto / next page); else page 1. */
function pageFromLoadOptions(_reset, cursor) {
	if (cursor != null && cursor !== '') {
		const page = Number(cursor);
		if (Number.isFinite(page) && page >= 1) {
			return page;
		}
	}
	return 1;
}
export class AccountsListPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		accountsList: './accounts-list-page.css',
	};
	static stores = {
		router: routerStore,
	};
	static state = {
		startPage: 1,
		rowStyles: ROW_STYLES,
	};
	/* The data + display contract for <ui-collection>, merged into its state via
	   `.state=`. One stable object (a bare `.prop=${this.fn}` spot would be invoked
	   by the engine). Accounts rows are self-contained (module getSDK, loader
	   returns totalCount, row reads only its item), so plain method refs are fine. */
	listConfig = {
		loader: this.loadAccounts,
		renderRow: this.accountRow,
		keyFn: accountKey,
		renderHead: this.headRow,
		pageHref: this.pageHref,
		pageSize: PAGE_SIZE,
		itemNoun: 'accounts on chain',
		emptyMessage: 'No accounts yet.',
		loadingMessage: 'Loading recent accounts…',
		pagingStyle: 'loadmore',
	};
	/* Route-driven, not pushed. Pages stay MOUNTED (the shell hides inactive ones
	   with CSS), so the router store's activeView guard keeps this page inert while
	   another one is showing. */
	onConnect() {
		this.observeStore('router', [
			'activeView',
			'params',
		], this.handleRoute);
		this.handleRoute();
	}
	handleRoute() {
		if (this.stores.router.activeView !== 'accounts') {
			return;
		}
		this.setPage(pageFromParams(this.stores.router.params));
	}
	/* A route page-number → the list's start/current page.
	   startPage is bound onto <ui-collection> so first attach does goto(N)
	   (engine start() honors config.startPage). GO_TO_PAGE covers mid-session
	   route changes after the collection is already mounted. */
	setPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (target === this.state.startPage) {
			return;
		}
		this.state.startPage = target;
		this.emit(COLLECTION_EVENT.GO_TO_PAGE, target);
	}
	/* collection loader (self-contained: module getSDK, returns totalCount; no
	   instance state), cursor=page bridge. Prefer cursor (goto/loadMore page
	   number) over the reset flag — reset alone means page 1. */
	async loadAccounts({
		reset, cursor,
	}) {
		const page = pageFromLoadOptions(reset, cursor);
		const sdk = await AppView.ensureSDK();
		if (!sdk) {
			return null;
		}
		const response = await sdk.listRecentAccounts({
			page,
			limit: PAGE_SIZE,
		});
		if (!response) {
			return null;
		}
		const hasMore = Boolean(response.pagination?.hasMore);
		return {
			items: response.accounts ?? [],
			nextCursor: hasMore ? page + 1 : null,
			hasMore,
			totalCount: response.pagination?.totalCount ?? 0,
		};
	}
	pageHref(page) {
		return pageHrefFor(page);
	}
	headRow() {
		return html`
			<div class="al-row al-head">
				<span class="al-cell al-addr">ADDRESS</span>
				<span class="al-cell al-balance">BALANCE</span>
				<span class="al-cell al-totin">TOTAL IN</span>
				<span class="al-cell al-totout">TOTAL OUT</span>
				<span class="al-cell al-time">UPDATED</span>
			</div>
		`;
	}
	accountRow(account) {
		const addr = account.address;
		const href = `/account/${encodeURIComponent(addr)}/`;
		return html`
			<div class="al-row">
				<a class="al-cell al-addr" href=${href} title=${addr}>${shortAddress(addr)}</a>
				<span class="al-cell al-balance">${formatAmount(account.balance)}</span>
				<span class="al-cell al-totin">${formatAmount(account.totalIn)}</span>
				<span class="al-cell al-totout">${formatAmount(account.totalOut)}</span>
				<span class="al-cell al-time">${formatTimestamp(account.updatedAt || account.createdAt)}</span>
			</div>
		`;
	}
	render() {
		this.html`
			<div class="al-shell">
				<header class="al-title-header">
					<div class="al-title-block">
						<ui-icon class="al-title-icon" .state.name=${'users'} .state.size=${'md'}></ui-icon>
						<span class="al-title">// ACCOUNTS · RECENTLY UPDATED</span>
					</div>
				</header>
				<ui-collection
					.state=${this.listConfig}
					.state.startPage=${this.state.startPage}
					.importStyles=${this.state.rowStyles}
					#list></ui-collection>
			</div>
		`;
	}
}
customElements.define('accounts-list-page', AccountsListPage);
