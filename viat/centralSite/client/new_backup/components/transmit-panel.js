import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const transmitStyles = await loadSheet(new URL('../styles/transmit.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; }`);
export class ViatTransmitPanel extends WebComponent {
	constructor() {
		super([
			resetSheet,
			host,
			panelSheet,
			transmitStyles,
		], {
			tooltips: true,
		});
		this.state = {
			amountLabel: '',
			amountPlaceholder: '',
			amountValue: '',
			buttonLabel: '',
			gasLabel: '',
			gasValue: '',
			recipientLabel: '',
			recipientPlaceholder: '',
			recipientValue: '',
			tokenLabel: '',
		};
		this.addEvent('handleAmountInput', 'input', this.handleAmountInput);
		this.addEvent('handleRecipientInput', 'input', this.handleRecipientInput);
		this.addEvent('handleTransmit', 'click', this.handleTransmit);
	}
	handleAmountInput(domEvent) {
		this.updateState({
			amountValue: domEvent.target.value,
		});
	}
	handleRecipientInput(domEvent) {
		this.updateState({
			recipientValue: domEvent.target.value,
		});
	}
	handleTransmit() {
		this.emit('transmit', {
			amount: this.state.amountValue,
			gas: this.state.gasValue,
			recipient: this.state.recipientValue,
		});
	}
	render() {
		const vm = this.state;
		this.shadowRoot.innerHTML = `
			<section class="transmit-panel panel">
				<div class="panel-header">
					<span><span class="ph-id">TX</span> // SEND VIAT</span>
					<div class="ph-dot"></div>
				</div>
				<div class="transmit-body">
					<div class="field">
						<div class="field-head">
							<div class="field-label">${vm.amountLabel}</div>
						</div>
						<div class="field-with-addon">
							<input id="amount" type="text" placeholder="${vm.amountPlaceholder}" value="${vm.amountValue}" data-oninput="handleAmountInput">
							<div class="field-addon">${vm.tokenLabel}</div>
						</div>
					</div>
					<div class="field">
						<div class="field-head">
							<div class="field-label">${vm.gasLabel}</div>
						</div>
						<input id="gas" type="text" value="${vm.gasValue}" readonly>
					</div>
					<div class="field full-width">
						<div class="field-label">${vm.recipientLabel}</div>
						<input id="recipient" type="text" placeholder="${vm.recipientPlaceholder}" value="${vm.recipientValue}" data-oninput="handleRecipientInput">
					</div>
					<button class="btn-transmit" data-onclick="handleTransmit" data-tooltip="Execute transfer">${vm.buttonLabel}</button>
				</div>
			</section>
		`;
	}
}
customElements.define('viat-transmit-panel', ViatTransmitPanel);
