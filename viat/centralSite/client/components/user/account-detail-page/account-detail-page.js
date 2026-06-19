import '../../global/paged-list/paged-list.js';
import '../../global/icon/icon.js';
import { WebComponent, html } from '../../core/index.js';
import { AppView } from '../app-view/app-view.js';
const SYSTEM_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const ROW_STYLES = new URL('./account-detail-rows.css', import.meta.url).href;
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
function rowKey(item) {
	return item.id;
}
/* Shape a chain tx into a self-contained row item (direction relative to the
   wallet computed here, so the row needs no page `this`). */
function shapeTx(tx, address) {
	const isOut = tx.from === address;
	const direction = isOut ? 'OUT' : 'IN';
	const counterparty = isOut ? tx.to : tx.from;
	return {
		id: tx.id ?? '',
		txHref: tx.id ? `/tx/${encodeURIComponent(tx.id)}/` : '',
		direction,
		tone: isOut ? 'out' : 'in',
		counterparty: counterparty ?? '',
		counterpartyHref: counterparty ? `/account/${encodeURIComponent(counterparty)}/` : '',
		counterpartyShort: shortAddress(counterparty),
		amountText: `${isOut ? '−' : '+'}${formatAmount(tx.amount)}`,
		status: tx.status || '—',
		timestamp: formatTimestamp(tx.timestamp),
	};
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
		rowStyles: ROW_STYLES,
	};
	/* <paged-list> contract. loader + pageHref are page-this arrows (they read the
	   address); the row is self-contained (data shaped in the loader). */
	listConfig = {
		loader: (options) => {
			return this.loadTransactions(options);
		},
		renderRow: this.txRow,
		keyFn: rowKey,
		renderHead: this.headRow,
		pageHref: (page) => {
			return this.pageHref(page);
		},
		itemNoun: 'transactions',
		emptyText: 'No transactions found.',
		loadingText: 'Loading transactions…',
		pagingStyle: 'loadmore',
	};
	/* Router entry: address is the routed dimension. A new address reloads the
	   one-shot header and refreshes the tx list. */
	setAddress(address) {
		const next = address || '';
		if (next === this.state.address && this.refs.list?.state.items.length) {
			return;
		}
		this.state.address = next;
		this.assignState({
			account: null,
			accountMissing: false,
		});
		if (!next) {
			return;
		}
		this.loadHeader(next);
		this.refs.list?.refresh();
	}
	async loadHeader(address) {
		const sdk = await AppView.ensureSDK();
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
	async loadTransactions({
		reset, cursor,
	}) {
		const address = this.state.address;
		if (!address) {
			return {
				items: [],
				nextCursor: null,
				hasMore: false,
			};
		}
		const page = reset ? 1 : (cursor ?? 1);
		const sdk = await AppView.ensureSDK();
		if (!sdk) {
			return null;
		}
		const response = await sdk.getAccountTransactions(address, {
			page,
		});
		if (!response) {
			return null;
		}
		const txs = response.transactions ?? [];
		const items = [];
		for (let index = 0; index < txs.length; index += 1) {
			items.push(shapeTx(txs[index], address));
		}
		const hasMore = Boolean(response.pagination?.hasMore);
		return {
			items,
			nextCursor: hasMore ? page + 1 : null,
			hasMore,
			totalCount: response.pagination?.totalCount ?? 0,
		};
	}
	pageHref(page) {
		const base = `/account/${encodeURIComponent(this.state.address)}/`;
		if (!page || page <= 1) {
			return base;
		}
		return `${base}page/${page}/`;
	}
	async handleCopy() {
		await navigator.clipboard?.writeText?.(this.state.address);
		this.emit('notify', {
			itemType: 'success',
			title: 'Copied',
			message: 'Address copied to clipboard',
		});
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
	headRow() {
		return `
			<div class="ad-row ad-head">
				<span class="ad-cell ad-id">TX</span>
				<span class="ad-cell ad-dir">DIR</span>
				<span class="ad-cell ad-addr">COUNTERPARTY</span>
				<span class="ad-cell ad-amount">AMOUNT</span>
				<span class="ad-cell ad-status">STATUS</span>
				<span class="ad-cell ad-time">TIMESTAMP</span>
			</div>
		`;
	}
	txRow(item) {
		return html `
			<div class="ad-row">
				<a class="ad-cell ad-id" href=${item.txHref} title=${item.id}>${shortId(item.id)}</a>
				<span class="ad-cell ad-dir" data-tone=${item.tone}>${item.direction}</span>
				<a class="ad-cell ad-addr" href=${item.counterpartyHref} title=${item.counterparty}>${item.counterpartyShort}</a>
				<span class="ad-cell ad-amount" data-tone=${item.tone}>${item.amountText}</span>
				<span class="ad-cell ad-status">${item.status}</span>
				<span class="ad-cell ad-time">${item.timestamp}</span>
			</div>
		`;
	}
	render() {
		this.html `
			<div class="ad-shell">
				<header class="ad-header">
					<div class="ad-title-block">
						<ui-icon class="ad-title-icon" .name=${'user-round'} .size=${'md'}></ui-icon>
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
					</div>
					<paged-list
						.state=${this.listConfig}
						.importStyles=${this.state.rowStyles}
						#list></paged-list>
				</div>
			</div>
		`;
	}
}
customElements.define('account-detail-page', AccountDetailPage);
