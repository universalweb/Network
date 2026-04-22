import './center-bar-icon-button.js';
import { WebComponent } from '../base/base.js';
import { each } from '../base/template.js';
const styles = await WebComponent.styleSheet('./center-bar.css', import.meta.url);
function createActionButton(action) {
	const button = document.createElement('center-bar-icon-button');
	button.state = action;
	return button;
}
export class CenterBar extends WebComponent {
	constructor() {
		super([styles], {
			tooltips: true,
		});
		this.state = {
			actions: [],
		};
	}
	get actions() {
		return this.state.actions;
	}
	set actions(value) {
		this.state.actions = Array.isArray(value) ? value : [];
	}
	buildActionItem(action, index) {
		return {
			actionId: action?.id,
			className: action?.className ?? '',
			icon: action?.icon ?? '',
			key: action?.id ?? action?.title ?? index,
			title: action?.title ?? '',
		};
	}
	buildActionList() {
		const actionItems = this.state.actions.map((action, index) => {
			return this.buildActionItem(action, index);
		});
		return each(actionItems, createActionButton, (action, index) => {
			return action.key ?? index;
		});
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<div class="center-bar">
				${() => {
					return this.buildActionList();
				}}
			</div>
		`;
	}
}
customElements.define('center-bar', CenterBar);
