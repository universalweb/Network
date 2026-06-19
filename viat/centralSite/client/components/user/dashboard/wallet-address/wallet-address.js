import { WebComponent } from '../../../core/index.js';
export class WalletAddress extends WebComponent {
	static url = import.meta.url;
	static styles = {
		walletAddress: './wallet-address.css',
	};
	static state = {
		copied: false,
	};
	constructor(state = {}, config = {}) {
		super(state, {
			...config,
			tooltips: config.tooltips ?? true,
		});
	}
	addressText() {
		// Pure address — anything decorative (labels, prefixes) breaks
		// paste-into-wallet flows. Keep this string clipboard-clean.
		return this.global.walletAddress ?? '';
	}
	async handleCopy() {
		const accepted = await this.copyText(this.addressText());
		if (accepted) {
			this.handleCopyDone();
			return;
		}
		this.handleCopyError();
	}
	handleCopyDone() {
		this.state.copied = true;
		this.emit('notify', {
			itemType: 'copy',
			message: this.addressText() || 'Wallet address copied to clipboard.',
			title: 'Address Copied',
		});
		this.setTimeout(() => {
			this.state.copied = false;
		}, 1600);
	}
	handleCopyError() {
		this.emit('notify', {
			itemType: 'error',
			message: 'Could not write to clipboard.',
			title: 'Copy Failed',
		});
	}
	render() {
		this.html `
			<div class="wallet-address" ?data-copied=${this.state.copied}
				tooltip=${this.state.copied ? 'Copied!' : 'Copy address'}
				@click=${this.handleCopy}
				role="button"
				tabindex="0">${this.global.walletAddress || 'no wallet'}</div>
		`;
	}
}
customElements.define('wallet-address', WalletAddress);
