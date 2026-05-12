import { WebComponent } from '../../core/index.js';
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
	get hostClass() {
		const parts = ['field', `size-${this.state.size}`];
		if (this.state.inline) {
			parts.push('is-inline');
		}
		if (this.state.error) {
			parts.push('has-error');
		}
		if (this.state.required) {
			parts.push('is-required');
		}
		return parts.join(' ');
	}
	get hintText() {
		return this.state.error || this.state.help;
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html`
			<div class="${() => this.hostClass}">
				${this.state.label
					? `<label class="field-label">${this.state.label}${this.state.required ? '<span class="field-required" aria-hidden="true"> *</span>' : ''}</label>`
					: ''}
				<div class="field-body"><slot></slot></div>
				${() => this.hintText
					? `<div class="field-hint">${this.hintText}</div>`
					: ''}
			</div>
		`;
	}
}
customElements.define('ui-field', UIField);
