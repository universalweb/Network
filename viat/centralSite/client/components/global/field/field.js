import { WebComponent } from '../../core/index.js';
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
	};
	/* error wins over help — read in two spots (hint visibility + hint text), so it
	   stays a getter rather than inlining the expression twice. */
	get hintText() {
		return this.state.error || this.state.hint;
	}
	render() {
		this.html`
			<div
				class="field"
				data-size=${this.state.size}
				?data-inline=${this.state.inline}
				?data-error=${this.state.error}>
				<label class="field-label" ?hidden=${!this.state.label}>${this.state.label}<span class="field-required" aria-hidden="true" ?hidden=${!this.state.required}> *</span></label>
				<div class="field-body"><slot></slot></div>
				<div class="field-hint" ?hidden=${!this.hintText}>${this.hintText}</div>
			</div>
		`;
	}
}
customElements.define('ui-field', UIField);
