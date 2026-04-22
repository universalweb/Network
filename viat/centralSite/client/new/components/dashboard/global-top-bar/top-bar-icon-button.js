import { IconButtonBase } from '../../icon-button/icon-button.js';
const styles = await IconButtonBase.styleSheet('./top-bar-icon-button.css', import.meta.url);
export class TopBarIconButton extends IconButtonBase {
	constructor(config = {}) {
		super({
			styles: [styles],
		});
		if (config.state?.className) {
			config.state.className.push(...this.state.className);
		}
		Object.assign(this.state, config.state || {});
		this.state?.className.push('tb-icon-btn icon-font');
		console.log('TopBarIconButton state:', this.state, config);
	}
	onClickEventDetail() {
		return {
			id: this.state.actionId ?? this.state.id,
			title: this.state.title,
		};
	}
}
customElements.define('top-bar-icon-button', TopBarIconButton);
