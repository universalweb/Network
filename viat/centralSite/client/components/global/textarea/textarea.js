/*
	DESCRIPTION: ui-textarea — multiline text control, same shell language as
	ui-input (tone / size / disabled / readonly / invalid). Emits textarea:input
	and textarea:change with { value }.
*/
import { WebComponent } from 'webcomponent';
export class UITextarea extends WebComponent {
	static url = import.meta.url;
	static styles = {
		textarea: './textarea.css',
	};
	static attrs = {
		spellcheck: 'true',
	};
	static state = {
		value: '',
		placeholder: '',
		disabled: false,
		readonly: false,
		invalid: false,
		tone: 'default',
		size: 'md',
		name: '',
		rows: 4,
		maxlength: 0,
		minlength: 0,
		// Hover hint — never native title.
		tooltip: '',
		// Auto-grow with content when true.
		autoResize: false,
	};
	get value() {
		return this.state.value;
	}
	set value(next) {
		this.state.value = String(next ?? '');
	}
	focus() {
		this.refs.input?.focus();
	}
	blur() {
		this.refs.input?.blur();
	}
	handleInput(domEvent) {
		domEvent.stopPropagation();
		this.state.value = domEvent.target.value;
		if (this.state.autoResize) {
			this.fitHeight();
		}
		this.emit('textarea:input', {
			value: this.state.value,
		});
	}
	handleChange(domEvent) {
		domEvent.stopPropagation();
		this.emit('textarea:change', {
			value: domEvent.target.value,
		});
	}
	fitHeight() {
		const field = this.refs.input;
		if (!field) {
			return;
		}
		field.style.blockSize = 'auto';
		field.style.blockSize = `${field.scrollHeight}px`;
	}
	onRendered() {
		if (this.state.autoResize) {
			this.fitHeight();
		}
	}
	render() {
		const tone = this.state.invalid ? 'error' : this.state.tone;
		this.html`
			<div class="ta-shell" data-tone=${tone} data-size=${this.state.size}
				?data-disabled=${this.state.disabled}
				?data-readonly=${this.state.readonly}
				?data-invalid=${this.state.invalid}>
				<textarea #input class="ta-control"
					name=${this.state.name}
					placeholder=${this.state.placeholder}
					rows=${this.state.rows}
					tooltip=${this.state.tooltip}
					$value="value"
					?disabled=${this.state.disabled}
					?readonly=${this.state.readonly}
					aria-invalid=${this.state.invalid ? 'true' : 'false'}
					spellcheck=${this.attrs.spellcheck}
					@input=${this.handleInput}
					@change=${this.handleChange}></textarea>
			</div>
		`;
	}
}
customElements.define('ui-textarea', UITextarea);
