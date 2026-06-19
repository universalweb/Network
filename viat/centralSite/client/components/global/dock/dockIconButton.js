import { IconButtonBase } from '../icon-button/icon-button.js';
export class DockIconButton extends IconButtonBase {
	static state = {
		onClick: 'dock:select',
	};
}
customElements.define('dock-icon-button', DockIconButton);
