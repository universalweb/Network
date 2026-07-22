import '../../global/icon/icon.js';
import AppView from '../../../modules/app.js';
import { html, WebComponent } from '../../core/index.js';
import { COLLECTION_EVENT } from '../../global/ui-collection/ui-collection.js';
const PAGE_SIZE = 20;
const ROW_STYLES = new URL('./explorer-rows.css', import.meta.url).href;
const FILTERS = [
	{
		id: 'all',
		label: 'All',
		basePath: '/explorer/',
	},
	{
		id: 'mint',
		label: 'Mints',
		basePath: '/explorer/mints/',
	},
	{
		id: 'transfer',
		label: 'Transfers',
		basePath: '/explorer/transfers/',
	},
];
function filtersAsItems(activeId) {
	const items = [];
	const count = FILTERS.length;
	for (let index = 0; index < count; index += 1) {
		const filter = FILTERS[index];
		items.push({
			id: filter.id,
			label: filter.label,
			basePath: filter.basePath,
			active: filter.id === activeId,
		});
	}
	return items;
}
function findFilter(filterId) {
	for (let index = 0; index < FILTERS.length; index += 1) {
		if (FILTERS[index].id === filterId) {
			return FILTERS[index];
		}
	}
	return FILTERS[0];
}
function shortAddress(value) {
	if (!value) {
		return '—';
	}
	if (value.length <= 16) {
		return value;
	}
	return `${value.slice(0, 8)}…${value.slice(-6)}`;
}
function shortId(value) {
	if (!value) {
		return '—';
	}
	if (value.length <= 14) {
		return value;
	}
	return `${value.slice(0, 8)}…${value.slice(-4)}`;
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
function txKey(tx) {
	return tx.id;
}
function pageHrefFor(filterId, page) {
	const filter = findFilter(filterId);
	if (!page || page <= 1) {
		return filter.basePath;
	}
	return `${filter.basePath}page/${page}/`;
}
export class ExplorerPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		explorer: './explorer-page.css',
	};
	static state = {
		filter: 'all',
		rowStyles: ROW_STYLES,
		filterItems: filtersAsItems('all'),
	};
	onConnect() {
		this.observe('filter', this.syncFilterItems);
		this.syncFilterItems();
		/* Route-driven, not pushed. Pages stay MOUNTED (the shell hides inactive
		   ones with CSS), so the routeActiveView guard keeps this page inert
		   while another one is showing. */
		this.observeGlobal([
			'routeActiveView',
			'routeFilter',
		], this.handleRoute);
		this.handleRoute();
	}
	handleRoute() {
		if (this.global.routeActiveView !== 'explorer') {
			return;
		}
		this.setView(this.global.routeFilter || 'all');
	}
	syncFilterItems() {
		this.state.filterItems = filtersAsItems(this.state.filter);
	}
	/* ui-collection contract — stable instance object merged once via `.state=`.
	   Loader/pageHref are class-field arrows so they close over page `this`
	   (engine .call(host) for loader; pageHref is invoked bare). */
	listConfig = {
		loader: (options) => {
			return this.loadTransactions(options);
		},
		renderRow: this.txRow,
		keyFn: txKey,
		renderHead: this.headRow,
		pageHref: (page) => {
			return pageHrefFor(this.state.filter, page);
		},
		itemNoun: 'transactions',
		emptyMessage: 'No transactions yet.',
		loadingMessage: 'Loading recent transactions…',
		pagingStyle: 'loadmore',
	};
	/* The filter is the routed dimension. A real change rebinds the loader's type
	   and reloads from page 1; re-entering the same filter is a no-op so the
	   loaded list survives back-navigation. */
	setView(filter) {
		const normalized = findFilter(filter).id;
		if (normalized === this.state.filter) {
			return;
		}
		this.state.filter = normalized;
		this.emit(COLLECTION_EVENT.REFRESH);
	}
	async loadTransactions({
		reset, cursor,
	}) {
		const page = reset ? 1 : (cursor ?? 1);
		const filter = this.state.filter;
		const sdk = await AppView.ensureSDK();
		if (!sdk) {
			return null;
		}
		const params = {
			page,
			limit: PAGE_SIZE,
		};
		if (filter !== 'all') {
			params.type = filter;
		}
		const response = await sdk.listRecentTransactions(params);
		if (!response) {
			return null;
		}
		const hasMore = Boolean(response.pagination?.hasMore);
		return {
			items: response.transactions ?? [],
			nextCursor: hasMore ? page + 1 : null,
			hasMore,
			totalCount: response.pagination?.totalCount ?? 0,
		};
	}
	filterRow(item) {
		const className = item.active ? 'ex-tab is-active' : 'ex-tab';
		return html`<a class=${className} href=${item.basePath} aria-current=${item.active ? 'page' : 'false'}>${item.label}</a>`;
	}
	filterKey(item) {
		return item.id;
	}
	headRow() {
		return html`
			<div class="ex-row ex-head">
				<span class="ex-cell ex-id">TX ID</span>
				<span class="ex-cell ex-type">TYPE</span>
				<span class="ex-cell ex-addr">FROM</span>
				<span class="ex-cell ex-arrow"></span>
				<span class="ex-cell ex-addr">TO</span>
				<span class="ex-cell ex-amount">AMOUNT</span>
				<span class="ex-cell ex-status">STATUS</span>
				<span class="ex-cell ex-time">TIMESTAMP</span>
			</div>
		`;
	}
	txRow(tx) {
		const direction = tx.type === 'mint' ? 'mint' : 'transfer';
		const txHref = `/tx/${encodeURIComponent(tx.id)}/`;
		const fromHref = `/account/${encodeURIComponent(tx.from)}/`;
		const toHref = `/account/${encodeURIComponent(tx.to)}/`;
		return html`
			<div class="ex-row">
				<a class="ex-cell ex-id" href=${txHref} title=${tx.id}>${shortId(tx.id)}</a>
				<span class="ex-cell ex-type" data-tone=${direction}>${direction.toUpperCase()}</span>
				<a class="ex-cell ex-addr" href=${fromHref} title=${tx.from}>${shortAddress(tx.from)}</a>
				<span class="ex-cell ex-arrow">→</span>
				<a class="ex-cell ex-addr" href=${toHref} title=${tx.to}>${shortAddress(tx.to)}</a>
				<span class="ex-cell ex-amount">${formatAmount(tx.amount)}</span>
				<span class="ex-cell ex-status">${tx.status || '—'}</span>
				<span class="ex-cell ex-time">${formatTimestamp(tx.timestamp)}</span>
			</div>
		`;
	}
	render() {
		this.html`
			<div class="ex-shell">
				<header class="ex-title-header">
					<div class="ex-title-block">
						<ui-icon class="ex-title-icon" .state.name=${'compass'} .state.size=${'md'}></ui-icon>
						<span class="ex-title">// EXPLORER · RECENT TRANSACTIONS</span>
					</div>
				</header>
				<ui-collection
					.state=${this.listConfig}
					.importStyles=${this.state.rowStyles}
					#list>
					<div slot="controls" class="ex-filters">${this.list('filterItems', this.filterRow, this.filterKey)}</div>
				</ui-collection>
			</div>
		`;
	}
}
customElements.define('explorer-page', ExplorerPage);
