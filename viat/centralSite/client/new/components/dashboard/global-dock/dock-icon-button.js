import { IconButtonBase } from '../../icon-button/icon-button.js';
const styles = await IconButtonBase.styleSheet('./dock-icon-button.css', import.meta.url);
export class DockIconButton extends IconButtonBase {
	constructor() {
		super([styles]);
		this.state = {
			active: false,
			buttonClassName: 'rail-icon-btn icon-font',
			icon: '',
			label: '',
			title: '',
		};
	}
	get activationEventName() {
		return 'nav-select';
	}
	buildActivationDetail() {
		return {
			label: (this.state.label ?? '').toLowerCase(),
		};
	}
}
customElements.define('dock-icon-button', DockIconButton);
