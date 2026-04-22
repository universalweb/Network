import { WebComponent } from '../base/base.js';
const transmitStyles = await WebComponent.styleSheet('./transmit-panel.css', import.meta.url);
export class TransmitPanel extends WebComponent {
	constructor() {
		super({
			styles: [transmitStyles],
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
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
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
						<button class="btn-transmit" @click=${this.createEmitHandler('transmit', () => {
							return {
								amount: this.state.amountValue,
								gas: this.state.gasValue,
								recipient: this.state.recipientValue,
							};
						})} data-tooltip="Execute transfer">${this.state.buttonLabel}</button>
				</div>
			</section>
		`;
	}
}
customElements.define('transmit-panel', TransmitPanel);
