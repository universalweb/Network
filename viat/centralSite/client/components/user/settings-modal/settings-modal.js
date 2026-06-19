import '../../global/modal/modal.js';
import '../../global/tabs/tabs.js';
import { WebComponent } from '../../core/index.js';
import { getTheme, setTheme, THEMES } from '../../global/theme-select/theme-manager.js';
const SECTIONS = [
	{
		id: 'profile',
		label: 'PROFILE',
		icon: 'user',
	},
	{
		id: 'wallet-view',
		label: 'WALLET',
		icon: 'wallet',
	},
	{
		id: 'wallet-create',
		label: 'CREATE',
		icon: 'plus-circle',
	},
	{
		id: 'wallet-save',
		label: 'SAVE',
		icon: 'save',
	},
	{
		id: 'wallet-load',
		label: 'LOAD',
		icon: 'upload',
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
		saveName: '',
		savePassword: '',
		loadBase64: '',
		loadPassword: '',
		selectedProfile: '',
		saveResult: '',
		statusTone: '',
		statusMessage: '',
		busy: false,
		pendingCreate: false,
		displayName: '',
		handle: '',
		themeId: getTheme(),
	};
	onConnect() {
		this.delegate('wallet:saved', this.handleWalletSaved);
		this.delegate('wallet:saved-local', this.handleWalletSavedLocal);
		this.delegate('wallet:deleted-local', this.handleWalletDeletedLocal);
		this.delegate('wallet:state', this.handleWalletState);
		this.observeGlobal('profile', (nextProfile) => {
			this.syncProfileDrafts(nextProfile ?? {});
		});
		this.syncProfileDrafts(this.getProfile());
	}
	syncProfileDrafts(profile) {
		const nextDisplay = profile.displayName ?? '';
		const nextHandle = profile.handle ?? '';
		const nextTheme = profile.theme ?? getTheme();
		if (this.state.displayName !== nextDisplay) {
			this.state.displayName = nextDisplay;
		}
		if (this.state.handle !== nextHandle) {
			this.state.handle = nextHandle;
		}
		if (this.state.themeId !== nextTheme) {
			this.state.themeId = nextTheme;
		}
		// Pre-select the most-recently-used profile in the LOAD form when
		// the user hasn't already chosen something themselves. App.js
		// publishes `profile.lastSelected` on boot (and after auto-load
		// attempts) — without this, password-protected profiles forced the
		// user to dig through the dropdown every visit.
		const lastSelected = profile.lastSelected ?? '';
		if (lastSelected && !this.state.selectedProfile) {
			this.state.selectedProfile = lastSelected;
		}
	}
	open() {
		this.refs.modal?.open();
	}
	close() {
		this.refs.modal?.close();
	}
	getWalletInfo() {
		return this.global.wallet ?? {};
	}
	getProfile() {
		return this.global.profile ?? {};
	}
	setStatus(tone, message) {
		this.assignState({
			statusTone: tone,
			statusMessage: message,
		});
	}
	notify(message, itemType = 'default') {
		this.emit('notify', {
			message,
			itemType,
		});
	}
	handleTabChange(domEvent) {
		const id = domEvent.detail?.data?.active ?? domEvent.detail?.active;
		if (id && id !== this.state.activeSection) {
			this.state.activeSection = id;
			this.setStatus('', '');
		}
	}
	async handleCopy(domEvent) {
		const target = domEvent.target?.closest?.('[data-copy]');
		const value = target?.dataset?.copy;
		if (!value) {
			return;
		}
		try {
			await globalThis.navigator?.clipboard?.writeText?.(value);
			this.notify('Copied to clipboard');
		} catch {
			this.notify('Could not copy');
		}
	}
	async handleCopySaveResult() {
		const text = this.state.saveResult;
		if (!text) {
			return;
		}
		try {
			await globalThis.navigator?.clipboard?.writeText?.(text);
			this.notify('Copied wallet payload to clipboard');
		} catch {
			this.notify('Could not copy');
		}
	}
	handleWalletSaved(domEvent) {
		this.assignState({
			busy: false,
			saveResult: domEvent.detail?.data?.base64 ?? '',
			statusTone: 'success',
			statusMessage: 'Encrypted wallet payload ready below.',
		});
	}
	handleWalletSavedLocal(domEvent) {
		this.state.busy = false;
		const profileName = domEvent.detail?.data?.profileName ?? '';
		this.setStatus('success', `Saved as profile "${profileName}".`);
		this.notify(`Saved wallet profile "${profileName}"`);
	}
	handleWalletDeletedLocal(domEvent) {
		const profileName = domEvent.detail?.data?.profileName ?? '';
		this.notify(`Deleted wallet profile "${profileName}"`);
		if (this.state.selectedProfile === profileName) {
			this.state.selectedProfile = '';
		}
	}
	handleWalletState(domEvent) {
		const phase = domEvent.detail?.data?.phase;
		const errorMessage = domEvent.detail?.data?.error;
		if (phase === 'created') {
			this.setStatus('success', 'Wallet generated.');
		} else if (phase === 'loaded') {
			this.setStatus('success', 'Wallet loaded.');
		} else if (phase === 'error') {
			this.setStatus('error', errorMessage || 'Operation failed.');
		}
		this.state.busy = false;
	}
	handleProfileSave() {
		this.emit('profile:update', {
			meta: {
				displayName: this.state.displayName,
				handle: this.state.handle,
				theme: this.state.themeId,
			},
		});
		this.notify('Profile updated');
		this.setStatus('success', 'Profile saved.');
	}
	handleThemeChange(domEvent) {
		// Two-way: apply the theme immediately for visual feedback and stash
		// it in profile meta so the next save (or a wallet export) carries
		// the choice. App.js observes globalState.profile.theme and re-applies
		// on profile load — so the theme follows the wallet across browsers.
		const id = domEvent.target?.value;
		if (!id || id === this.state.themeId) {
			return;
		}
		this.state.themeId = id;
		setTheme(id);
		this.emit('profile:update', {
			meta: {
				...this.getProfile(),
				theme: id,
			},
		});
	}
	handleCreateWallet() {
		if (this.state.busy) {
			return;
		}
		if (this.getWalletInfo().hasWallet) {
			this.state.pendingCreate = true;
			this.setStatus('', '');
			return;
		}
		this.executeCreate();
	}
	executeCreate() {
		this.state.pendingCreate = false;
		this.state.busy = true;
		this.setStatus('info', 'Generating wallet…');
		this.emit('wallet:create', {
			label: this.state.walletLabel,
			profileMeta: this.getProfile(),
		});
	}
	handleConfirmReplace() {
		this.executeCreate();
	}
	handleCancelCreate() {
		this.state.pendingCreate = false;
		this.setStatus('', '');
	}
	handleSaveFirstThenCreate() {
		this.state.pendingCreate = false;
		this.state.activeSection = 'wallet-save';
		this.setStatus('info', 'Save the current wallet, then return to CREATE.');
	}
	handleSaveLocal() {
		if (this.state.busy) {
			return;
		}
		if (!this.getWalletInfo().hasWallet) {
			this.setStatus('error', 'No wallet to save. Create one first.');
			return;
		}
		if (!this.state.savePassword) {
			this.setStatus('error', 'Provide a password to encrypt the wallet.');
			return;
		}
		this.state.busy = true;
		this.setStatus('info', 'Encrypting & writing to localStorage…');
		this.emit('wallet:save-local', {
			password: this.state.savePassword,
			profileName: this.state.saveName,
		});
	}
	handleExportBase64() {
		if (this.state.busy) {
			return;
		}
		if (!this.getWalletInfo().hasWallet) {
			this.setStatus('error', 'No wallet to save. Create one first.');
			return;
		}
		if (!this.state.savePassword) {
			this.setStatus('error', 'Provide a password to encrypt the wallet.');
			return;
		}
		this.state.busy = true;
		this.state.saveResult = '';
		this.setStatus('info', 'Encrypting…');
		this.emit('wallet:save', {
			password: this.state.savePassword,
			label: this.state.saveName,
			profileMeta: this.getProfile(),
		});
	}
	handleLoadLocal() {
		if (this.state.busy) {
			return;
		}
		if (!this.state.selectedProfile) {
			this.setStatus('error', 'Pick a saved profile to load.');
			return;
		}
		if (!this.state.loadPassword) {
			this.setStatus('error', 'Enter the wallet password.');
			return;
		}
		this.state.busy = true;
		this.setStatus('info', 'Loading from localStorage…');
		this.emit('wallet:load-local', {
			profileName: this.state.selectedProfile,
			password: this.state.loadPassword,
		});
	}
	handleDeleteLocal() {
		if (!this.state.selectedProfile) {
			this.setStatus('error', 'Pick a profile to delete.');
			return;
		}
		this.emit('wallet:delete-local', {
			profileName: this.state.selectedProfile,
		});
	}
	handleImportPaste() {
		if (this.state.busy) {
			return;
		}
		if (!this.state.loadBase64 || !this.state.loadPassword) {
			this.setStatus('error', 'Paste a wallet payload and enter the password.');
			return;
		}
		this.state.busy = true;
		this.setStatus('info', 'Decoding…');
		this.emit('wallet:load', {
			base64: this.state.loadBase64,
			password: this.state.loadPassword,
		});
	}
	tabsList = SECTIONS;
	renderStatus() {
		return this.htmlElement `
			<div class="${() => {
				return `sm-status tone-${this.state.statusTone || 'idle'}${this.state.statusMessage ? ' is-visible' : ''}`;
			}}">${this.state.statusMessage}</div>
		`;
	}
	renderProfileSection() {
		const address = this.getWalletInfo().address ?? '';
		const shortAddress = address && address.length > 18 ? `${address.slice(0, 16)}…` : address;
		const placeholderText = shortAddress ? `defaults to wallet address (${shortAddress})` : 'defaults to wallet address';
		const themeOptions = [...THEMES.values()].map((themeEntry) => {
			return `<option value="${themeEntry.id}">${themeEntry.label}</option>`;
		}).join('');
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">PROFILE</span>
					<span class="sm-section-title">// IDENTITY</span>
				</header>
				<p class="sm-copy"><strong>Display name</strong> is your shown identity; <strong>handle</strong> is your username for tagging and lookups. Both default to your wallet address in URL-safe base64. Whatever values are set here ride with the wallet — they are written into the wallet's metadata when you save or export, so they travel with the encrypted package.</p>
				<label class="sm-field">
					<span class="sm-label">DISPLAY NAME</span>
					<input
						type="text"
						class="sm-input"
						spellcheck="false"
						autocomplete="off"
						placeholder="${placeholderText}"
						$value="displayName">
				</label>
				<label class="sm-field">
					<span class="sm-label">HANDLE</span>
					<input
						type="text"
						class="sm-input"
						spellcheck="false"
						autocomplete="off"
						placeholder="${placeholderText}"
						$value="handle">
				</label>
				<label class="sm-field">
					<span class="sm-label">THEME</span>
					<select class="sm-input" $value="themeId" @change=${this.handleThemeChange}>^html${themeOptions}</select>
				</label>
				<p class="sm-copy">Theme is applied immediately and saved with the profile — when a wallet is loaded the theme follows it.</p>
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
			['Public key (ed25519)', info.publicKey],
			['Trapdoor public key (ML-DSA-44)', info.trapdoorPublicKey],
			['Trapdoor hash', info.trapdoorHash],
			['Label', info.label],
			['Saved at', info.walletSavedAt],
		];
		const rowItems = rows.map(([
			label,
			value,
		]) => {
			const display = value ? value : '—';
			const copyAttr = value ? ` data-copy="${value}"` : '';
			const cls = value ? 'sm-readout is-copyable' : 'sm-readout';
			return `<div class="sm-field"><span class="sm-label">${label}</span><div class="${cls}"${copyAttr}>${display}</div></div>`;
		}).join('');
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">WALLET</span>
					<span class="sm-section-title">// PROPERTIES (CLICK TO COPY)</span>
				</header>
				<p class="sm-copy">Public projection of the active wallet. Private keys and seeds stay in memory on the app instance and are never written to global state.</p>
				<div class="sm-grid" @click=${this.handleCopy}>^html${rowItems}</div>
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
				<p class="sm-copy">Generate a new HD site wallet with ed25519 + ML-DSA trapdoor keypairs. No password required to generate — you set the encryption password when saving the wallet.</p>
				<div class="sm-create-form" ?hidden=${this.state.pendingCreate}>
					<label class="sm-field">
						<span class="sm-label">WALLET LABEL (optional)</span>
						<input
							type="text"
							class="sm-input"
							spellcheck="false"
							autocomplete="off"
							placeholder="e.g. primary"
							$value="walletLabel">
					</label>
					<div class="sm-actions">
						<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleCreateWallet}>
							${() => {
								return (this.state.busy ? 'WORKING…' : 'GENERATE WALLET');
							}}
						</button>
					</div>
				</div>
				<div class="sm-create-confirm" ?hidden=${() => {
					return !this.state.pendingCreate;
				}}>
					<div class="sm-warning">
						<div class="sm-warning-head">⚠ Replace current wallet?</div>
						<p class="sm-warning-body">A wallet is already loaded. Generating a new one will replace its keys and seeds in memory. Make sure the current wallet is saved to localStorage or exported before continuing — otherwise it will be lost.</p>
						<div class="sm-warning-row">
							<span class="sm-label">CURRENT ADDRESS</span>
							<div class="sm-readout">${() => {
								return this.getWalletInfo().address || '—';
							}}</div>
						</div>
					</div>
					<div class="sm-actions">
						<button class="sm-btn sm-btn-primary" @click=${this.handleSaveFirstThenCreate}>SAVE FIRST</button>
						<button class="sm-btn sm-btn-danger" ?disabled=${this.state.busy} @click=${this.handleConfirmReplace}>
							${() => {
								return (this.state.busy ? 'WORKING…' : 'REPLACE WALLET');
							}}
						</button>
						<button class="sm-btn" @click=${this.handleCancelCreate}>CANCEL</button>
					</div>
				</div>
				${this.renderStatus}
			</div>
		`;
	}
	renderWalletSaveSection() {
		const info = this.getWalletInfo();
		const profile = this.getProfile();
		let placeholderName = 'profile name';
		if (info.address) {
			const short = info.address.length > 18 ? `${info.address.slice(0, 16)}…` : info.address;
			placeholderName = `defaults to address (${short})`;
		} else if (profile.displayName) {
			placeholderName = `defaults to "${profile.displayName}"`;
		}
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">SAVE</span>
					<span class="sm-section-title">// PERSIST WALLET</span>
				</header>
				<p class="sm-copy">Encrypt the current wallet seeds + HD state with a password. Save locally under a profile name (localStorage, key <code>viat.wallet:&lt;name&gt;</code>) or export as a base64 CBOR string to copy elsewhere.</p>
				<label class="sm-field">
					<span class="sm-label">PROFILE NAME</span>
					<input
						type="text"
						class="sm-input"
						spellcheck="false"
						autocomplete="off"
						placeholder="${placeholderName}"
						$value="saveName">
				</label>
				<label class="sm-field">
					<span class="sm-label">ENCRYPTION PASSWORD</span>
					<input
						type="password"
						class="sm-input"
						spellcheck="false"
						autocomplete="new-password"
						placeholder="encryption password"
						$value="savePassword">
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleSaveLocal}>
						${() => {
							return (this.state.busy ? 'WORKING…' : 'SAVE TO LOCALSTORAGE');
						}}
					</button>
					<button class="sm-btn" ?disabled=${this.state.busy} @click=${this.handleExportBase64}>
						${() => {
							return (this.state.busy ? '…' : 'EXPORT BASE64');
						}}
					</button>
					<button class="sm-btn" ?disabled=${() => {
						return !this.state.saveResult;
					}} @click=${this.handleCopySaveResult}>COPY</button>
				</div>
				<label class="sm-field">
					<span class="sm-label">BASE64 CBOR PAYLOAD (CLICK TO COPY)</span>
					<textarea
						class="sm-textarea is-copyable"
						rows="6"
						spellcheck="false"
						autocomplete="off"
						readonly
						placeholder="encrypted wallet output appears here after export"
						data-copy="${this.state.saveResult}"
						.value=${this.state.saveResult}
						@click=${this.handleCopy}></textarea>
				</label>
				${this.renderStatus}
			</div>
		`;
	}
	renderWalletLoadSection() {
		const info = this.getWalletInfo();
		const profiles = info.savedProfiles ?? [];
		// Note: do NOT read `this.state.selectedProfile` here — it would mark
		// selectedProfile as a render dep, causing the section to rebuild on
		// every dropdown change and unfocus inputs. The $value bind on <select>
		// applies the value programmatically, which natively highlights the
		// matching <option>.
		const profileOptions = ['<option value="">— select saved profile —</option>'].concat(profiles.map((profileName) => {
			return `<option value="${profileName}">${profileName}</option>`;
		})).join('');
		return this.htmlElement `
			<div class="sm-section">
				<header class="sm-section-head">
					<span class="sm-section-id">LOAD</span>
					<span class="sm-section-title">// IMPORT WALLET</span>
				</header>
				<p class="sm-copy">Load a saved wallet from localStorage by profile name, or paste a wallet payload (JSON or base64 CBOR — format auto-detected).</p>
				<label class="sm-field">
					<span class="sm-label">SAVED PROFILES</span>
					<select class="sm-input" $value="selectedProfile">^html${profileOptions}</select>
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
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleLoadLocal}>
						${() => {
							return (this.state.busy ? 'LOADING…' : 'LOAD PROFILE');
						}}
					</button>
					<button class="sm-btn" ?disabled=${() => {
						return !this.state.selectedProfile;
					}} @click=${this.handleDeleteLocal}>DELETE</button>
				</div>
				<div class="sm-divider">// OR PASTE A PAYLOAD</div>
				<label class="sm-field">
					<span class="sm-label">WALLET PAYLOAD (JSON or BASE64)</span>
					<textarea
						class="sm-textarea"
						rows="6"
						spellcheck="false"
						autocomplete="off"
						placeholder="paste JSON or base64-encoded wallet payload…"
						$value="loadBase64"></textarea>
				</label>
				<div class="sm-actions">
					<button class="sm-btn sm-btn-primary" ?disabled=${this.state.busy} @click=${this.handleImportPaste}>
						${() => {
							return (this.state.busy ? 'LOADING…' : 'IMPORT PAYLOAD');
						}}
					</button>
				</div>
				${this.renderStatus}
			</div>
		`;
	}
	render() {
		this.html `
			<ui-modal #modal class="sm-modal" .state=${{
				modal: true,
				open: false,
				showClose: true,
				showMaximize: true,
			}}>
				<ui-tabs class="sm-tabs"
					.tabs=${this.tabsList}
					.orientation=${'vertical'}
					.active=${this.state.activeSection}
					@tab-change=${this.handleTabChange}>
					<section slot="profile" class="sm-body">${this.renderProfileSection}</section>
					<section slot="wallet-view" class="sm-body">${this.renderWalletViewSection}</section>
					<section slot="wallet-create" class="sm-body">${this.renderWalletCreateSection}</section>
					<section slot="wallet-save" class="sm-body">${this.renderWalletSaveSection}</section>
					<section slot="wallet-load" class="sm-body">${this.renderWalletLoadSection}</section>
				</ui-tabs>
			</ui-modal>
		`;
	}
}
customElements.define('settings-modal', SettingsModal);
