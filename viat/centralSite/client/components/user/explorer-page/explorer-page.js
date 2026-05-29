import '../../global/icon/icon.js';
import { WebComponent } from '../../core/index.js';
const PAGE_SIZE = 20;
const FILTERS = [
	{
		id: 'all',
		label: 'All',
		subtitleLabel: 'Total',
		basePath: '/explorer/',
	},
	{
		id: 'mint',
		label: 'Mints',
		subtitleLabel: 'Mints',
		basePath: '/explorer/mints/',
	},
	{
		id: 'transfer',
		label: 'Transfers',
		subtitleLabel: 'Transfers',
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
function formatCount(value) {
	if (value == null) {
		return '0';
	}
	const num = Number(value);
	if (!Number.isFinite(num)) {
		return String(value);
	}
	return num.toLocaleString('en-US');
}
function pageHrefFor(filterId, page) {
	const filter = findFilter(filterId);
	if (!page || page <= 1) {
		return filter.basePath;
	}
	return `${filter.basePath}page/${page}/`;
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
export class ExplorerPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		explorer: './explorer-page.css',
	};
	static state = {
		transactions: [],
		page: 1,
		filter: 'all',
		hasMore: false,
		totalCount: 0,
		loading: false,
		error: '',
		titleIconState: {
			name: 'compass',
			size: 'md',
		},
	};
	loadedKey = '';
	onConnect() {
		this.observeGlobal('api', (api) => {
			if (api?.ok && !this.state.transactions.length && !this.state.loading) {
				this.loadView(this.state.filter, this.state.page);
			}
		});
	}
	onMount() {
		this.loadView(this.state.filter, this.state.page);
	}
	setView(filter, page) {
		const normalizedFilter = findFilter(filter).id;
		const normalizedPage = Number.isFinite(page) && page >= 1 ? page : 1;
		const key = `${normalizedFilter}|${normalizedPage}`;
		if (key === this.loadedKey && this.state.transactions.length) {
			return;
		}
		this.assignState({
			filter: normalizedFilter,
			page: normalizedPage,
		});
		this.loadView(normalizedFilter, normalizedPage);
	}
	async loadView(filter, page = 1) {
		this.loadedKey = `${filter}|${page}`;
		this.assignState({
			loading: true,
			error: '',
		});
		const sdk = await this.getSDK();
		const response = await sdk.listRecentTransactions({
			page,
			limit: PAGE_SIZE,
			type: filter === 'all' ? undefined : filter,
		});
		if (!response) {
			this.assignState({
				loading: false,
				error: 'Could not load transactions',
			});
			return;
		}
		this.assignState({
			transactions: response.transactions ?? [],
			page,
			filter,
			hasMore: Boolean(response.pagination?.hasMore),
			totalCount: response.pagination?.totalCount ?? 0,
			loading: false,
		});
	}
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	handleRefresh = () => {
		this.loadedKey = '';
		this.loadView(this.state.filter, this.state.page);
	};
	subtitleLabel() {
		return findFilter(this.state.filter).subtitleLabel;
	}
	subtitleCount() {
		return formatCount(this.state.totalCount);
	}
	subtitlePage() {
		return this.state.page;
	}
	subtitleStatus() {
		if (this.state.loading) {
			return 'syncing…';
		}
		if (this.state.error) {
			return `error: ${this.state.error}`;
		}
		return '';
	}
	renderRow(tx) {
		const direction = tx.type === 'mint' ? 'mint' : 'transfer';
		const txHref = `/tx/${encodeURIComponent(tx.id)}/`;
		const fromHref = `/account/${encodeURIComponent(tx.from)}/`;
		const toHref = `/account/${encodeURIComponent(tx.to)}/`;
		return `
			<div class="ex-row">
				<a class="ex-cell ex-id" href="${txHref}" title="${tx.id}">${shortId(tx.id)}</a>
				<span class="ex-cell ex-type tone-${direction}">${direction.toUpperCase()}</span>
				<a class="ex-cell ex-addr" href="${fromHref}" title="${tx.from}">${shortAddress(tx.from)}</a>
				<span class="ex-cell ex-arrow">→</span>
				<a class="ex-cell ex-addr" href="${toHref}" title="${tx.to}">${shortAddress(tx.to)}</a>
				<span class="ex-cell ex-amount">${formatAmount(tx.amount)}</span>
				<span class="ex-cell ex-status">${tx.status || '—'}</span>
				<span class="ex-cell ex-time">${formatTimestamp(tx.timestamp)}</span>
			</div>
		`;
	}
	renderRows() {
		if (this.state.loading && !this.state.transactions.length) {
			return '<div class="ex-empty">Loading recent transactions…</div>';
		}
		if (this.state.error && !this.state.transactions.length) {
			return `<div class="ex-empty ex-error">${this.state.error}</div>`;
		}
		if (!this.state.transactions.length) {
			return '<div class="ex-empty">No transactions yet.</div>';
		}
		const list = this.state.transactions;
		let markup = '';
		for (let index = 0; index < list.length; index += 1) {
			markup += this.renderRow(list[index]);
		}
		return markup;
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
	prevHref() {
		return pageHrefFor(this.state.filter, Math.max(1, this.state.page - 1));
	}
	nextHref() {
		return pageHrefFor(this.state.filter, this.state.page + 1);
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="ex-shell">
				<header class="ex-title-header">
					<div class="ex-title-block">
						<ui-icon class="ex-title-icon" .state=${this.state.titleIconState}></ui-icon>
						<span class="ex-title">// EXPLORER · RECENT TRANSACTIONS</span>
					</div>
					<div class="ex-subtitle">
						<span class="ex-stat-num">${this.subtitleCount}</span>
						<span class="ex-stat-label">${this.subtitleLabel}</span>
						<span class="ex-stat-sep">·</span>
						<span class="ex-stat-label">Page</span>
						<span class="ex-stat-num">${this.subtitlePage}</span>
						<span class="ex-stat-status">${this.subtitleStatus}</span>
					</div>
				</header>
				<div class="ex-controls-bar">
					<div class="ex-filters">${this.renderFilters}</div>
					<div class="ex-controls">
						<a class="ex-btn"
							href=${this.prevHref}
							aria-disabled=${() => String(this.state.page <= 1)}>‹ Prev</a>
						<a class="ex-btn"
							href=${this.nextHref}
							aria-disabled=${() => String(!this.state.hasMore)}>Next ›</a>
						<button class="ex-btn" @click=${this.handleRefresh}>↻ Refresh</button>
					</div>
				</div>
				<div class="ex-table">
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
					${this.renderRows}
				</div>
			</div>
		`;
	}
}
customElements.define('explorer-page', ExplorerPage);
