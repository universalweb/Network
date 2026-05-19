import '../../global/modal/modal.js';
import { WebComponent, classList } from '../../core/index.js';
// `<sign-data-modal>` — arbitrary-data signing dialog. Visuals all flow
// from the shared `.dialog-*` primitives in `core/styles/base.css`; this
// component carries zero bespoke CSS.
export class SignDataModal extends WebComponent {
	static url = import.meta.url;
	static state = {
		inputData: '',
		signatureOutput: '',
		busy: false,
		statusTone: '',
		statusMessage: '',
	};
	onConnect() {
		this.delegate('sign:result', this.handleSignResult);
		this.delegate('sign:error', this.handleSignError);
	}
	open() {
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	setStatus(tone, message) {
		this.assignState({
			statusTone: tone,
			statusMessage: message,
		});
	}
	handleSign() {
		if (this.state.busy) {
			return;
		}
		const data = this.state.inputData;
		if (!data) {
			this.setStatus('error', 'Provide data to sign.');
			return;
		}
		this.state.busy = true;
		this.state.signatureOutput = '';
		this.setStatus('info', 'Signing…');
		this.emit('sign:execute', {
			data,
		});
	}
	handleSignResult(domEvent) {
		const signature = domEvent.detail?.data?.signature ?? '';
		this.assignState({
			busy: false,
			signatureOutput: signature,
			statusTone: 'success',
			statusMessage: 'Signature ready. Click the output to copy.',
		});
	}
	handleSignError(domEvent) {
		const message = domEvent.detail?.data?.error || 'Sign failed.';
		this.assignState({
			busy: false,
			statusTone: 'error',
			statusMessage: message,
		});
	}
	async handleCopySignature() {
		const text = this.state.signatureOutput;
		if (!text) {
			return;
		}
		try {
			await globalThis.navigator?.clipboard?.writeText?.(text);
			this.emit('notify', {
				itemType: 'copy',
				message: 'Signature copied to clipboard.',
				title: 'Signature Copied',
			});
		} catch (clipboardError) {
			this.emit('notify', {
				itemType: 'error',
				message: 'Could not copy signature.',
				title: 'Copy Failed',
			});
		}
	}
	handleClear() {
		this.assignState({
			inputData: '',
			signatureOutput: '',
			statusTone: '',
			statusMessage: '',
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-modal #modal .state=${{
				modal: true,
				open: false,
				showClose: true,
				showMaximize: true,
			}} style="--ui-modal-max-width: min(640px, calc(100vw - 32px))">
				<div class="dialog-shell">
					<header class="dialog-head">
						<span class="dialog-head-id">SIGN</span>
						<span class="dialog-head-title">// ARBITRARY DATA</span>
					</header>
					<div class="dialog-warning">
						<div class="dialog-warning-head">⚠ Security warning</div>
						<p class="dialog-warning-body">Signing arbitrary data with your primary ed25519 key proves you control this wallet. A malicious site can ask you to sign challenges that grant access to other systems or authorize off-chain actions. <strong>Only sign payloads you understand and trust.</strong></p>
					</div>
					<label class="dialog-field">
						<span class="dialog-label">DATA TO SIGN</span>
						<textarea
							class="dialog-textarea"
							rows="6"
							spellcheck="false"
							autocomplete="off"
							placeholder="enter the exact bytes/string you want to sign…"
							$value="inputData"></textarea>
					</label>
					<div class="dialog-actions">
						<button class="dialog-btn dialog-btn-primary" ?disabled=${() => this.state.busy} @click=${this.handleSign}>
							${() => (this.state.busy ? 'SIGNING…' : 'SIGN WITH PRIMARY KEY')}
						</button>
						<button class="dialog-btn" ?disabled=${() => this.state.busy} @click=${this.handleClear}>CLEAR</button>
					</div>
					<label class="dialog-field">
						<span class="dialog-label">SIGNATURE (BASE64) — CLICK TO COPY</span>
						<textarea
							class="dialog-textarea is-copyable"
							rows="4"
							spellcheck="false"
							autocomplete="off"
							readonly
							placeholder="signature output appears here after signing"
							.value=${() => this.state.signatureOutput}
							@click=${this.handleCopySignature}></textarea>
					</label>
					<div class=${classList('dialog-status', () => `tone-${this.state.statusTone || 'idle'}`, () => (this.state.statusMessage ? 'is-visible' : ''))}>${() => this.state.statusMessage}</div>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('sign-data-modal', SignDataModal);
