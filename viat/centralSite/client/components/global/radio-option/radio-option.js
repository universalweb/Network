import { WebComponent } from 'webcomponent';
export class UIRadioOption extends WebComponent {
	static useShadow = false;
	static state = {
		value: '',
		label: '',
		description: '',
		disabled: false,
	};
	render() {
		this.html`<label class="radio" ?data-disabled=${this.state.disabled}>
			<input type="radio" name="opt" value=${this.state.value} ?disabled=${this.state.disabled}>
			<span class="radio-control" aria-hidden="true"></span>
			<span class="radio-text">
				<span class="radio-label">${this.state.label}</span>
				${this.renderDescription}
			</span>
		</label>`;
	}
	renderDescription() {
		return this.state.description ? this.htmlElement`<span class="radio-desc">${this.state.description}</span>` : '';
	}
}
customElements.define('ui-radio-option', UIRadioOption);
