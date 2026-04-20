import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const walletAmountStyles = await loadSheet(new URL('../styles/wallet-amount.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; }`);
export class ViatWalletAmount extends WebComponent {
	static get observedAttributes() {
		return [
			'amount',
			'amount-full',
			'label',
		];
	}
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			walletAmountStyles,
		]);
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
		this.updateState({
			amount: value ?? '',
		});
	}
	get amountFull() {
		return this.state.amountFull;
	}
	set amountFull(value) {
		this.updateState({
			amountFull: value ?? '',
		});
	}
	get label() {
		return this.state.label;
	}
	set label(value) {
		this.updateState({
			label: value ?? '',
		});
	}
	onConnect() {
		this.updateState({
			amount: this.getAttribute('amount') ?? this.amount,
			amountFull: this.getAttribute('amount-full') ?? this.amountFull,
			label: this.getAttribute('label') ?? this.label,
		});
	}
	onAttributeChange(attributeName, empty, newVal) {
		const nextState = {};
		if (attributeName === 'amount') {
			nextState.amount = newVal ?? '';
		}
		if (attributeName === 'amount-full') {
			nextState.amountFull = newVal ?? '';
		}
		if (attributeName === 'label') {
			nextState.label = newVal ?? '';
		}
		if (Object.keys(nextState).length) {
			this.updateState(nextState);
		}
	}
	render() {
		const {
			amount,
			amountFull,
			label,
		} = this.state;
		this.shadowRoot.innerHTML = `
			<section class="panel wallet-amount-panel">
				<div class="wa-label">${label}</div>
				<div class="wa-amount-main">${amount}</div>
				<div class="wa-amount-full">${amountFull} VIAT</div>
				<div class="wa-viat-info">
					<div class="wa-viat-symbol">\u2A5D</div>
					<span>VIAT \u2014 The First Post-Quantum Transitory Cryptocurrency</span>
				</div>
			</section>
		`;
	}
}
customElements.define('viat-wallet-amount', ViatWalletAmount);
