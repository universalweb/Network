import '../../global/icon/icon.js';
import { WebComponent, html, remoteList } from '../../core/index.js';
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
export class ExplorerPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		explorer: './explorer-page.css',
	};
	static state = {
		transactions: [],
		filter: 'all',
		totalCount: 0,
		loading: false,
		error: '',
		titleIconState: {
			name: 'compass',
			size: 'md',
		},
	};
	onConnect() {
		this.on('transactions:loading', this.handleListLoading);
		this.on('transactions:loaded', this.handleListLoaded);
		this.on('transactions:error', this.handleListError);
		this.observeGlobal('api', (api) => {
			return this.handleApiReady(api);
		});
	}
	/* Pure retry once the chain API is reachable — guarded on an empty list and
	   null-safe on the controller, so the supersede token + dedupe make it
	   double-load-proof. */
	handleApiReady(api) {
		if (api?.ok && !this.state.transactions.length) {
			this.remote('transactions')?.reset();
		}
	}
	/* Router entry point. The filter is the only routed dimension that matters
	   now (page-number paging is gone); a real filter change rebinds the loader's
	   `type` and resets, re-entering the same filter is a no-op so the loaded list
	   survives back-navigation. */
	setView(filter) {
		const normalized = findFilter(filter).id;
		if (normalized === this.state.filter) {
			return;
		}
		this.state.filter = normalized;
		this.remote('transactions')?.reset();
	}
	handleListLoading() {
		this.assignState({
			loading: true,
			error: '',
		});
	}
	handleListLoaded() {
		this.state.loading = false;
	}
	handleListError(domEvent) {
		this.assignState({
			loading: false,
			error: domEvent?.detail?.data?.error || 'Could not load transactions',
		});
	}
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	/* Cursor=page bridge (see accounts-list-page). The active filter is read from
	   state at call time, so a setView()-driven reset reloads with the new type. */
	async loadTransactions({
		reset, cursor,
	}) {
		const page = reset ? 1 : (cursor ?? 1);
		const filter = this.state.filter;
		const sdk = await this.getSDK();
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
		if (page === 1) {
			this.state.totalCount = response.pagination?.totalCount ?? 0;
		}
		return {
			items: response.transactions ?? [],
			nextCursor: hasMore ? page + 1 : null,
			hasMore,
		};
	}
	handleRefresh() {
		this.remote('transactions')?.refresh();
	}
	loadedCount() {
		return formatCount(this.state.transactions.length);
	}
	subtitleLabel() {
		return findFilter(this.state.filter).subtitleLabel;
	}
	subtitleTotal() {
		return formatCount(this.state.totalCount);
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
	statusText() {
		if (this.state.loading) {
			return 'Loading recent transactions…';
		}
		if (this.state.error) {
			return this.state.error;
		}
		return 'No transactions yet.';
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
	txRow(tx) {
		const direction = tx.type === 'mint' ? 'mint' : 'transfer';
		/* Whole-value class spot: light rows insert a partial `tone-${x}` as a
		   separate space-delimited token (`tone- mint`), so the prefix must be
		   pre-joined here and bound as one value. */
		const typeClass = `ex-cell ex-type tone-${direction}`;
		const txHref = `/tx/${encodeURIComponent(tx.id)}/`;
		const fromHref = `/account/${encodeURIComponent(tx.from)}/`;
		const toHref = `/account/${encodeURIComponent(tx.to)}/`;
		return html `
			<div class="ex-row">
				<a class="ex-cell ex-id" href=${txHref} title=${tx.id}>${shortId(tx.id)}</a>
				<span class=${typeClass}>${direction.toUpperCase()}</span>
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
						<ui-icon class="ex-title-icon" .state=${this.state.titleIconState}></ui-icon>
						<span class="ex-title">// EXPLORER · RECENT TRANSACTIONS</span>
					</div>
					<div class="ex-subtitle">
						<span class="ex-stat-num">${this.loadedCount}</span>
						<span class="ex-stat-label">loaded ·</span>
						<span class="ex-stat-num">${this.subtitleTotal}</span>
						<span class="ex-stat-label">${this.subtitleLabel}</span>
						<span class="ex-stat-status">${this.subtitleStatus}</span>
					</div>
				</header>
				<div class="ex-controls-bar">
					<div class="ex-filters">^html${this.renderFilters}</div>
					<div class="ex-controls">
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
					${remoteList('transactions', this.txRow, {
						loader: this.loadTransactions,
						mode: 'both',
						keyFn: txKey,
						loadMore: '#load_more',
						dedupe: true,
					})}
					<div class=${() => {
						return this.state.error ? 'ex-empty ex-error' : 'ex-empty';
					}} ?hidden=${() => {
						return this.state.transactions.length > 0;
					}}>${this.statusText}</div>
				</div>
				<div class="ex-loadmore-bar">
					<button class="ex-btn ex-loadmore" #load_more>LOAD MORE ▾</button>
				</div>
			</div>
		`;
	}
}
customElements.define('explorer-page', ExplorerPage);
