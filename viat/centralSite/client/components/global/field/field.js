/*
	DESCRIPTION: ui-field — labelled control wrapper (hint / error / required /
	inline / size). `floatLabel` overlays the label on the nested control
	(PrimeVue FloatLabel). Nested ui-input (and any host with data-filled)
	upgrade automatically via inherited --uwc-float-* tokens + :has().
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-field .state.label=${'Email'} .state.hint=${'Never shared'} .state.required=${true}>
	    <ui-input $value="email"></ui-input>
	  </ui-field>
	  <ui-field .state.label=${'Username'} .state.floatLabel=${true}>
	    <ui-input $value="username"></ui-input>
	  </ui-field>
	─────────────────────────────────────────────────────────────────────
*/
import { hasValue } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
function isFilledValue(value) {
	if (!hasValue(value)) {
		return false;
	}
	if (value === '') {
		return false;
	}
	return true;
}
function elementIsFilled(element) {
	if (!element) {
		return false;
	}
	if (element.hasAttribute('data-filled')) {
		return true;
	}
	if (element.value !== undefined && isFilledValue(element.value)) {
		return true;
	}
	return false;
}
export class UIField extends WebComponent {
	static url = import.meta.url;
	static styles = {
		field: './field.css',
	};
	static state = {
		label: '',
		hint: '',
		error: '',
		required: false,
		inline: false,
		size: 'md',
		// Overlay the label on the nested control. Default stays stacked.
		floatLabel: false,
		// True when a nested control reports a non-empty value.
		filled: false,
	};
	/* error wins over help — read in two spots (hint visibility + hint text), so it
	   stays a getter rather than inlining the expression twice. */
	get hintText() {
		return this.state.error || this.state.hint;
	}
	onConnect() {
		this.syncHostFlags();
		this.observe([
			'floatLabel',
			'filled',
		], this.syncHostFlags);
		this.on('input:input', this.handleNestedValue);
		this.on('input:change', this.handleNestedValue);
		this.on('textarea:input', this.handleNestedValue);
		this.on('textarea:change', this.handleNestedValue);
		this.on('select:change', this.handleNestedValue);
	}
	onMount() {
		this.syncFilledFromSlot();
	}
	syncHostFlags() {
		const floatLabel = this.state.floatLabel === true;
		this.toggleAttribute('data-float-label', floatLabel);
		this.toggleAttribute('data-filled', this.state.filled === true);
		this.provide('floatLabel', floatLabel);
	}
	syncFilledFromSlot() {
		const slot = this.refs.body;
		const assigned = slot?.assignedElements?.() || [];
		const count = assigned.length;
		let filled = false;
		for (let index = 0; index < count; index += 1) {
			if (elementIsFilled(assigned[index])) {
				filled = true;
				break;
			}
		}
		if (this.state.filled !== filled) {
			this.state.filled = filled;
		}
	}
	handleNestedValue(domEvent) {
		const value = domEvent.detail?.data?.value;
		const filled = isFilledValue(value);
		if (this.state.filled !== filled) {
			this.state.filled = filled;
		}
	}
	render() {
		this.html`
			<div
				class="field"
				data-size=${this.state.size}
				?data-inline=${this.state.inline && !this.state.floatLabel}
				?data-error=${this.state.error}
				?data-float-label=${this.state.floatLabel}>
				<label class="field-label" ?hidden=${!this.state.label}>${this.state.label}<span class="field-required" aria-hidden="true" ?hidden=${!this.state.required}> *</span></label>
				<div class="field-body"><slot #body></slot></div>
				<div class="field-hint" ?hidden=${!this.hintText}>${this.hintText}</div>
			</div>
		`;
	}
}
customElements.define('ui-field', UIField);
