import '../../global/icon/icon.js';
import { WebComponent, html, remoteList } from '../../core/index.js';
const PAGE_SIZE = 20;
function shortAddress(value) {
	if (!value) {
		return '—';
	}
	if (value.length <= 16) {
		return value;
	}
	return `${value.slice(0, 8)}…${value.slice(-6)}`;
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
export class AccountsListPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		accountsList: './accounts-list-page.css',
	};
	static state = {
		accounts: [],
		totalCount: 0,
		loading: false,
		error: '',
		titleIconState: {
			name: 'users',
			size: 'md',
		},
	};
	onConnect() {
		this.on('accounts:loading', this.handleListLoading);
		this.on('accounts:loaded', this.handleListLoaded);
		this.on('accounts:error', this.handleListError);
		this.observeGlobal('api', (api) => {
			return this.handleApiReady(api);
		});
	}
	/* The loader awaits ensureSDK on its own, so remoteList's auto-load is
	   self-sufficient. This is a pure retry: if the very first auto-load ran
	   before the chain API was reachable and produced nothing, reload once it is.
	   Guarded on an empty list + null-safe on the controller, so it can never
	   double-load (the supersede token + dedupe cover any overlap). */
	handleApiReady(api) {
		if (api?.ok && !this.state.accounts.length) {
			this.remote('accounts')?.reset();
		}
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
			error: domEvent?.detail?.data?.error || 'Could not load accounts',
		});
	}
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	/* remoteList loader. The chain API is page-based, remoteList is cursor-based —
	   the opaque cursor IS the page number: reset → page 1, loadMore → cursor (the
	   prior nextCursor). nextCursor is the next page while hasMore, else null. */
	async loadAccounts({
		reset, cursor,
	}) {
		const page = reset ? 1 : (cursor ?? 1);
		const sdk = await this.getSDK();
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
		if (page === 1) {
			this.state.totalCount = response.pagination?.totalCount ?? 0;
		}
		return {
			items: response.accounts ?? [],
			nextCursor: hasMore ? page + 1 : null,
			hasMore,
		};
	}
	handleRefresh() {
		this.remote('accounts')?.refresh();
	}
	loadedCount() {
		return formatCount(this.state.accounts.length);
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
			return 'Loading recent accounts…';
		}
		if (this.state.error) {
			return this.state.error;
		}
		return 'No accounts yet.';
	}
	accountRow(account) {
		const addr = account.address;
		const href = `/account/${encodeURIComponent(addr)}/`;
		return html `
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
		this.html `
			<div class="al-shell">
				<header class="al-title-header">
					<div class="al-title-block">
						<ui-icon class="al-title-icon" .state=${this.state.titleIconState}></ui-icon>
						<span class="al-title">// ACCOUNTS · RECENTLY UPDATED</span>
					</div>
					<div class="al-subtitle">
						<span class="al-stat-num">${this.loadedCount}</span>
						<span class="al-stat-label">loaded ·</span>
						<span class="al-stat-num">${this.subtitleTotal}</span>
						<span class="al-stat-label">On Chain</span>
						<span class="al-stat-status">${this.subtitleStatus}</span>
					</div>
				</header>
				<div class="al-controls-bar">
					<div class="al-controls">
						<button class="al-btn" @click=${this.handleRefresh}>↻ Refresh</button>
					</div>
				</div>
				<div class="al-table">
					<div class="al-row al-head">
						<span class="al-cell al-addr">ADDRESS</span>
						<span class="al-cell al-balance">BALANCE</span>
						<span class="al-cell al-totin">TOTAL IN</span>
						<span class="al-cell al-totout">TOTAL OUT</span>
						<span class="al-cell al-time">UPDATED</span>
					</div>
					${remoteList('accounts', this.accountRow, {
						loader: this.loadAccounts,
						mode: 'both',
						keyFn: accountKey,
						loadMore: '#load_more',
						dedupe: true,
					})}
					<div class=${() => {
						return this.state.error ? 'al-empty al-error' : 'al-empty';
					}} ?hidden=${() => {
						return this.state.accounts.length > 0;
					}}>${this.statusText}</div>
				</div>
				<div class="al-loadmore-bar">
					<button class="al-btn al-loadmore" #load_more>LOAD MORE ▾</button>
				</div>
			</div>
		`;
	}
}
customElements.define('accounts-list-page', AccountsListPage);
