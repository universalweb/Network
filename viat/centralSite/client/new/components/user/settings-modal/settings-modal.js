import '../../global/modal/modal.js';
import VIATClientSDK from 'viat';
import { WebComponent } from '../../core/index.js';
const SECTIONS = [
	{
		id: 'profile',
		label: 'PROFILE',
	},
	{
		id: 'wallet',
		label: 'WALLET',
	},
];
function base64ToBytes(text) {
	const cleaned = (text || '').trim().replace(/\s+/g, '');
	if (!cleaned) {
		throw new Error('Paste a base64-encoded wallet string');
	}
	const binary = atob(cleaned);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		out[i] = binary.charCodeAt(i);
	}
	return out;
}
export class SettingsModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		settingsModal: './settings-modal.css',
	};
	static state = {
		activeSection: 'profile',
		displayName: '',
		handle: '',
		walletBase64: '',
		walletPassword: '',
		walletStatusTone: '',
		walletStatusMessage: '',
		busy: false,
	};
	open() {
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	// TODO: REFACTOR USE STATE AND CUSTOM EVENTS TO DECOUPLE FROM VIAT CLIENT LOGIC. THIS COMPONENT SHOULD FOCUS ON UI AND EMIT EVENTS WITH USER INPUT, NOT HANDLE DECODING OR INTERACTING WITH THE CLIENT DIRECTLY. NO READING STATE DATA FROM A BUTTON CLICK HANDLER, INSTEAD JUST EMIT AN EVENT WITH THE RELEVANT DATA AND LET THE PARENT COMPONENT OR APP LOGIC HANDLE IT. TURN THE TABS INTO A REUSABLE COMPONENT AND DECOUPLE THE RENDERING OF EACH SECTION INTO SEPARATE COMPONENTS AS WELL TO SIMPLIFY THIS MAIN SETTINGS MODAL COMPONENT.
	handleSelectSection(domEvent) {
		const button = domEvent.target?.closest?.('.sm-nav-item');
		const id = button?.dataset?.section;
		if (id) {
			this.state.activeSection = id;
		}
	}
	async handleLoadWallet() {
		if (this.state.busy) {
			return;
		}
		this.state.busy = true;
		this.state.walletStatusTone = 'info';
		this.state.walletStatusMessage = 'Decoding wallet…';
		let bytes;
		try {
			bytes = base64ToBytes(this.state.walletBase64);
		} catch (decodeErr) {
			this.state.busy = false;
			this.state.walletStatusTone = 'error';
			this.state.walletStatusMessage = decodeErr?.message || 'Invalid base64';
			return;
		}
		const client = await VIATClientSDK.create();
		const pkg = await client.deserializeWalletPackage(bytes, 'cbor').catch((decodeErr) => {
			return decodeErr;
		});
		if (pkg instanceof Error) {
			this.state.busy = false;
			this.state.walletStatusTone = 'error';
			this.state.walletStatusMessage = pkg.message || 'Could not decode CBOR payload';
			return;
		}
		const imported = await client.importWalletPackage(pkg, this.state.walletPassword).catch((importErr) => {
			return importErr;
		});
		this.state.busy = false;
		if (imported instanceof Error) {
			this.state.walletStatusTone = 'error';
			this.state.walletStatusMessage = imported.message || 'Decryption failed';
			return;
		}
		this.state.walletStatusTone = 'success';
		this.state.walletStatusMessage = 'Wallet loaded successfully.';
		this.emit('wallet:loaded', {
			meta: imported.meta,
			address: imported.meta?.address,
		});
	}
	renderNav() {
		const items = SECTIONS.map((section) => {
			const active = section.id === this.state.activeSection ? ' is-active' : '';
			return `<button class="sm-nav-item${active}" data-section="${section.id}">${section.label}</button>`;
		}).join('');
		return this.htmlElement `
			<nav class="sm-nav" @click=${this.handleSelectSection}>${items}</nav>
		`;
	}
	renderWalletSection() {
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">WALLET</span>
					<span class="sm-section-title">// LOAD EXISTING WALLET</span>
				</header>
				<p class="sm-copy">Paste a base64-encoded CBOR wallet package to restore an existing Viat wallet. The package will be decrypted locally with your password — nothing is sent to a remote server.</p>
				<label class="sm-field">
					<span class="sm-label">WALLET (base64)</span>
					<textarea
						class="sm-textarea"
						rows="6"
						spellcheck="false"
						autocomplete="off"
						placeholder="paste base64-encoded wallet string…"
						$value="walletBase64"></textarea>
				</label>
				<label class="sm-field">
					<span class="sm-label">PASSWORD</span>
					<input
						type="password"
						class="sm-input"
						spellcheck="false"
						autocomplete="new-password"
						placeholder="wallet password"
						$value="walletPassword">
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleLoadWallet}>
						${() => {
							return (this.state.busy ? 'LOADING…' : 'LOAD WALLET');
						}}
					</button>
				</div>
				<div class="${() => {
					return `sm-status tone-${this.state.walletStatusTone || 'idle'}${this.state.walletStatusMessage ? ' is-visible' : ''}`;
				}}">${this.state.walletStatusMessage}</div>
			</div>
		`;
	}
	renderProfileSection() {
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">PROFILE</span>
					<span class="sm-section-title">// IDENTITY</span>
				</header>
				<p class="sm-copy">How you appear in the wallet UI. Stored locally — never broadcast on-chain.</p>
				<label class="sm-field">
					<span class="sm-label">DISPLAY NAME</span>
					<input
						type="text"
						class="sm-input"
						spellcheck="false"
						autocomplete="off"
						placeholder="e.g. Operator"
						$value="displayName">
				</label>
				<label class="sm-field">
					<span class="sm-label">HANDLE</span>
					<input
						type="text"
						class="sm-input"
						spellcheck="false"
						autocomplete="off"
						placeholder="e.g. @operator"
						$value="handle">
				</label>
			</div>
		`;
	}
	renderActiveSection() {
		if (this.state.activeSection === 'wallet') {
			return this.renderWalletSection();
		}
		if (this.state.activeSection === 'profile') {
			return this.renderProfileSection();
		}
		return this.htmlElement `<div class="sm-section"></div>`;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-modal #modal style="--ui-modal-max-width: min(1120px, calc(100vw - 48px)); --ui-modal-max-height: calc(100vh - 64px)">
				<div class="sm-shell">
					${this.renderNav}
					<section class="sm-body">${this.renderActiveSection}</section>
					<button class="sm-close" @click=${this.close} aria-label="Close">×</button>
				</div>
			</ui-modal>
		`;
	}
}
customElements.define('settings-modal', SettingsModal);
