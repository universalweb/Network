/*
	DESCRIPTION: ui-toggle — single pressed/unpressed button (Toggle).
	Not a switch (binary track) and not toggle-group. Emits toggle:change { pressed }.
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UIToggle extends WebComponent {
	static url = import.meta.url;
	static styles = {
		toggle: './toggle.css',
	};
	static state = {
		pressed: false,
		disabled: false,
		// outline | ghost | solid
		variant: 'outline',
		size: 'md',
		label: '',
		icon: '',
	};
	handleClick() {
		if (this.state.disabled) {
			return;
		}
		const pressed = !this.state.pressed;
		this.state.pressed = pressed;
		this.emit('toggle:change', {
			pressed,
		});
	}
	render() {
		this.html`
			<button class="tg" type="button"
				data-variant=${this.state.variant}
				data-size=${this.state.size}
				aria-pressed=${this.state.pressed ? 'true' : 'false'}
				?disabled=${this.state.disabled}
				@click=${this.handleClick}>
				<ui-icon class="tg-icon" ?hidden=${!this.state.icon}
					.state.name=${this.state.icon} .state.size=${'sm'}></ui-icon>
				<span class="tg-label" ?hidden=${!this.state.label}>${this.state.label}</span>
				<slot></slot>
			</button>
		`;
	}
}
customElements.define('ui-toggle', UIToggle);
