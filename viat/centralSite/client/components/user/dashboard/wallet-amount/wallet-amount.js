import { WebComponent } from '../../../core/index.js';
export class WalletAmount extends WebComponent {
	static url = import.meta.url;
	static styles = {
		walletAmount: './wallet-amount.css',
	};
	static state = {
		label: 'RESOURCE ALLOCATION',
	};
	render() {
		this.html`
			<section class="wallet-hero">
				<div class="wa-label">${this.state.label}</div>
				<div class="wa-amount-main">${() => {
					return this.global.account?.amount ?? '0';
				}}</div>
				<div class="wa-coin-info">
					<div class="wa-coin-symbol">⩝</div>
					<div class="wa-amount-full">${() => {
						return this.global.account?.amountFull ?? '0.000000000';
					}} VIAT</div>
				</div>
			</section>
		`;
	}
}
customElements.define('wallet-amount', WalletAmount);
