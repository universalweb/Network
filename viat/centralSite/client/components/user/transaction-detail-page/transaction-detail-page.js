import '../../global/icon/icon.js';
import AppView from '../../../modules/app.js';
import { html, WebComponent } from '../../core/index.js';
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
/* Shape a chain tx into the flat field rows the detail grid renders. Built once
   at load time (like account-detail's shapeTx) so the row fn stays a pure map and
   the grid can paint through list() — a method-returned html`` in a content spot
   would stringify to JSON text instead of mounting. */
function buildFields(tx) {
	const from = tx.from ?? '';
	const to = tx.to ?? '';
	return [
		{
			id: 'type',
			label: 'Type',
			value: (tx.type || 'transfer').toUpperCase(),
		},
		{
			id: 'status',
			label: 'Status',
			value: (tx.status || '—').toUpperCase(),
		},
		{
			id: 'amount',
			label: 'Amount',
			value: `${formatAmount(tx.amount)} VIAT`,
		},
		{
			id: 'timestamp',
			label: 'Timestamp',
			value: formatTimestamp(tx.timestamp),
		},
		{
			id: 'from',
			label: 'From',
			value: from || '—',
			href: from ? `/account/${encodeURIComponent(from)}/` : '',
			wide: true,
		},
		{
			id: 'to',
			label: 'To',
			value: to || '—',
			href: to ? `/account/${encodeURIComponent(to)}/` : '',
			wide: true,
		},
		{
			id: 'signature',
			label: 'Signature',
			value: tx.signature ?? '—',
			wide: true,
		},
	];
}
export class TransactionDetailPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		transaction: './transaction-detail-page.css',
	};
	static state = {
		txId: '',
		transaction: null,
		fields: [],
		loading: false,
		error: '',
	};
	previousId = '';
	/*
	 * Route-driven, not pushed. Every page component stays MOUNTED (the shell
	 * hides inactive ones with CSS), so the guard on `routeActiveView` is what
	 * keeps this page inert while another one is showing — without it a route
	 * change anywhere would refetch here.
	 */
	onConnect() {
		this.observeGlobal([
			'routeActiveView',
			'routeParams',
		], this.handleRoute);
		this.handleRoute();
	}
	handleRoute() {
		if (this.global.routeActiveView !== 'transaction') {
			return;
		}
		const id = this.global.routeParams?.id;
		if (id) {
			this.setTxId(id);
		}
	}
	setTxId(id) {
		const next = id || '';
		if (next === this.previousId && this.state.transaction) {
			return;
		}
		this.previousId = next;
		this.assignState({
			txId: next,
		});
		if (next) {
			this.loadTransaction(next);
		}
	}
	async loadTransaction(id) {
		this.assignState({
			loading: true,
			error: '',
			transaction: null,
			fields: [],
		});
		const sdk = await AppView.ensureSDK();
		const response = await sdk.getTransaction(id);
		if (!response) {
			this.assignState({
				loading: false,
				error: 'Transaction not found',
			});
			return;
		}
		const transaction = response.transaction ?? response;
		this.assignState({
			loading: false,
			transaction,
			fields: buildFields(transaction),
		});
	}
	async handleCopyId() {
		try {
			await navigator.clipboard.writeText(this.state.txId);
			this.emit('notify', {
				itemType: 'success',
				heading: 'Copied',
				message: 'Transaction ID copied',
			});
		} catch {
			// silent
		}
	}
	txIdDisplay() {
		return this.state.txId || '—';
	}
	fieldRow(field) {
		const className = field.wide ? 'td-field td-field-wide' : 'td-field';
		if (field.href) {
			return html`<div class=${className}>
				<span class="td-key">${field.label}</span>
				<a class="td-val td-link" href=${field.href}>${field.value}</a>
			</div>`;
		}
		return html`<div class=${className}>
			<span class="td-key">${field.label}</span>
			<span class="td-val">${field.value}</span>
		</div>`;
	}
	renderBody() {
		if (this.state.loading) {
			return this.htmlElement`<div class="td-empty">Loading transaction…</div>`;
		}
		if (this.state.error) {
			return this.htmlElement`<div class="td-empty td-error">${this.state.error}</div>`;
		}
		if (!this.state.transaction) {
			return this.htmlElement`<div class="td-empty">Transaction not found.</div>`;
		}
		return this.htmlElement`<div class="td-grid">${this.list('fields', this.fieldRow)}</div>`;
	}
	render() {
		this.html`
			<div class="td-shell">
				<header class="td-header">
					<div class="td-title-block">
						<ui-icon class="td-title-icon" .state.name=${'receipt'} .state.size=${'md'}></ui-icon>
						<span class="td-title">// TRANSACTION DETAIL</span>
					</div>
					<button class="td-copy" @click=${this.handleCopyId} tooltip="Copy transaction ID">${this.txIdDisplay}</button>
				</header>
				${this.renderBody}
			</div>
		`;
	}
}
customElements.define('transaction-detail-page', TransactionDetailPage);
