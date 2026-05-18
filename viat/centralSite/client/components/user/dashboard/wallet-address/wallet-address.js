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
		const address = this.globalState.walletAddress ?? '';
		return address ? `Wallet Address: ${address}` : '';
	}
	handleCopyDone(domEvent) {
		this.state.copied = true;
		const copied = domEvent?.detail?.value ?? this.copyText();
		this.emit('notify', {
			itemType: 'copy',
			message: copied,
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
				copy="${this.copyText}"
				tooltip="${this.tooltipText}"
				@copy:done=${this.handleCopyDone}
				@copy:error=${this.handleCopyError}
				role="button"
				tabindex="0">${() => this.globalState.walletAddress || 'no wallet'}</div>
		`;
	}
}
customElements.define('wallet-address', WalletAddress);
