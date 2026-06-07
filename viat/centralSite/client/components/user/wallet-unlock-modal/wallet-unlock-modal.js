import '../../global/modal/modal.js';
import { WebComponent, classList } from '../../core/index.js';
// `<wallet-unlock-modal>` — small password prompt that appears when the user
// triggers an action requiring a private key (sign / send) while only the
// public metadata of a saved profile is loaded. AppView calls `openFor(...)`
// with the active profile name + a human-friendly reason; on submit we emit
// `wallet:unlock` and AppView decrypts the package, swaps the SDK over, and
// re-fires the pending action. AppView calls `handleSuccess()` /
// `handleFailure(message)` back into us once that round-trip resolves.
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
	static styles = {
		modalChrome: '../shared/modal-chrome.css',
	};
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
		/*
		 * Configure the composed <ui-modal> through its OWN assignState (a shallow
		 * MERGE that preserves its chain defaults) — never a reactive `.state=`
		 * binding. A `.state=${literal}` here re-applies on the parent re-render
		 * this very openFor triggers and routes through the child's `set state` →
		 * replaceState, REPLACING its STATE with only the passed keys. That wipes
		 * ui-modal's own defaults — chiefly `classes: Set(['modal'])`, which both
		 * styles the dialog (without it the native <dialog> renders bare white and
		 * top-anchored) and is dereferenced in handleClose (`classes.delete(...)`
		 * throws once gone). modal:true / open:false are already ui-modal defaults;
		 * only these two need overriding.
		 */
		const modal = this.refs.modal;
		if (modal) {
			modal.assignState({
				showClose: true,
				closeOnBackdrop: false,
			});
			modal.open();
		}
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
	handleUnlock() {
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
	}
	handleCancel() {
		this.emit('wallet:unlock-cancel', {
			profileName: this.state.profileName,
		});
		this.close();
	}
	handleKeyDown(domEvent) {
		if (domEvent.key === 'Enter') {
			domEvent.preventDefault();
			this.handleUnlock();
		}
	}
	render() {
		this.html `
			<ui-modal #modal style="--ui-modal-max-width: 460px">
				<div class="modal-shell">
					<header class="modal-head">
						<span class="modal-head-id">⩝VIAT</span>
						<span class="modal-head-title">// UNLOCK WALLET</span>
					</header>
					<p class="modal-copy">${() => {
						return this.state.reason || 'This action requires your wallet password to decrypt the private keys.';
					}}</p>
					<div class="modal-meta">
						<div class="modal-meta-row">
							<span class="modal-meta-key">PROFILE</span>
							<span class="modal-meta-val">${() => {
								return this.state.profileName || '—';
							}}</span>
						</div>
						<div class="modal-meta-row">
							<span class="modal-meta-key">ADDRESS</span>
							<span class="modal-meta-val" title="${this.state.address}">${() => {
								return shortAddress(this.state.address);
							}}</span>
						</div>
					</div>
					<label class="field">
						<span class="field-label">PASSWORD</span>
						<input #password
							type="password"
							spellcheck="false"
							autocomplete="current-password"
							placeholder="wallet password"
							$value="password"
							@keydown=${this.handleKeyDown}>
					</label>
					<div class=${classList('modal-error', () => {
						return (this.state.error ? 'is-visible' : '');
					})}>${this.state.error}</div>
					<div class="modal-actions">
						<button type="button" class="btn-primary" ?disabled=${this.state.busy} @click=${this.handleUnlock}>${() => {
							return (this.state.busy ? 'UNLOCKING…' : 'UNLOCK');
						}}</button>
						<button type="button" @click=${this.handleCancel}>CANCEL</button>
					</div>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('wallet-unlock-modal', WalletUnlockModal);
