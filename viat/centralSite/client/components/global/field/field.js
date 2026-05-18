import { WebComponent, classList } from '../../core/index.js';
export class UIField extends WebComponent {
	static url = import.meta.url;
	static styles = {
		field: './field.css',
	};
	static state = {
		label: '',
		help: '',
		error: '',
		required: false,
		inline: false,
		size: 'md',
	};
	get hintText() {
		return this.state.error || this.state.help;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class=${classList(
				'field',
				() => {
					return `size-${this.state.size}`;
				},
				() => {
					return this.state.inline && 'is-inline';
				},
				() => {
					return this.state.error && 'has-error';
				},
				() => {
					return this.state.required && 'is-required';
				}
			)}>
				${this.state.label ? `<label class="field-label">${this.state.label}${this.state.required ? '<span class="field-required" aria-hidden="true"> *</span>' : ''}</label>` : ''}
				<div class="field-body"><slot></slot></div>
				${() => {
					return (this.hintText ? `<div class="field-hint">${this.hintText}</div>` : '');
				}}
			</div>
		`;
	}
}
customElements.define('ui-field', UIField);
