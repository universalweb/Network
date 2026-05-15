import '../../global/modal/modal.js';
import { WebComponent } from '../../core/index.js';
const SECTIONS = [
	{
		id: 'profile',
		label: 'PROFILE',
	},
	{
		id: 'wallet-view',
		label: 'WALLET',
	},
	{
		id: 'wallet-create',
		label: 'CREATE',
	},
	{
		id: 'wallet-save',
		label: 'SAVE',
	},
	{
		id: 'wallet-load',
		label: 'LOAD',
	},
];
export class SettingsModal extends WebComponent {
	static url = import.meta.url;
	static styles = {
		settingsModal: './settings-modal.css',
	};
	static state = {
		activeSection: 'profile',
		walletLabel: '',
		createPassword: '',
		savePassword: '',
		loadBase64: '',
		loadPassword: '',
		saveResult: '',
		statusTone: '',
		statusMessage: '',
		busy: false,
	};
	onConnect() {
		this.delegate('wallet:saved', this.handleWalletSaved);
		this.delegate('wallet:state', this.handleWalletState);
	}
	open() {
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	getWalletInfo() {
		return this.globalState.wallet ?? {};
	}
	getProfile() {
		return this.globalState.profile ?? {};
	}
	setStatus(tone, message) {
		this.assignState({
			statusTone: tone,
			statusMessage: message,
		});
	}
	handleSelectSection(domEvent) {
		const button = domEvent.target?.closest?.('.sm-nav-item');
		const id = button?.dataset?.section;
		if (id) {
			this.state.activeSection = id;
			this.setStatus('', '');
		}
	}
	handleWalletSaved(domEvent) {
		this.assignState({
			busy: false,
			saveResult: domEvent.detail?.data?.base64 ?? '',
			statusTone: 'success',
			statusMessage: 'Wallet saved. Copy the base64 string below or download it.',
		});
	}
	handleWalletState(domEvent) {
		const phase = domEvent.detail?.data?.phase;
		if (phase === 'created') {
			this.setStatus('success', 'Wallet generated.');
		} else if (phase === 'loaded') {
			this.setStatus('success', 'Wallet loaded successfully.');
		}
		this.state.busy = false;
	}
	async handleProfileSave() {
		const profile = this.getProfile();
		const next = {
			displayName: this.refs.displayName?.value ?? profile.displayName ?? '',
			handle: this.refs.handle?.value ?? profile.handle ?? '',
		};
		this.emit('profile:update', {
			meta: next,
		});
		this.setStatus('success', 'Profile updated.');
	}
	handleCreateWallet() {
		if (this.state.busy) {
			return;
		}
		if (!this.state.createPassword) {
			this.setStatus('error', 'Set a password before creating the wallet.');
			return;
		}
		this.state.busy = true;
		this.setStatus('info', 'Generating wallet…');
		this.emit('wallet:create', {
			label: this.state.walletLabel,
			profileMeta: this.getProfile(),
		});
	}
	handleSaveWallet() {
		if (this.state.busy) {
			return;
		}
		if (!this.state.savePassword) {
			this.setStatus('error', 'Provide a password to encrypt the wallet.');
			return;
		}
		if (!this.getWalletInfo().hasWallet) {
			this.setStatus('error', 'No wallet to save. Create one first.');
			return;
		}
		this.state.busy = true;
		this.state.saveResult = '';
		this.setStatus('info', 'Encrypting wallet…');
		this.emit('wallet:save', {
			password: this.state.savePassword,
			label: this.state.walletLabel,
			profileMeta: this.getProfile(),
		});
	}
	handleLoadWallet() {
		if (this.state.busy) {
			return;
		}
		if (!this.state.loadBase64 || !this.state.loadPassword) {
			this.setStatus('error', 'Paste the base64 wallet and enter the password.');
			return;
		}
		this.state.busy = true;
		this.setStatus('info', 'Decoding wallet…');
		this.emit('wallet:load', {
			base64: this.state.loadBase64,
			password: this.state.loadPassword,
		});
	}
	handleCopySaveResult() {
		const text = this.state.saveResult;
		if (!text) {
			return;
		}
		globalThis.navigator?.clipboard?.writeText?.(text).then(() => {
			this.setStatus('success', 'Copied to clipboard.');
		}).catch(() => {
			this.setStatus('error', 'Could not copy.');
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
	renderStatus() {
		return this.htmlElement `
			<div class="${() => {
				return `sm-status tone-${this.state.statusTone || 'idle'}${this.state.statusMessage ? ' is-visible' : ''}`;
			}}">${() => this.state.statusMessage}</div>
		`;
	}
	renderProfileSection() {
		const profile = this.getProfile();
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">PROFILE</span>
					<span class="sm-section-title">// IDENTITY</span>
				</header>
				<p class="sm-copy">Profile metadata is stored locally and embedded in the encrypted wallet package on save, so it travels with the wallet.</p>
				<label class="sm-field">
					<span class="sm-label">DISPLAY NAME</span>
					<input
						type="text"
						class="sm-input"
						#displayName
						spellcheck="false"
						autocomplete="off"
						placeholder="e.g. Operator"
						value="${profile.displayName ?? ''}">
				</label>
				<label class="sm-field">
					<span class="sm-label">HANDLE</span>
					<input
						type="text"
						class="sm-input"
						#handle
						spellcheck="false"
						autocomplete="off"
						placeholder="e.g. @operator"
						value="${profile.handle ?? ''}">
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" @click=${this.handleProfileSave}>SAVE PROFILE</button>
				</div>
				${this.renderStatus}
			</div>
		`;
	}
	renderWalletViewSection() {
		const info = this.getWalletInfo();
		const rows = [
			['Address', info.address],
			['Public key', info.publicKey],
			['Trapdoor public key', info.trapdoorPublicKey],
			['Trapdoor hash', info.trapdoorHash],
			['Label', info.label],
			['Saved at', info.walletSavedAt],
		];
		const rowItems = rows.map(([label, value]) => {
			const display = value ? value : '—';
			return `<div class="sm-field"><span class="sm-label">${label}</span><div class="sm-readout">${display}</div></div>`;
		}).join('');
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">WALLET</span>
					<span class="sm-section-title">// PROPERTIES</span>
				</header>
				<p class="sm-copy">Public projection of the active wallet. Private keys and seeds stay in memory on the app instance and are never written to global state.</p>
				${rowItems}
			</div>
		`;
	}
	renderWalletCreateSection() {
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">CREATE</span>
					<span class="sm-section-title">// NEW SITE WALLET</span>
				</header>
				<p class="sm-copy">Generate a new HD site wallet with ed25519 + ML-DSA trapdoor keypairs. The encryption password is required when saving the wallet package later.</p>
				<label class="sm-field">
					<span class="sm-label">WALLET LABEL</span>
					<input
						type="text"
						class="sm-input"
						spellcheck="false"
						autocomplete="off"
						placeholder="optional — e.g. primary"
						$value="walletLabel">
				</label>
				<label class="sm-field">
					<span class="sm-label">ENCRYPTION PASSWORD</span>
					<input
						type="password"
						class="sm-input"
						spellcheck="false"
						autocomplete="new-password"
						placeholder="store this somewhere safe"
						$value="createPassword">
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleCreateWallet}>
						${() => (this.state.busy ? 'WORKING…' : 'GENERATE WALLET')}
					</button>
				</div>
				${this.renderStatus}
			</div>
		`;
	}
	renderWalletSaveSection() {
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">SAVE</span>
					<span class="sm-section-title">// EXPORT WALLET (BASE64 CBOR)</span>
				</header>
				<p class="sm-copy">Encrypts the current wallet seeds + HD state with your password, encodes as CBOR, and presents the result as a base64 string. Store this somewhere safe.</p>
				<label class="sm-field">
					<span class="sm-label">PASSWORD</span>
					<input
						type="password"
						class="sm-input"
						spellcheck="false"
						autocomplete="new-password"
						placeholder="encryption password"
						$value="savePassword">
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleSaveWallet}>
						${() => (this.state.busy ? 'ENCRYPTING…' : 'EXPORT BASE64')}
					</button>
					<button class="sm-btn" ?disabled=${() => !this.state.saveResult} @click=${this.handleCopySaveResult}>COPY</button>
				</div>
				<label class="sm-field">
					<span class="sm-label">BASE64 CBOR PACKAGE</span>
					<textarea
						class="sm-textarea"
						rows="6"
						spellcheck="false"
						autocomplete="off"
						readonly
						placeholder="encrypted wallet output appears here after save"
						.value=${() => this.state.saveResult}></textarea>
				</label>
				${this.renderStatus}
			</div>
		`;
	}
	renderWalletLoadSection() {
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">LOAD</span>
					<span class="sm-section-title">// IMPORT EXISTING WALLET</span>
				</header>
				<p class="sm-copy">Paste a base64-encoded CBOR wallet package and the password used to encrypt it. The wallet is decrypted locally; nothing is sent to a server.</p>
				<label class="sm-field">
					<span class="sm-label">WALLET (base64)</span>
					<textarea
						class="sm-textarea"
						rows="6"
						spellcheck="false"
						autocomplete="off"
						placeholder="paste base64-encoded wallet string…"
						$value="loadBase64"></textarea>
				</label>
				<label class="sm-field">
					<span class="sm-label">PASSWORD</span>
					<input
						type="password"
						class="sm-input"
						spellcheck="false"
						autocomplete="new-password"
						placeholder="wallet password"
						$value="loadPassword">
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleLoadWallet}>
						${() => (this.state.busy ? 'LOADING…' : 'LOAD WALLET')}
					</button>
				</div>
				${this.renderStatus}
			</div>
		`;
	}
	renderActiveSection() {
		switch (this.state.activeSection) {
			case 'profile':
				return this.renderProfileSection();
			case 'wallet-view':
				return this.renderWalletViewSection();
			case 'wallet-create':
				return this.renderWalletCreateSection();
			case 'wallet-save':
				return this.renderWalletSaveSection();
			case 'wallet-load':
				return this.renderWalletLoadSection();
			default:
				return this.htmlElement `<div class="sm-section"></div>`;
		}
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
