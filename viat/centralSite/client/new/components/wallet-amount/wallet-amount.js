import { WebComponent } from '../base/base.js';
const walletAmountStyles = await WebComponent.styleSheet('./wallet-amount.css', import.meta.url);
export class WalletAmount extends WebComponent {
	constructor() {
		super({
			styles: [walletAmountStyles],
		});
		this.state = {};
	}
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
