import { WebComponent } from '../base/base.js';
const walletAmountStyles = await WebComponent.styleSheet('./wallet-amount.css', import.meta.url);
export class WalletAmount extends WebComponent {
	static attrBindings = {
		amount: 'amount',
		'amount-full': 'amountFull',
		label: 'label',
	};
	constructor() {
		super([walletAmountStyles]);
		this.state = {
			amount: this.getAttribute('amount') ?? '',
			amountFull: this.getAttribute('amount-full') ?? '',
			label: this.getAttribute('label') ?? '',
		};
	}
	get amount() {
		return this.state.amount;
	}
	set amount(value) {
		this.state.amount = value ?? '';
	}
	get amountFull() {
		return this.state.amountFull;
	}
	set amountFull(value) {
		this.state.amountFull = value ?? '';
	}
	get label() {
		return this.state.label;
	}
	set label(value) {
		this.state.label = value ?? '';
	}
	render() {
		this.html `
			<section class="wallet-hero">
				<div class="wa-label">${this.state.label}</div>
				<div class="wa-amount-main">${this.state.amount}</div>
				<div class="wa-coin-info">
					<div class="wa-coin-symbol">⩝</div>
					<div class="wa-amount-full">${this.state.amountFull} VIAT</div>
				</div>
			</section>
		`;
	}
}
customElements.define('wallet-amount', WalletAmount);
