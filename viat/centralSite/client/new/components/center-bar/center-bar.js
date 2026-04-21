import { WebComponent } from '../base/base.js';
const styles = await WebComponent.styleSheet('./center-bar.css', import.meta.url);
export class CenterBar extends WebComponent {
	constructor() {
		super([styles], {
			tooltips: true,
		});
		this.state = {
			actions: [],
		};
		this.addEvent('handleAction', 'click', this.handleClick);
	}
	get actions() {
		return this.state.actions;
	}
	set actions(value) {
		this.state.actions = Array.isArray(value) ? value : [];
	}
	handleClick(e, button) {
		this.emit('center-bar-action', {
			id: button.dataset.id,
			title: button.dataset.title,
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="center-bar">
				${() => {
					return this.state.actions.map((action) => {
						return `
					<button class="tb-icon-btn icon-font${action.className ? ` ${action.className}` : ''}"
						aria-label="${action.title}"
						data-id="${action.id}"
						data-title="${action.title}"
						data-onclick="handleAction"
						data-tooltip="${action.title}">${action.icon}</button>
				`;
					}).join('');
				}}
			</div>
		`;
	}
}
customElements.define('center-bar', CenterBar);
