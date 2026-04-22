import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./wallet-address.css', import.meta.url);
export class WalletAddress extends WebComponent {
	static attrBindings = {
		'wallet-address': 'walletAddress',
	};
	constructor() {
		super([styles], {
			tooltips: true,
		});
		this.state = {
			copied: false,
			walletAddress: this.getAttribute('wallet-address') ?? '',
		};
	}
	get walletAddress() {
		return this.state.walletAddress;
	}
	set walletAddress(value) {
		this.state.walletAddress = value ?? '';
	}
	async handleCopy() {
		if (!this.state.walletAddress) {
			return;
		}
		try {
			await navigator.clipboard.writeText(this.state.walletAddress);
			this.state.copied = true;
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
				this.state.copied = false;
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
				@click=${this.handleCopy}
				@keydown=${this.handleCopyKeydown}
				data-tooltip="${() => {
					return (this.state.copied ? 'Copied!' : 'Copy address');
				}}"
				role="button"
				tabindex="0">${this.state.walletAddress}</div>
		`;
	}
}
customElements.define('wallet-address', WalletAddress);
