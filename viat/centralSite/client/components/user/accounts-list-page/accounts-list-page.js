import '../../global/icon/icon.js';
import { WebComponent } from '../../core/index.js';
const PAGE_SIZE = 20;
function pageHrefFor(page) {
	if (!page || page <= 1) {
		return '/accounts/';
	}
	return `/accounts/page/${page}/`;
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
export class AccountsListPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		accountsList: './accounts-list-page.css',
	};
	static state = {
		accounts: [],
		page: 1,
		hasMore: false,
		totalCount: 0,
		loading: false,
		error: '',
	};
	titleIconState = {
		name: 'users',
		size: 'md',
	};
	loadedForPage = 0;
	onConnect() {
		this.observeGlobal('api', (api) => {
			if (api?.ok && !this.state.accounts.length && !this.state.loading) {
				this.loadPage(this.state.page);
			}
		});
	}
	onMount() {
		this.loadPage(this.state.page);
	}
	setPage(page) {
		const target = Number.isFinite(page) && page >= 1 ? page : 1;
		if (target === this.loadedForPage && this.state.accounts.length) {
			return;
		}
		this.assignState({
			page: target,
		});
		this.loadPage(target);
	}
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	async loadPage(page = 1) {
		this.loadedForPage = page;
		this.assignState({
			loading: true,
			error: '',
		});
		const sdk = await this.getSDK();
		const response = await sdk.listRecentAccounts({
			page,
			limit: PAGE_SIZE,
		});
		if (!response) {
			this.assignState({
				loading: false,
				error: 'Could not load accounts',
			});
			return;
		}
		this.assignState({
			accounts: response.accounts ?? [],
			page,
			hasMore: Boolean(response.pagination?.hasMore),
			totalCount: response.pagination?.totalCount ?? 0,
			loading: false,
		});
	}
	handleRefresh = () => {
		this.loadedForPage = 0;
		this.loadPage(this.state.page);
	};
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
	renderRow(account) {
		const addr = account.address;
		const href = `/account/${encodeURIComponent(addr)}/`;
		return `
			<div class="al-row">
				<a class="al-cell al-addr" href="${href}" title="${addr}">${shortAddress(addr)}</a>
				<span class="al-cell al-balance">${formatAmount(account.balance)}</span>
				<span class="al-cell al-totin">${formatAmount(account.totalIn)}</span>
				<span class="al-cell al-totout">${formatAmount(account.totalOut)}</span>
				<span class="al-cell al-time">${formatTimestamp(account.updatedAt || account.createdAt)}</span>
			</div>
		`;
	}
	renderRows() {
		if (this.state.loading && !this.state.accounts.length) {
			return '<div class="al-empty">Loading recent accounts…</div>';
		}
		if (this.state.error && !this.state.accounts.length) {
			return `<div class="al-empty al-error">${this.state.error}</div>`;
		}
		if (!this.state.accounts.length) {
			return '<div class="al-empty">No accounts yet.</div>';
		}
		let markup = '';
		for (let index = 0; index < this.state.accounts.length; index += 1) {
			markup += this.renderRow(this.state.accounts[index]);
		}
		return markup;
	}
	prevHref() {
		return pageHrefFor(Math.max(1, this.state.page - 1));
	}
	nextHref() {
		return pageHrefFor(this.state.page + 1);
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="al-shell">
				<header class="al-title-header">
					<div class="al-title-block">
						<ui-icon class="al-title-icon" .state=${this.titleIconState}></ui-icon>
						<span class="al-title">// ACCOUNTS · RECENTLY UPDATED</span>
					</div>
					<div class="al-subtitle">
						<span class="al-stat-num">${this.subtitleCount}</span>
						<span class="al-stat-label">On Chain</span>
						<span class="al-stat-sep">·</span>
						<span class="al-stat-label">Page</span>
						<span class="al-stat-num">${this.subtitlePage}</span>
						<span class="al-stat-status">${this.subtitleStatus}</span>
					</div>
				</header>
				<div class="al-controls-bar">
					<div class="al-controls">
						<a class="al-btn"
							href=${this.prevHref}
							aria-disabled=${() => String(this.state.page <= 1)}>‹ Prev</a>
						<a class="al-btn"
							href=${this.nextHref}
							aria-disabled=${() => String(!this.state.hasMore)}>Next ›</a>
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
					${this.renderRows}
				</div>
			</div>
		`;
	}
}
customElements.define('accounts-list-page', AccountsListPage);
