import { WebComponent } from '../../../core/index.js';
export class WalletAmount extends WebComponent {
	static url = import.meta.url;
	static styles = {
		walletAmount: './wallet-amount.css',
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<section class="wallet-hero">
				<div class="wa-label">${this.state.label}</div>
				<div class="wa-amount-main">${this.globalState.walletAmount?.amount}</div>
				<div class="wa-coin-info">
					<div class="wa-coin-symbol">⩝</div>
					<div class="wa-amount-full">${this.globalState.walletAmount?.amountFull} VIAT</div>
				</div>
			</section>
		`;
	}
}
customElements.define('wallet-amount', WalletAmount);
