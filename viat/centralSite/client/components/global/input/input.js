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
		title: '',
	};
	get hostClass() {
		return `field-shell tone-${this.state.tone} size-${this.state.size}${this.state.disabled ? ' is-disabled' : ''}${this.state.readonly ? ' is-readonly' : ''}`;
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
		this.emit('input', {
			value: domEvent.target.value,
			source: this,
		});
	}
	handleChange(domEvent) {
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
			<div class="${this.hostClass}">
				<span class="field-leading"><slot name="leading"></slot></span>
				<input #input
					class="field-control"
					type="${this.state.type}"
					name="${this.state.name}"
					placeholder="${this.state.placeholder}"
					autocomplete="${this.state.autocomplete}"
					inputmode="${this.state.inputmode}"
					title="${this.state.title}"
					$value="value"
					?disabled=${this.state.disabled}
					?readonly=${this.state.readonly}
					?spellcheck=${this.state.spellcheck}
					@${this.handleInput}
					@change=${this.handleChange}
					@focus=${this.handleFocus}
					@blur=${this.handleBlur}>
				<span class="field-trailing"><slot name="trailing"></slot></span>
			</div>
		`;
	}
}
customElements.define('ui-input', UIInput);
