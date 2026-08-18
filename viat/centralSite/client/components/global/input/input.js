import { hasValue } from '@universalweb/utilitylib';
import { WebComponent } from 'webcomponent';
const PLACEHOLDER_CASES = new Set([
	'upper',
	'first',
	'lower',
	'none',
]);
export class UIInput extends WebComponent {
	static url = import.meta.url;
	static styles = {
		input: './input.css',
	};
	/*
	 * `spellcheck` rides the reactive HOST-attribute channel (`this.attrs.spellcheck`,
	 * set as `<ui-input spellcheck="false">`), not state — the key shadows
	 * HTMLElement.prototype.spellcheck, so a state key would invite a bare
	 * `.spellcheck=` binding that silently sets the native DOM prop. Declared a
	 * STRING (enumerated `"true"`/`"false"`), NOT a boolean: boolean attrs are
	 * presence-only (add/remove, like `disabled`) — which would make the intended
	 * `spellcheck="false"` read as "present → on", the inverse of intent.
	 */
	static attrs = {
		spellcheck: 'true',
	};
	static state = {
		value: '',
		placeholder: '',
		// Native <input type>. Name is the HTML attr; eslint bans `type` as a
		// JS identifier because it shadows the global — keep the attr name.
		/* eslint-disable-next-line no-restricted-syntax -- native input type attr */
		type: 'text',
		disabled: false,
		readonly: false,
		tone: 'default',
		size: 'md',
		name: '',
		autocomplete: '',
		inputmode: '',
		maxlength: 0,
		minlength: 0,
		pattern: '',
		// Native constraint attrs (number / date / file).
		accept: '',
		min: '',
		max: '',
		step: '',
		multiple: false,
		// Invalid chrome (aria-invalid); also forces tone=error when true.
		invalid: false,
		// Hover hint. `tooltip`, never `title` — `title` is a native HTMLElement property
		// that a `.title=` binding would hijack before it reached state (the button footgun).
		tooltip: '',
		// ::placeholder text-transform. Enumerated dim → data-placeholder-case.
		placeholderCase: 'upper',
	};
	placeholderCaseToken() {
		if (PLACEHOLDER_CASES.has(this.state.placeholderCase)) {
			return this.state.placeholderCase;
		}
		return 'upper';
	}
	onConnect() {
		this.syncFilledFlag();
		// House API is observe() — watchState does not exist on WebComponent.
		this.observe('value', this.syncFilledFlag);
	}
	syncFilledFlag() {
		const value = this.state.value;
		this.toggleAttribute('data-filled', hasValue(value) && value !== '');
	}
	focus() {
		this.refs.input?.focus();
	}
	blur() {
		this.refs.input?.blur();
	}
	select() {
		this.refs.input?.select();
	}
	handleInput(domEvent) {
		// Absorb the native event: `input`/`change` are composed:true, so they leak out
		// of this shadow and reach consumers ALONGSIDE our namespaced re-emit.
		// stopPropagation (NOT stopImmediate) blocks only bubbling; the same-element
		// `$value` @bind still fires, so state.value tracks.
		domEvent.stopPropagation();
		this.emit('input:input', {
			value: domEvent.target.value,
		});
	}
	handleChange(domEvent) {
		domEvent.stopPropagation();
		this.emit('input:change', {
			value: domEvent.target.value,
		});
	}
	handleFocus() {
		this.emit('input:focus', {});
	}
	handleBlur() {
		this.emit('input:blur', {});
	}
	renderTone() {
		if (this.state.invalid) {
			return 'error';
		}
		return this.state.tone;
	}
	render() {
		this.html`
			<div
				class="field-shell"
				data-tone=${this.renderTone}
				data-size=${this.state.size}
				?data-disabled=${this.state.disabled}
				?data-readonly=${this.state.readonly}
				?data-invalid=${this.state.invalid}>
				<span class="field-leading"><slot name="leading"></slot></span>
				<input #input
					class="field-control"
					data-type=${this.state.type}
					data-placeholder-case=${this.placeholderCaseToken}
					type=${this.state.type}
					name=${this.state.name}
					placeholder=${this.state.placeholder}
					autocomplete=${this.state.autocomplete}
					inputmode=${this.state.inputmode}
					accept=${this.state.accept}
					min=${this.state.min}
					max=${this.state.max}
					step=${this.state.step}
					tooltip=${this.state.tooltip}
					$value="value"
					?multiple=${this.state.multiple}
					?disabled=${this.state.disabled}
					?readonly=${this.state.readonly}
					aria-invalid=${this.state.invalid ? 'true' : 'false'}
					spellcheck=${this.attrs.spellcheck}
					@input=${this.handleInput}
					@change=${this.handleChange}
					@focus=${this.handleFocus}
					@blur=${this.handleBlur}>
				<span class="field-trailing"><slot name="trailing"></slot></span>
			</div>
		`;
	}
}
customElements.define('ui-input', UIInput);
