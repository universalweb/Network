import '../../global/icon/icon.js';
import { html, routerStore, WebComponent } from '../../core/index.js';
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
/* Lazy AppView import — app.js imports this page at module top, so a static
   `import AppView from app.js` is a circular edge. Dynamic import runs after both
   modules have finished evaluating, so `ensureSDK` is always the real static. */
let appViewModule = null;
async function ensureSDK() {
	appViewModule ??= import('../../../modules/app.js');
	const mod = await appViewModule;
	return mod.default.ensureSDK();
}
export class TransactionDetailPage extends WebComponent {
	static url = import.meta.url;
	static styles = {
		transaction: './transaction-detail-page.css',
	};
	static stores = {
		router: routerStore,
	};
	static state = {
		txId: '',
		transaction: null,
		fields: [],
		loading: false,
		error: '',
	};
	previousId = '';
	/* Bumps on every load start — stale responses from a prior id never land. */
	loadSeq = 0;
	/*
	 * Route-driven, not pushed. Every page component stays MOUNTED (the shell
	 * hides inactive ones with CSS), so the guard on the router store's
	 * `activeView` is what keeps this page inert while another one is showing —
	 * without it a route change anywhere would refetch here.
	 */
	onConnect() {
		/* immediate: true so a late connect (after router.prime) still loads the
		   already-published /tx/:id/ — without it the first paint can miss the
		   route if the store write landed before this observer existed. */
		this.observeStore('router', [
			'activeView',
			'params',
		], this.handleRoute, {
			immediate: true,
		});
	}
	handleRoute() {
		if (this.stores.router.activeView !== 'transaction') {
			return;
		}
		const id = this.stores.router.params?.id;
		if (id) {
			this.setTxId(id);
		}
	}
	setTxId(id) {
		const next = id || '';
		/* Cache hit only when we actually painted rows for this id — a prior
		   partial failure (transaction set, empty fields / dead list) must reload. */
		if (next === this.previousId && this.state.transaction && this.state.fields.length) {
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
		const seq = ++this.loadSeq;
		this.assignState({
			loading: true,
			error: '',
			transaction: null,
			fields: [],
		});
		let sdk;
		try {
			sdk = await ensureSDK();
		} catch (error) {
			if (seq !== this.loadSeq) {
				return;
			}
			this.assignState({
				loading: false,
				error: error?.message || 'SDK unavailable',
			});
			return;
		}
		if (seq !== this.loadSeq) {
			return;
		}
		if (!sdk) {
			this.assignState({
				loading: false,
				error: 'SDK unavailable',
			});
			return;
		}
		let response;
		try {
			response = await sdk.getTransaction(id);
		} catch (error) {
			if (seq !== this.loadSeq) {
				return;
			}
			this.assignState({
				loading: false,
				error: error?.message || 'Failed to load transaction',
			});
			return;
		}
		if (seq !== this.loadSeq) {
			return;
		}
		if (!response) {
			this.assignState({
				loading: false,
				error: 'Transaction not found',
			});
			return;
		}
		const transaction = response.transaction ?? response;
		const fields = buildFields(transaction);
		this.assignState({
			loading: false,
			transaction,
			fields,
		});
		/* If the list spot missed the bus write (install race / flush skip), force
		   a keyed re-diff once the DOM has settled this assignState. */
		this.queueListRefresh(seq);
	}
	queueListRefresh(seq) {
		queueMicrotask(() => {
			if (seq !== this.loadSeq || !this.state.fields.length) {
				return;
			}
			const handle = this.list('fields');
			const spot = handle?.spot;
			if (!spot) {
				return;
			}
			/* DOM still empty while state has rows → re-diff. */
			if (!spot.element?.childElementCount) {
				spot.refresh(null);
			}
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
	/* Status line for the non-grid states — empty string when the field grid is live. */
	statusMessage() {
		if (this.state.loading) {
			return 'Loading transaction…';
		}
		if (this.state.error) {
			return this.state.error;
		}
		if (!this.state.fields.length) {
			return 'Transaction not found.';
		}
		return '';
	}
	/* Paint the grid only when rows exist — not merely when `transaction` is set. */
	hasGrid() {
		return this.state.fields.length > 0 && !this.state.loading && !this.state.error;
	}
	/* Inverse of hasGrid — ?hidden needs a bare method/fn, not `!this.hasGrid`. */
	hideGrid() {
		return !this.hasGrid();
	}
	statusClass() {
		return this.state.error ? 'td-empty td-error' : 'td-empty';
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
	render() {
		/*
		 * Status + grid host are STABLE in the main template. The list lives on
		 * an INNER `.td-grid` so `?hidden` never sits on the list's own element
		 * (elided list spots own their host — toggling hidden on that host mixed
		 * attr + list ownership). No custom elements in the body — only light
		 * html rows — so CE upgrade timing cannot empty the grid.
		 */
		this.html`
			<div class="td-shell">
				<header class="td-header">
					<div class="td-title-block">
						<ui-icon class="td-title-icon" .state.name=${'receipt'} .state.size=${'md'}></ui-icon>
						<span class="td-title">// TRANSACTION DETAIL</span>
					</div>
					<button class="td-copy" @click=${this.handleCopyId} tooltip="Copy transaction ID">${this.txIdDisplay}</button>
				</header>
				<div class=${this.statusClass} ?hidden=${this.hasGrid}>${this.statusMessage}</div>
				<div class="td-grid-host" ?hidden=${this.hideGrid}>
					<div class="td-grid">${this.list('fields', this.fieldRow)}</div>
				</div>
			</div>
		`;
	}
}
customElements.define('transaction-detail-page', TransactionDetailPage);
