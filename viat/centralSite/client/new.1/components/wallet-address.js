import {
	hostSheet,
	loadSheet,
	resetSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const styles = await loadSheet(new URL('../styles/wallet-address.css', import.meta.url));
const host = hostSheet(`:host { display: block; }`);
export class WalletAddress extends WebComponent {
	static get observedAttributes() {
		return ['wallet-address'];
	}
	constructor() {
		super([
			resetSheet, host, styles,
		], {
			tooltips: true,
		});
		this.state = {
			copied: false,
			walletAddress: '',
		};
		this.addEvent('copy', 'click', this.handleCopy);
		this.addEvent('copyKeydown', 'keydown', this.handleCopyKeydown);
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
			walletAddress: this.getAttribute('wallet-address') ?? this.walletAddress,
		});
	}
	onAttributeChange(attributeName, empty, newVal) {
		if (attributeName === 'wallet-address') {
			this.updateState({
				walletAddress: newVal ?? '',
			});
		}
	}
	async handleCopy() {
		if (!this.state.walletAddress) {
			return;
		}
		try {
			await navigator.clipboard.writeText(this.state.walletAddress);
			this.updateState({
				copied: true,
			});
			document.querySelector('app-view')?.getComponent('ui-notification')?.show({
				itemType: 'success',
				message: 'Your wallet address has been copied to your clipboard.',
				timeout: 3200,
				title: 'Address Copied',
			});
			this.emit('copy', {
				walletAddress: this.state.walletAddress,
			});
			this.setTimeout(() => {
				this.updateState({
					copied: false,
				});
			}, 1600);
		} catch {
			this.emit('copy-error', {
				walletAddress: this.state.walletAddress,
			});
		}
	}
	handleCopyKeydown(e) {
		if (e.key !== 'Enter' && e.key !== ' ') {
			return;
		}
		e.preventDefault();
		this.handleCopy();
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="${() => {
				return `wallet-address${this.state.copied ? ' copied' : ''}`;
			}}"
				data-onclick="copy"
				data-onkeydown="copyKeydown"
				data-tooltip="${() => {
					return (this.state.copied ? 'Copied!' : 'Copy address');
				}}"
				role="button"
				tabindex="0">${this.state.walletAddress}</div>
		`;
	}
}
customElements.define('wallet-address', WalletAddress);
