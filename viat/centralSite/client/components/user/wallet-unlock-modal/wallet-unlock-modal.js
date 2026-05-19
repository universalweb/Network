import '../../global/modal/modal.js';
import { WebComponent, classList } from '../../core/index.js';
// `<wallet-unlock-modal>` — small password prompt that appears when the user
// triggers an action requiring a private key (sign / send) while only the
// public metadata of a saved profile is loaded. AppView calls `openFor(...)`
// with the active profile name + a human-friendly reason; on submit we emit
// `wallet:unlock` and AppView decrypts the package, swaps the SDK over, and
// re-fires the pending action. AppView calls `handleSuccess()` /
// `handleFailure(message)` back into us once that round-trip resolves.
// Visuals are inherited from the shared `.dialog-*` primitives in
// `core/styles/base.css` — this component carries zero bespoke CSS.
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
export class WalletUnlockModal extends WebComponent {
	static url = import.meta.url;
	static state = {
		profileName: '',
		address: '',
		reason: '',
		password: '',
		busy: false,
		error: '',
	};
	openFor(options = {}) {
		this.assignState({
			profileName: options.profileName ?? '',
			address: options.address ?? '',
			reason: options.reason ?? '',
			password: '',
			busy: false,
			error: '',
		});
		this.refs.modal?.open();
		requestAnimationFrame(() => {
			this.refs.password?.focus?.();
		});
	}
	close() {
		this.refs.modal?.close();
		this.assignState({
			password: '',
			busy: false,
			error: '',
		});
	}
	handleSuccess() {
		this.close();
	}
	handleFailure(message) {
		this.assignState({
			busy: false,
			error: message || 'Wrong password — try again.',
		});
		requestAnimationFrame(() => {
			this.refs.password?.focus?.();
			this.refs.password?.select?.();
		});
	}
	handleUnlock = () => {
		if (this.state.busy) {
			return;
		}
		if (!this.state.password) {
			this.assignState({
				error: 'Enter your wallet password to unlock.',
			});
			return;
		}
		this.assignState({
			busy: true,
			error: '',
		});
		this.emit('wallet:unlock', {
			profileName: this.state.profileName,
			password: this.state.password,
		});
	};
	handleCancel = () => {
		this.emit('wallet:unlock-cancel', {
			profileName: this.state.profileName,
		});
		this.close();
	};
	handleKeyDown = (domEvent) => {
		if (domEvent.key === 'Enter') {
			domEvent.preventDefault();
			this.handleUnlock();
		}
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-modal #modal .state=${{
				modal: true,
				open: false,
				showClose: true,
				closeOnBackdrop: false,
			}} style="--ui-modal-max-width: 460px">
				<div class="dialog-shell">
					<header class="dialog-head">
						<span class="dialog-head-id">⩝VIAT</span>
						<span class="dialog-head-title">// UNLOCK WALLET</span>
					</header>
					<p class="dialog-copy">${() => {
						return this.state.reason || 'This action requires your wallet password to decrypt the private keys.';
					}}</p>
					<div class="dialog-meta">
						<div class="dialog-meta-row">
							<span class="dialog-meta-key">PROFILE</span>
							<span class="dialog-meta-val">${() => this.state.profileName || '—'}</span>
						</div>
						<div class="dialog-meta-row">
							<span class="dialog-meta-key">ADDRESS</span>
							<span class="dialog-meta-val" title="${() => this.state.address}">${() => shortAddress(this.state.address)}</span>
						</div>
					</div>
					<label class="dialog-field">
						<span class="dialog-label">PASSWORD</span>
						<input #password
							type="password"
							class="dialog-input"
							spellcheck="false"
							autocomplete="current-password"
							placeholder="wallet password"
							$value="password"
							@keydown=${this.handleKeyDown}>
					</label>
					<div class=${classList('dialog-error', () => (this.state.error ? 'is-visible' : ''))}>${() => this.state.error}</div>
					<div class="dialog-actions">
						<button type="button" class="dialog-btn dialog-btn-primary" ?disabled=${() => this.state.busy} @click=${this.handleUnlock}>${() => (this.state.busy ? 'UNLOCKING…' : 'UNLOCK')}</button>
						<button type="button" class="dialog-btn" @click=${this.handleCancel}>CANCEL</button>
					</div>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('wallet-unlock-modal', WalletUnlockModal);
