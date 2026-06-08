import '../../global/icon/icon.js';
import { WebComponent, html, remoteList } from '../../core/index.js';
const SYSTEM_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
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
function labelForAddress(address) {
	return address === SYSTEM_ADDRESS ? 'SYSTEM (mint)' : 'ACCOUNT';
}
function txKey(tx) {
	return tx.id;
}
export class AccountDetailPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		account: './account-detail-page.css',
	};
	static state = {
		address: '',
		account: null,
		accountMissing: false,
		transactions: [],
		totalCount: 0,
		loading: false,
		error: '',
		titleIconState: {
			name: 'user-round',
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
	/* Pure retry once the chain API is reachable — only meaningful with an address
	   and an empty list; reloads the header too. Null-safe + dedupe-guarded. */
	handleApiReady(api) {
		if (api?.ok && this.state.address && !this.state.transactions.length) {
			this.loadHeader(this.state.address);
			this.remote('transactions')?.reset();
		}
	}
	/* Router entry point. Address is the routed dimension: a new address reloads
	   the one-shot header (getAccount) and resets the tx list controller; the
	   loader reads state.address at call time. */
	setAddress(address) {
		const next = address || '';
		if (next === this.state.address && this.state.transactions.length) {
			return;
		}
		this.state.address = next;
		this.assignState({
			account: null,
			accountMissing: false,
		});
		if (!next) {
			this.state.transactions = [];
			return;
		}
		this.loadHeader(next);
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
	/* The account header — one-shot, separate from the paged tx list. A 404 is
	   flagged silent in the SDK, so a null account means "no record, history
	   only", surfaced as accountMissing. */
	async loadHeader(address) {
		const sdk = await this.getSDK();
		if (!sdk) {
			return;
		}
		const accountResponse = await sdk.getAccount(address);
		const account = accountResponse?.account ?? null;
		this.assignState({
			account,
			accountMissing: !account,
		});
	}
	/* remoteList loader, cursor=page bridge (see accounts-list-page). Returns an
	   empty success (not null) when there is no address yet, so the mount auto-load
	   is a clean no-op rather than an error flash before setAddress arrives. */
	async loadTransactions({
		reset, cursor,
	}) {
		if (!this.state.address) {
			return {
				items: [],
				nextCursor: null,
				hasMore: false,
			};
		}
		const page = reset ? 1 : (cursor ?? 1);
		const sdk = await this.getSDK();
		if (!sdk) {
			return null;
		}
		const response = await sdk.getAccountTransactions(this.state.address, {
			page,
		});
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
	async handleCopy() {
		await navigator.clipboard?.writeText?.(this.state.address);
		this.emit('notify', {
			itemType: 'success',
			title: 'Copied',
			message: 'Address copied to clipboard',
		});
	}
	loadedCount() {
		return formatCount(this.state.transactions.length);
	}
	statusText() {
		if (this.state.loading) {
			return 'Loading transactions…';
		}
		if (this.state.error) {
			return this.state.error;
		}
		return 'No transactions found.';
	}
	addressDisplay() {
		return this.state.address || 'no address';
	}
	renderStats() {
		const account = this.state.account;
		if (this.state.accountMissing) {
			return `
				<div class="ad-stats ad-stats-missing">
					<span class="ad-stat-key">No account record</span>
					<span class="ad-stat-val">Address has transaction history only</span>
				</div>
			`;
		}
		if (!account) {
			return '<div class="ad-stats ad-stats-loading">Loading account…</div>';
		}
		return `
			<div class="ad-stats">
				<div class="ad-stat">
					<span class="ad-stat-key">Balance</span>
					<span class="ad-stat-val ad-stat-good">${formatAmount(account.balance)} VIAT</span>
				</div>
				<div class="ad-stat">
					<span class="ad-stat-key">Total In</span>
					<span class="ad-stat-val">${formatAmount(account.totalIn)} VIAT</span>
				</div>
				<div class="ad-stat">
					<span class="ad-stat-key">Total Out</span>
					<span class="ad-stat-val">${formatAmount(account.totalOut)} VIAT</span>
				</div>
			</div>
		`;
	}
	txRow(tx) {
		const counterparty = tx.from === this.state.address ? tx.to : tx.from;
		const counterpartyHref = `/account/${encodeURIComponent(counterparty)}/`;
		const txHref = `/tx/${encodeURIComponent(tx.id)}/`;
		const direction = tx.from === this.state.address ? 'OUT' : 'IN';
		const dirLower = direction.toLowerCase();
		/* Whole-value class spots: light rows split a partial `tone-${x}` into a
		   separate token, so pre-join the tone class here. */
		const dirClass = `ad-cell ad-dir tone-${dirLower}`;
		const amountClass = `ad-cell ad-amount tone-${dirLower}`;
		const sign = direction === 'IN' ? '+' : '−';
		const amountText = `${sign}${formatAmount(tx.amount)}`;
		return html `
			<div class="ad-row">
				<a class="ad-cell ad-id" href=${txHref} title=${tx.id}>${shortId(tx.id)}</a>
				<span class=${dirClass}>${direction}</span>
				<a class="ad-cell ad-addr" href=${counterpartyHref} title=${counterparty}>${shortAddress(counterparty)}</a>
				<span class=${amountClass}>${amountText}</span>
				<span class="ad-cell ad-status">${tx.status || '—'}</span>
				<span class="ad-cell ad-time">${formatTimestamp(tx.timestamp)}</span>
			</div>
		`;
	}
	render() {
		this.html `
			<div class="ad-shell">
				<header class="ad-header">
					<div class="ad-title-block">
						<ui-icon class="ad-title-icon" .state=${this.state.titleIconState}></ui-icon>
						<span class="ad-title">// ACCOUNT DETAIL</span>
						<span class="ad-label-tag">${() => {
							return labelForAddress(this.state.address);
						}}</span>
					</div>
					<button class="ad-address" @click=${this.handleCopy} tooltip="Click to copy">
						<span class="ad-address-text">${this.addressDisplay}</span>
					</button>
				</header>
				^html${this.renderStats}
				<div class="ad-section">
					<div class="ad-section-head">
						<span>Transactions</span>
						<span class="ad-section-meta">
							<span class="ad-stat-num">${this.loadedCount}</span>
							<span class="ad-stat-label">loaded</span>
							<button class="ad-btn" @click=${this.handleRefresh}>↻</button>
						</span>
					</div>
					<div class="ad-table">
						<div class="ad-row ad-head">
							<span class="ad-cell ad-id">TX</span>
							<span class="ad-cell ad-dir">DIR</span>
							<span class="ad-cell ad-addr">COUNTERPARTY</span>
							<span class="ad-cell ad-amount">AMOUNT</span>
							<span class="ad-cell ad-status">STATUS</span>
							<span class="ad-cell ad-time">TIMESTAMP</span>
						</div>
						${remoteList('transactions', this.txRow, {
							loader: this.loadTransactions,
							mode: 'both',
							keyFn: txKey,
							loadMore: '#load_more',
							dedupe: true,
						})}
						<div class=${() => {
							return this.state.error ? 'ad-empty ad-error' : 'ad-empty';
						}} ?hidden=${() => {
							return this.state.transactions.length > 0;
						}}>${this.statusText}</div>
					</div>
					<div class="ad-loadmore-bar">
						<button class="ad-btn ad-loadmore" #load_more>LOAD MORE ▾</button>
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('account-detail-page', AccountDetailPage);
