import { WebComponent } from '../../core/index.js';
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
		// Hover hint. `tooltip`, never `title` — `title` is a native HTMLElement property
		// that a `.title=` binding would hijack before it reached state (the button footgun).
		tooltip: '',
	};
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
	render() {
		this.html`
			<div
				class="field-shell"
				data-tone=${this.state.tone}
				data-size=${this.state.size}
				?data-disabled=${this.state.disabled}
				?data-readonly=${this.state.readonly}>
				<span class="field-leading"><slot name="leading"></slot></span>
				<input #input
					class="field-control"
					type=${this.state.type}
					name=${this.state.name}
					placeholder=${this.state.placeholder}
					autocomplete=${this.state.autocomplete}
					inputmode=${this.state.inputmode}
					tooltip=${this.state.tooltip}
					$value="value"
					?disabled=${this.state.disabled}
					?readonly=${this.state.readonly}
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
