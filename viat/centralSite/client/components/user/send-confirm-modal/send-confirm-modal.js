import '../../global/modal/modal.js';
import { WebComponent, classList } from '../../core/index.js';
// `<send-confirm-modal>` — two-stage send dialog used by the AI flow
// (and reusable from any future call-site). The AI invokes a tool that
// calls `openFor({to, amount, reason})`; the modal then shows the
// recipient + amount as editable fields and a CONFIRM button. On
// confirm we emit `transmit` (the same event the transmit-panel uses),
// so AppView's existing handler runs the full sign-and-send-and-refresh
// pipeline — including the post-send `fetchAccountForWallet()` that
// keeps balance / totals / activity-log in sync.
function shortAddress(address) {
	const text = `${address ?? ''}`;
	if (!text) {
		return '';
	}
	if (text.length <= 24) {
		return text;
	}
	return `${text.slice(0, 14)}…${text.slice(-8)}`;
}
export class SendConfirmModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		modalChrome: '../shared/modal-chrome.css',
	};
	static state = {
		recipient: '',
		recipientFormat: 'base64',
		amount: '',
		reason: '',
		busy: false,
		error: '',
	};
	openFor(options = {}) {
		this.assignState({
			recipient: options.to ?? options.recipient ?? '',
			recipientFormat: options.recipientFormat || 'base64',
			amount: `${options.amount ?? ''}`,
			reason: options.reason ?? '',
			busy: false,
			error: '',
		});
		this.refs.modal?.open();
		requestAnimationFrame(() => {
			if (!this.state.recipient) {
				this.refs.recipient?.focus?.();
			} else if (!this.state.amount) {
				this.refs.amount?.focus?.();
			} else {
				this.refs.confirm?.focus?.();
			}
		});
	}
	close() {
		this.refs.modal?.close();
		this.assignState({
			busy: false,
			error: '',
		});
	}
	// Called by AppView after the `transmit:result` event resolves so we
	// can close on success / surface the error on failure without the
	// modal having to subscribe to the result event itself (cleaner: the
	// orchestrator owns the lifecycle).
	handleResult(payload = {}) {
		if (payload?.ok) {
			this.close();
			return;
		}
		this.assignState({
			busy: false,
			error: payload?.error || 'Transmission failed — try again.',
		});
	}
	handleConfirm = () => {
		if (this.state.busy) {
			return;
		}
		const recipient = `${this.state.recipient ?? ''}`.trim();
		const amount = `${this.state.amount ?? ''}`.trim();
		if (!recipient) {
			this.assignState({
				error: 'Provide a recipient address.',
			});
			this.refs.recipient?.focus?.();
			return;
		}
		if (!amount) {
			this.assignState({
				error: 'Provide an amount to send.',
			});
			this.refs.amount?.focus?.();
			return;
		}
		this.assignState({
			busy: true,
			error: '',
		});
		// `send-confirm:execute` is observed by AppView, which forwards to
		// the standard `transmit` event so the existing handler runs
		// (signature → API → notify → fetchAccountForWallet). Bouncing
		// through AppView lets it correlate the resulting
		// `transmit:result` back into our `handleResult` here.
		this.emit('send-confirm:execute', {
			recipient,
			recipientFormat: this.state.recipientFormat,
			amount,
		});
	};
	handleCancel = () => {
		this.emit('send-confirm:cancel', {});
		this.close();
	};
	handleKeyDown = (domEvent) => {
		if (domEvent.key === 'Enter' && !domEvent.shiftKey) {
			domEvent.preventDefault();
			this.handleConfirm();
		}
	};
	render() {
		this.html `
			<ui-modal #modal .state=${{
				modal: true,
				open: false,
				showClose: true,
				closeOnBackdrop: false,
			}} style="--ui-modal-max-width: 520px">
				<div class="modal-shell">
					<header class="modal-head">
						<span class="modal-head-id">SEND</span>
						<span class="modal-head-title">// CONFIRM TRANSACTION</span>
					</header>
					<p class="modal-copy">${() => {
						return this.state.reason || 'Review the recipient and amount, then confirm to sign and broadcast.';
					}}</p>
					<div class="modal-meta">
						<div class="modal-meta-row">
							<span class="modal-meta-key">RECIPIENT</span>
							<span class="modal-meta-val" title="${this.state.recipient}">${() => {
								return shortAddress(this.state.recipient) || '—';
							}}</span>
						</div>
						<div class="modal-meta-row">
							<span class="modal-meta-key">AMOUNT</span>
							<span class="modal-meta-val">${() => {
								return this.state.amount || '0';
							}} ⩝</span>
						</div>
					</div>
					<label class="field">
						<span class="field-label">RECIPIENT ADDRESS</span>
						<input #recipient
							type="text"
							spellcheck="false"
							autocomplete="off"
							placeholder="base64 wallet address"
							$value="recipient"
							@keydown=${this.handleKeyDown}>
					</label>
					<label class="field">
						<span class="field-label">AMOUNT (VIAT)</span>
						<input #amount
							type="text"
							spellcheck="false"
							autocomplete="off"
							inputmode="decimal"
							placeholder="0.00"
							$value="amount"
							@keydown=${this.handleKeyDown}>
					</label>
					<div class=${classList('modal-error', () => {
						return (this.state.error ? 'is-visible' : '');
					})}>${this.state.error}</div>
					<div class="modal-actions">
						<button #confirm type="button" class="btn-primary" ?disabled=${this.state.busy} @click=${this.handleConfirm}>${() => {
							return (this.state.busy ? 'SENDING…' : 'CONFIRM & SEND');
						}}</button>
						<button type="button" ?disabled=${this.state.busy} @click=${this.handleCancel}>CANCEL</button>
					</div>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('send-confirm-modal', SendConfirmModal);
