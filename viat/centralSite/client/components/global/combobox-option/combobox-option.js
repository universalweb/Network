/*
	DESCRIPTION: ui-combobox-option — one option row inside ui-combobox.
*/
import { WebComponent } from 'webcomponent';
export class UIComboboxOption extends WebComponent {
	static url = import.meta.url;
	static styles = {
		comboboxOption: './combobox-option.css',
	};
	static state = {
		value: '',
		label: '',
		disabled: false,
		active: false,
	};
	handleClick() {
		if (this.state.disabled) {
			return;
		}
		this.emit('combobox-option:select', {
			value: this.state.value,
			label: this.state.label || String(this.state.value),
			disabled: this.state.disabled,
		});
	}
	render() {
		this.html`
			<button class="cbo" type="button" role="option"
				?disabled=${this.state.disabled}
				?data-active=${this.state.active}
				@mousedown=${this.handleClick}>
				${this.state.label || String(this.state.value)}
			</button>
		`;
	}
}
customElements.define('ui-combobox-option', UIComboboxOption);
