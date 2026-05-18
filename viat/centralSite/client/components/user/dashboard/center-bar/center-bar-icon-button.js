import { IconButtonBase } from '../../../global/icon-button/icon-button.js';
export class CenterBarIconButton extends IconButtonBase {
	static url = import.meta.url;
	static styles = {
		centerBarIconButton: './center-bar-icon-button.css',
	};
	static state = {
		onClick: 'center-bar-action',
		classes: new Set(['tb-icon-btn']),
	};
	iconState() {
		return {
			name: this.state.icon,
			size: 'sm',
		};
	}
}
customElements.define('center-bar-icon-button', CenterBarIconButton);
