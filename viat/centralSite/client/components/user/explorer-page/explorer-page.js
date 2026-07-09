import '../../global/paged-list/paged-list.js';
import '../../global/icon/icon.js';
import { html, WebComponent } from '../../core/index.js';
import { AppView } from '../app-view/app-view.js';
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
	};
	/* Data + display contract for <paged-list>, one stable bundle merged via
	   `.state`. The loader + pageHref are arrows so they read the page's reactive
	   filter; rows are self-contained (no page `this`). */
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
	/* Router entry: the filter is the routed dimension. A real change rebinds the
	   loader's type and reloads from page 1; re-entering the same filter is a
	   no-op so the loaded list survives back-navigation. */
	setView(filter) {
		const normalized = findFilter(filter).id;
		if (normalized === this.state.filter) {
			return;
		}
		this.state.filter = normalized;
		this.refs.list?.refresh();
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
	renderFilters() {
		let markup = '';
		for (let index = 0; index < FILTERS.length; index += 1) {
			const filter = FILTERS[index];
			const isActive = filter.id === this.state.filter;
			const cls = isActive ? 'ex-tab is-active' : 'ex-tab';
			markup += `<a class="${cls}" href="${filter.basePath}" aria-current="${isActive ? 'page' : 'false'}">${filter.label}</a>`;
		}
		return markup;
	}
	headRow() {
		return `
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
		return html `
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
		this.html `
			<div class="ex-shell">
				<header class="ex-title-header">
					<div class="ex-title-block">
						<ui-icon class="ex-title-icon" .state.name=${'compass'} .state.size=${'md'}></ui-icon>
						<span class="ex-title">// EXPLORER · RECENT TRANSACTIONS</span>
					</div>
				</header>
				<paged-list
					.state=${this.listConfig}
					.importStyles=${this.state.rowStyles}
					#list>
					<div slot="controls" class="ex-filters">^html${this.renderFilters}</div>
				</paged-list>
			</div>
		`;
	}
}
customElements.define('explorer-page', ExplorerPage);
