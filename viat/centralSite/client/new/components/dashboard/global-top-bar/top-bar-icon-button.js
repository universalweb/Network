import { IconButtonBase } from '../../icon-button/icon-button.js';
const styles = await IconButtonBase.styleSheet('./top-bar-icon-button.css', import.meta.url);
export class TopBarIconButton extends IconButtonBase {
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
		return 'topbar-action';
	}
	buildActivationDetail() {
		return {
			id: this.state.actionId,
			title: this.state.title,
		};
	}
}
customElements.define('top-bar-icon-button', TopBarIconButton);
