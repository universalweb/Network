import {
	hostSheet,
	loadSheet,
	panelSheet,
	resetSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const transmitStyles = await loadSheet(new URL('../styles/transmit.css', import.meta.url));
const host = hostSheet(`:host { display: block; flex-shrink: 0; }`);
export class TransmitPanel extends WebComponent {
	constructor() {
		super([resetSheet, host, panelSheet, transmitStyles], { tooltips: true });
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
		this.addEvent('handleTransmit', 'click', this.handleTransmit);
	}
	handleTransmit() {
		this.emit('transmit', {
			amount: this.state.amountValue,
			gas: this.state.gasValue,
			recipient: this.state.recipientValue,
		});
	}
	render() {
		this.html`
			<section class="transmit-panel panel">
				<div class="panel-header">
					<span><span class="ph-id">TX</span> // SEND VIAT</span>
					<div class="ph-dot"></div>
				</div>
				<div class="transmit-body">
					<div class="field">
						<div class="field-head">
							<div class="field-label">${this.state.amountLabel}</div>
						</div>
						<div class="field-with-addon">
							<input id="amount" type="text"
								placeholder="${this.state.amountPlaceholder}"
								value="${this.state.amountValue}"
								data-bind="amountValue">
							<div class="field-addon">${this.state.tokenLabel}</div>
						</div>
					</div>
					<div class="field">
						<div class="field-head">
							<div class="field-label">${this.state.gasLabel}</div>
						</div>
						<input id="gas" type="text" value="${this.state.gasValue}" readonly>
					</div>
					<div class="field full-width">
						<div class="field-label">${this.state.recipientLabel}</div>
						<input id="recipient" type="text"
							placeholder="${this.state.recipientPlaceholder}"
							value="${this.state.recipientValue}"
							data-bind="recipientValue">
					</div>
					<button class="btn-transmit" data-onclick="handleTransmit" data-tooltip="Execute transfer">${this.state.buttonLabel}</button>
				</div>
			</section>
		`;
	}
}
customElements.define('transmit-panel', TransmitPanel);
