import { IconButtonBase } from '../../global/icon-button/icon-button.js';
export class DockIconButton extends IconButtonBase {
	static url = import.meta.url;
	static styles = {
		dockIconButton: './dock-icon-button.css',
	};
	static state = {
		className: ['rail-icon-btn icon-font'],
	};
}
customElements.define('dock-icon-button', DockIconButton);
