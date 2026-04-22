import { IconButtonBase } from '../../icon-button/icon-button.js';
const styles = await IconButtonBase.styleSheet('./dock-icon-button.css', import.meta.url);
export class DockIconButton extends IconButtonBase {
	constructor(config = {}) {
		super({
			styles: [styles],
			state: {
				onClick: 'nav-select',
			},
		});
		if (config.state?.className) {
			config.state.className.push(...this.state.className);
		}
		Object.assign(this.state, config.state || {});
		this.state?.className.push('rail-icon-btn icon-font');
		console.log('DockIconButton state:', this.state);
	}
	onClickEventDetail() {
		return {
			label: this.state.label,
		};
	}
}
customElements.define('dock-icon-button', DockIconButton);
