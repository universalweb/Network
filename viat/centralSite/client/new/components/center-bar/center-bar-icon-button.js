import { IconButtonBase } from '../icon-button/icon-button.js';
const styles = await IconButtonBase.styleSheet('./center-bar-icon-button.css', import.meta.url);
export class CenterBarIconButton extends IconButtonBase {
	constructor() {
		super([styles]);
		this.state = {
			actionId: '',
			buttonClassName: 'tb-icon-btn icon-font',
			className: '',
			icon: '',
			title: '',
		};
	}
	get activationEventName() {
		return 'center-bar-action';
	}
	buildActivationDetail() {
		return {
			id: this.state.actionId,
			title: this.state.title,
		};
	}
}
customElements.define('center-bar-icon-button', CenterBarIconButton);
