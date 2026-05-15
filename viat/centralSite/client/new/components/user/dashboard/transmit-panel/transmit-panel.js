import { Panel } from '../../../global/panel/panel.js';
export class TransmitPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		transmitPanel: './transmit-panel.css',
	};
	static state = {
		amountLabel: '',
		amountPlaceholder: '',
		amountValue: '',
		buttonLabel: '',
		className: ['transmit-panel'],
		gasLabel: '',
		gasValue: '',
		id: 'TX',
		recipientLabel: '',
		recipientPlaceholder: '',
		recipientValue: '',
		showDot: true,
		title: 'SEND VIAT',
		tokenLabel: '',
	};
	handleTransmit() {
		this.emit('transmit', {
			amount: this.state.amountValue,
			gas: this.state.gasValue,
			recipient: this.state.recipientValue,
		});
	}
	renderBody() {
		return this.htmlElement `
			<div class="transmit-body">
				<div class="field">
					<div class="field-head">
						<div class="field-label">${this.state.amountLabel}</div>
					</div>
					<div class="field-with-addon">
						<input id="amount" type="text"
							placeholder="${this.state.amountPlaceholder}"
							$value="amountValue">
						<div class="field-addon">${this.state.tokenLabel}</div>
					</div>
				</div>
				<div class="field">
					<div class="field-head">
						<div class="field-label">${this.state.gasLabel}</div>
					</div>
					<input id="gas" type="text" $value="gasValue" readonly>
				</div>
				<div class="field full-width">
					<div class="field-label">${this.state.recipientLabel}</div>
					<input id="recipient" type="text"
						placeholder="${this.state.recipientPlaceholder}"
						$value="recipientValue">
				</div>
				<button class="btn-transmit" @click=${this.handleTransmit} tooltip="Execute transfer">${this.state.buttonLabel}</button>
			</div>
		`;
	}
}
customElements.define('transmit-panel', TransmitPanel);
