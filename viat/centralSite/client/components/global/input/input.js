import { WebComponent } from '../../core/index.js';
export class UIInput extends WebComponent {
	static url = import.meta.url;
	static styles = {
		input: './input.css',
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
		spellcheck: true,
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
		// of this shadow and reach a consumer's `@input`/`@change` ALONGSIDE the custom
		// event we re-emit — and the native one has no `detail.data`, so the documented
		// `e.detail.data.value` read throws. stopPropagation (NOT stopImmediate) blocks
		// only bubbling; the same-element `$value` @bind still fires, so state.value tracks.
		domEvent.stopPropagation();
		this.emit('input', {
			value: domEvent.target.value,
			source: this,
		});
	}
	handleChange(domEvent) {
		domEvent.stopPropagation();
		this.emit('change', {
			value: domEvent.target.value,
			source: this,
		});
	}
	handleFocus() {
		this.emit('focus', {
			source: this,
		});
	}
	handleBlur() {
		this.emit('blur', {
			source: this,
		});
	}
	render() {
		this.html `
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
					?spellcheck=${this.state.spellcheck}
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
