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
	tooltipText() {
		return this.state.copied ? 'Copied!' : 'Copy address';
	}
	hostClasses() {
		return `wallet-address${this.state.copied ? ' copied' : ''}`;
	}
	copyText() {
		// Pure address — anything decorative (labels, prefixes) breaks
		// paste-into-wallet flows. Keep this string clipboard-clean.
		return this.globalState.walletAddress ?? '';
	}
	handleCopyDone() {
		this.state.copied = true;
		this.emit('notify', {
			itemType: 'copy',
			message: this.copyText() || 'Wallet address copied to clipboard.',
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
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${this.hostClasses}
				copy=${this.copyText}
				tooltip=${this.tooltipText}
				@copy:done=${this.handleCopyDone}
				@copy:error=${this.handleCopyError}
				role="button"
				tabindex="0">${() => this.globalState.walletAddress || 'no wallet'}</div>
		`;
	}
}
customElements.define('wallet-address', WalletAddress);
