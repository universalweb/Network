import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
	scrollbarSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const navStyles = await loadSheet(new URL('../styles/nav.css', import.meta.url));
const host = hostSheet(`
:host {
	display: block;
	flex: 0 0 auto;
	min-height: 220px;
}
`);
export class ViatAccountPanel extends WebComponent {
	static get observedAttributes() {
		return [
			'profile-name',
			'profile-label',
			'wallet-address',
		];
	}
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			scrollbarSheet,
			navStyles,
		], {
			tooltips: true,
		});
		this.state = {
			actionLabel: '',
			addressCopied: false,
			profileLabel: '',
			profileName: '',
			walletAddress: '',
		};
		this.addEvent('copyWalletAddress', 'click', this.handleCopyWalletAddress);
		this.addEvent('copyWalletAddressKeydown', 'keydown', this.handleCopyWalletAddressKeydown);
		this.addEvent('emitCreateWallet', 'click', this.handleCreateWallet);
	}
	get actionLabel() {
		return this.state.actionLabel;
	}
	set actionLabel(value) {
		this.updateState({
			actionLabel: value ?? '',
		});
	}
	get addressCopied() {
		return this.state.addressCopied;
	}
	set addressCopied(value) {
		this.updateState({
			addressCopied: value === true,
		});
	}
	get profileLabel() {
		return this.state.profileLabel;
	}
	set profileLabel(value) {
		this.updateState({
			profileLabel: value ?? '',
		});
	}
	get profileName() {
		return this.state.profileName;
	}
	set profileName(value) {
		this.updateState({
			profileName: value ?? '',
		});
	}
	get walletAddress() {
		return this.state.walletAddress;
	}
	set walletAddress(value) {
		this.updateState({
			walletAddress: value ?? '',
		});
	}
	onConnect() {
		this.updateState({
			profileLabel: this.getAttribute('profile-label') ?? this.profileLabel,
			profileName: this.getAttribute('profile-name') ?? this.profileName,
			walletAddress: this.getAttribute('wallet-address') ?? this.walletAddress,
		});
	}
	onAttributeChange(attributeName, empty, newVal) {
		if (attributeName === 'profile-name') {
			this.updateState({
				profileName: newVal ?? '',
			});
		}
		if (attributeName === 'profile-label') {
			this.updateState({
				profileLabel: newVal ?? '',
			});
		}
		if (attributeName === 'wallet-address') {
			this.updateState({
				walletAddress: newVal ?? '',
			});
		}
	}
	async copyWalletAddress() {
		if (!this.walletAddress) {
			return;
		}
		try {
			await navigator.clipboard.writeText(this.walletAddress);
			this.addressCopied = true;
			this.setTimeout(() => {
				this.addressCopied = false;
			}, 1600);
			this.emit('wallet-address-copy', {
				walletAddress: this.walletAddress,
			});
		} catch {
			this.emit('wallet-address-copy-error', {
				walletAddress: this.walletAddress,
			});
		}
	}
	handleCopyWalletAddress() {
		this.copyWalletAddress();
	}
	handleCopyWalletAddressKeydown(e) {
		if (e.key !== 'Enter' && e.key !== ' ') {
			return;
		}
		e.preventDefault();
		this.copyWalletAddress();
	}
	handleCreateWallet() {
		this.emit('create-wallet');
	}
	bindNotifications(notifications) {
		this.addEventListener('wallet-address-copy', (e) => {
			notifications.show({
				itemType: 'copy',
				message: `${e.detail.walletAddress} copied to clipboard`,
				title: 'Wallet Address Copied',
			});
		});
		this.addEventListener('wallet-address-copy-error', () => {
			notifications.show({
				itemType: 'error',
				message: 'Clipboard copy failed',
				timeout: 4200,
				title: 'Copy Error',
			});
		});
	}
	render() {
		const {
			actionLabel,
			addressCopied,
			profileLabel,
			profileName,
			walletAddress,
		} = this.state;
		this.shadowRoot.innerHTML = `
			<nav class="panel nav-panel">
				<div class="panel-header">
					<span><span class="ph-id">ACCOUNT</span> // OVERVIEW</span>
					<div class="ph-dot"></div>
				</div>
				<div class="account-display">
					<div class="account-top">
						<div class="profile-meta">
							<div class="profile-label">${profileLabel}</div>
							<div class="profile-name">${profileName}</div>
						</div>
					</div>
					<div class="account-grid">
						<div class="account-field wide">
							<div class="account-field-label">Wallet Address</div>
							<div class="account-field-value wallet-address-value${addressCopied ? ' copied' : ''}" aria-label="${addressCopied ? 'Copied' : 'Copy wallet address'}" data-tooltip="${addressCopied ? 'Copied' : 'Copy wallet address'}" data-onclick="copyWalletAddress" data-onkeydown="copyWalletAddressKeydown" role="button" tabindex="0">${walletAddress}</div>
						</div>
					</div>
					<button class="account-action" data-tooltip="Create wallet" data-onclick="emitCreateWallet">${actionLabel}</button>
				</div>
			</nav>
		`;
	}
}
customElements.define('viat-account-panel', ViatAccountPanel);
