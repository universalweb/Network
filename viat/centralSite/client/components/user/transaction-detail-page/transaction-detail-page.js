import '../../global/icon/icon.js';
import { WebComponent } from '../../core/index.js';
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
export class TransactionDetailPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		transaction: './transaction-detail-page.css',
	};
	static state = {
		txId: '',
		transaction: null,
		loading: false,
		error: '',
		titleIconState: {
			name: 'receipt',
			size: 'md',
		},
	};
	previousId = '';
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
	async getSDK() {
		const app = document.querySelector('app-view');
		return app?.ensureSDK ? app.ensureSDK() : null;
	}
	async loadTransaction(id) {
		this.assignState({
			loading: true,
			error: '',
			transaction: null,
		});
		const sdk = await this.getSDK();
		const response = await sdk.getTransaction(id);
		if (!response) {
			this.assignState({
				loading: false,
				error: 'Transaction not found',
			});
			return;
		}
		this.assignState({
			loading: false,
			transaction: response.transaction ?? response,
		});
	}
	async handleCopyId() {
		try {
			await navigator.clipboard.writeText(this.state.txId);
			this.emit('notify', {
				itemType: 'success',
				title: 'Copied',
				message: 'Transaction ID copied',
			});
		} catch {
			// silent
		}
	}
	renderField(label, value, href, wide) {
		const safeValue = value ?? '—';
		const cls = wide ? 'td-field td-field-wide' : 'td-field';
		if (href) {
			return `
				<div class="${cls}">
					<span class="td-key">${label}</span>
					<a class="td-val td-link" href="${href}">${safeValue}</a>
				</div>
			`;
		}
		return `
			<div class="${cls}">
				<span class="td-key">${label}</span>
				<span class="td-val">${safeValue}</span>
			</div>
		`;
	}
	renderBody() {
		if (this.state.loading) {
			return '<div class="td-empty">Loading transaction…</div>';
		}
		if (this.state.error) {
			return `<div class="td-empty td-error">${this.state.error}</div>`;
		}
		const tx = this.state.transaction;
		if (!tx) {
			return '<div class="td-empty">Transaction not found.</div>';
		}
		const fromHref = `/account/${encodeURIComponent(tx.from)}/`;
		const toHref = `/account/${encodeURIComponent(tx.to)}/`;
		return `
			<div class="td-grid">
				${this.renderField('Type', (tx.type || 'transfer').toUpperCase())}
				${this.renderField('Status', (tx.status || '—').toUpperCase())}
				${this.renderField('Amount', `${formatAmount(tx.amount)} VIAT`)}
				${this.renderField('Timestamp', formatTimestamp(tx.timestamp))}
				${this.renderField('From', tx.from, fromHref, true)}
				${this.renderField('To', tx.to, toHref, true)}
				${this.renderField('Signature', tx.signature, null, true)}
			</div>
		`;
	}
	render() {
		this.html `
			<div class="td-shell" scroll-report>
				<header class="td-header">
					<div class="td-title-block">
						<ui-icon class="td-title-icon" .state=${this.state.titleIconState}></ui-icon>
						<span class="td-title">// TRANSACTION DETAIL</span>
					</div>
					<button class="td-copy" @click=${this.handleCopyId} tooltip="Copy transaction ID">${() => {
						return this.state.txId || '—';
					}}</button>
				</header>
				^html${this.renderBody}
			</div>
		`;
	}
}
customElements.define('transaction-detail-page', TransactionDetailPage);
