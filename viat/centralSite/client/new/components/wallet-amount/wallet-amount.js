import {
	hostSheet,
	loadSheet,
	resetSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const walletAmountStyles = await loadSheet(new URL('../styles/wallet-amount.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; }`);
export class WalletAmount extends WebComponent {
	static get observedAttributes() {
		return ['amount', 'amount-full', 'label'];
	}
	constructor() {
		super([resetSheet, host, walletAmountStyles]);
		this.state = {
			amount: '',
			amountFull: '',
			label: '',
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
	onConnect() {
		this.state.amount = this.getAttribute('amount') ?? this.amount;
		this.state.amountFull = this.getAttribute('amount-full') ?? this.amountFull;
		this.state.label = this.getAttribute('label') ?? this.label;
	}
	onAttributeChange(attributeName, empty, newVal) {
		const map = { 'amount': 'amount', 'amount-full': 'amountFull', 'label': 'label' };
		const key = map[attributeName];
		if (key) {
			this.state[key] = newVal ?? '';
		}
	}
	render() {
		this.html`
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
