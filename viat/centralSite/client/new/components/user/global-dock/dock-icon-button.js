import { IconButtonBase } from '../../global/icon-button/icon-button.js';
export class DockIconButton extends IconButtonBase {
	static url = import.meta.url;
	static styles = {
		dockIconButton: './dock-icon-button.css',
	};
	static state = {
		className: ['rail-icon-btn'],
		onClick: 'dockSelect',
	};
	constructor(state = {}, config = {}) {
		super(state, config);
		console.log('DockIconButton state', this.state);
	}
	onMount() {
		super.onMount();
		if (this.state.active) {
			this.emit(this.state.onClick, {});
		}
	}
}
customElements.define('dock-icon-button', DockIconButton);
