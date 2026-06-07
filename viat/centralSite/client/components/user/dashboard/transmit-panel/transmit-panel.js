import { Panel } from '../../../global/panel/panel.js';
// Address formats the recipient input accepts. The dropdown next to the
// input lets the user override the auto-detection if our heuristic gets
// it wrong (the SDK ultimately needs base64 — see app.js handleTransmit).
const FORMATS = [
	'base64', 'base64url', 'hex',
];
const PREFIX_MAP = {
	'b64:': 'base64',
	'ub64:': 'base64url',
	'hex:': 'hex',
};
function stripPrefix(raw) {
	const lower = raw.toLowerCase();
	for (const prefix of Object.keys(PREFIX_MAP)) {
		if (lower.startsWith(prefix)) {
			return {
				value: raw.slice(prefix.length),
				format: PREFIX_MAP[prefix],
			};
		}
	}
	return null;
}
// Heuristic: returns the detected format or null when the signal is too
// weak to safely override a user-picked format.
//
//   - Standard base64 uses `+` and `/`  → unambiguous
//   - URL-safe base64 uses `-` and `_`  → unambiguous
//   - Hex at canonical address byte-counts (24→48, 32→64) → strong signal
//   - Anything else → we shouldn't fight the user; keep current dropdown
function detectFormat(value) {
	if (!value) {
		return null;
	}
	if ((/[+/]/).test(value)) {
		return 'base64';
	}
	if ((/[-_]/).test(value)) {
		return 'base64url';
	}
	if ((/^[0-9a-fA-F]+$/).test(value) && (value.length === 48 || value.length === 64)) {
		return 'hex';
	}
	return null;
}
export class TransmitPanel extends Panel {
	static url = import.meta.url;
	static styles = {
		transmitPanel: './transmit-panel.css',
	};
	static state = {
		amountLabel: 'Amount',
		amountPlaceholder: '0.00000000',
		amountValue: '',
		buttonLabel: '[ EXECUTE TRANSFER ]',
		classes: new Set(['transmit-panel']),
		gasLabel: 'Gas',
		gasValue: '0',
		id: 'TX',
		recipientLabel: 'Recipient Address',
		recipientPlaceholder: 'viat1...',
		recipientValue: '',
		recipientFormat: 'base64url',
		showDot: true,
		title: 'SEND VIAT',
		tokenLabel: 'VIAT',
	};
	handleRecipientInput(domEvent) {
		const raw = String(domEvent.target.value ?? '');
		// Pasted-in prefix wins outright — strip it and pin the dropdown.
		const stripped = stripPrefix(raw.trim());
		if (stripped) {
			this.assignState({
				recipientValue: stripped.value,
				recipientFormat: stripped.format,
			});
			return;
		}
		const detected = detectFormat(raw);
		const next = {
			recipientValue: raw,
		};
		if (detected) {
			next.recipientFormat = detected;
		}
		this.assignState(next);
	}
	handleFormatChange(domEvent) {
		const next = domEvent.target.value;
		if (FORMATS.includes(next)) {
			this.assignState({
				recipientFormat: next,
			});
		}
	}
	handleTransmit() {
		this.emit('transmit', {
			amount: this.state.amountValue,
			gas: this.state.gasValue,
			recipient: this.state.recipientValue,
			recipientFormat: this.state.recipientFormat,
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
					<div class="field-with-addon recipient-with-addon">
						<input id="recipient" type="text"
							placeholder="${this.state.recipientPlaceholder}"
							.value=${this.state.recipientValue}
							@input=${this.handleRecipientInput}>
						<select class="field-addon field-addon-select"
							.value=${this.state.recipientFormat}
							@change=${this.handleFormatChange}
							tooltip="Address format · auto-detected from input">
							<option value="base64url">UB64</option>
							<option value="base64">B64</option>
							<option value="hex">HEX</option>
						</select>
					</div>
				</div>
				<button class="btn-transmit" @click=${this.handleTransmit} tooltip="Execute transfer">${this.state.buttonLabel}</button>
			</div>
		`;
	}
}
customElements.define('transmit-panel', TransmitPanel);
