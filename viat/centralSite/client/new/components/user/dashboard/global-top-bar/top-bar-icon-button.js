import { IconButtonBase } from '../../../global/icon-button/icon-button.js';
export class TopBarIconButton extends IconButtonBase {
	static url = import.meta.url;
	static styles = {
		topBarIconButton: './top-bar-icon-button.css',
	};
	static state = {
		classes: new Set(['tb-icon-btn', 'icon-font']),
	};
}
customElements.define('top-bar-icon-button', TopBarIconButton);
