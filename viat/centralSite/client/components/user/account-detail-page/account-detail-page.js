import '../../global/icon/icon.js';
import { WebComponent } from '../../core/index.js';
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
		page: 1,
		hasMore: false,
		totalCount: 0,
		loading: false,
		error: '',
		titleIconState: {
			name: 'user-round',
			size: 'md',
		},
	};
	loadedKey = '';
	setAddress(address, page = 1) {
		const nextAddress = address || '';
		const nextPage = Number.isFinite(page) && page >= 1 ? page : 1;
		const key = `${nextAddress}|${nextPage}`;
		if (key === this.loadedKey) {
			return;
		}
		this.loadedKey = key;
		this.assignState({
			address: nextAddress,
			page: nextPage,
		});
		if (!nextAddress) {
			return;
		}
		this.loadAccount(nextAddress, nextPage);
	}
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	async loadAccount(address, page = 1) {
		this.assignState({
			loading: true,
			error: '',
		});
		const sdk = await this.getSDK();
		// getAccount 404s are flagged silent in the SDK — null here means either
		// "no account record" or a non-404 failure (SDK already notified).
		const accountResponse = await sdk.getAccount(address);
		const account = accountResponse?.account ?? null;
		const accountMissing = !account;
		const txResponse = await sdk.getAccountTransactions(address, {
			page,
		});
		this.assignState({
			loading: false,
			account,
			accountMissing,
			transactions: txResponse?.transactions ?? [],
			hasMore: Boolean(txResponse?.pagination?.hasMore),
			totalCount: txResponse?.pagination?.totalCount ?? 0,
		});
	}
	pageHref(page) {
		const base = `/account/${encodeURIComponent(this.state.address)}/`;
		if (!page || page <= 1) {
			return base;
		}
		return `${base}page/${page}/`;
	}
	handleCopy = async () => {
		await navigator.clipboard?.writeText?.(this.state.address);
		this.emit('notify', {
			itemType: 'success',
			title: 'Copied',
			message: 'Address copied to clipboard',
		});
	};
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
	renderTxRow(tx) {
		const counterparty = tx.from === this.state.address ? tx.to : tx.from;
		const counterpartyHref = `/account/${encodeURIComponent(counterparty)}/`;
		const txHref = `/tx/${encodeURIComponent(tx.id)}/`;
		const direction = tx.from === this.state.address ? 'OUT' : 'IN';
		const sign = direction === 'IN' ? '+' : '−';
		return `
			<div class="ad-row">
				<a class="ad-cell ad-id" href="${txHref}" title="${tx.id}">${shortId(tx.id)}</a>
				<span class="ad-cell ad-dir tone-${direction.toLowerCase()}">${direction}</span>
				<a class="ad-cell ad-addr" href="${counterpartyHref}" title="${counterparty}">${shortAddress(counterparty)}</a>
				<span class="ad-cell ad-amount tone-${direction.toLowerCase()}">${sign}${formatAmount(tx.amount)}</span>
				<span class="ad-cell ad-status">${tx.status || '—'}</span>
				<span class="ad-cell ad-time">${formatTimestamp(tx.timestamp)}</span>
			</div>
		`;
	}
	renderTxList() {
		if (this.state.loading && !this.state.transactions.length) {
			return '<div class="ad-empty">Loading transactions…</div>';
		}
		if (this.state.error) {
			return `<div class="ad-empty ad-error">${this.state.error}</div>`;
		}
		if (!this.state.transactions.length) {
			return '<div class="ad-empty">No transactions found.</div>';
		}
		let markup = '';
		for (let index = 0; index < this.state.transactions.length; index += 1) {
			markup += this.renderTxRow(this.state.transactions[index]);
		}
		return markup;
	}
	addressDisplay() {
		return this.state.address || 'no address';
	}
	prevHref() {
		return this.pageHref(Math.max(1, this.state.page - 1));
	}
	nextHref() {
		return this.pageHref(this.state.page + 1);
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="ad-shell">
				<header class="ad-header">
					<div class="ad-title-block">
						<ui-icon class="ad-title-icon" .state=${this.state.titleIconState}></ui-icon>
						<span class="ad-title">// ACCOUNT DETAIL</span>
						<span class="ad-label-tag">${() => labelForAddress(this.state.address)}</span>
					</div>
					<button class="ad-address" @click=${this.handleCopy} tooltip="Click to copy">
						<span class="ad-address-text">${this.addressDisplay}</span>
					</button>
				</header>
				^html${this.renderStats}
				<div class="ad-section">
					<div class="ad-section-head">
						<span>Transactions</span>
						<span class="ad-pager">
							<a class="ad-btn"
								href=${this.prevHref}
								aria-disabled=${() => String(this.state.page <= 1)}>‹ Prev</a>
							<span class="ad-page-label">page ${() => this.state.page}</span>
							<a class="ad-btn"
								href=${this.nextHref}
								aria-disabled=${() => String(!this.state.hasMore)}>Next ›</a>
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
						^html${this.renderTxList}
					</div>
				</div>
			</div>
		`;
	}
}
customElements.define('account-detail-page', AccountDetailPage);
