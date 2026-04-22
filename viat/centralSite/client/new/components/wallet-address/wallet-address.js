import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./wallet-address.css', import.meta.url);
export class WalletAddress extends WebComponent {
	constructor() {
		super({
			styles: [styles],
			tooltips: true,
		});
		this.state = {
			copied: false,
		};
	}
	async handleCopy() {
		const walletAddress = this.state.walletAddress;
		if (!walletAddress) {
			return;
		}
		try {
			await navigator.clipboard.writeText(walletAddress);
			this.state.copied = true;
			document.querySelector('app-view')?.getComponent('ui-notification')?.show({
				itemType: 'success',
				message: 'Your wallet address has been copied to your clipboard.',
				timeout: 3200,
				title: 'Address Copied',
			});
			this.emit('copy', {
				walletAddress,
			});
			this.setTimeout(() => {
				this.state.copied = false;
			}, 1600);
		} catch {
			this.emit('copy-error', {
				walletAddress,
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
				tabindex="0">${this.globalState.walletAddress}</div>
		`;
	}
}
customElements.define('wallet-address', WalletAddress);
