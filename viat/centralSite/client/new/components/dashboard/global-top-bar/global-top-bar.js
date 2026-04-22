import '../../theme-select/theme-select.js';
import './top-bar-icon-button.js';
import { WebComponent } from '../../base/base.js';
import { each } from '../../base/template.js';
const topBarStyles = await WebComponent.styleSheet('./global-top-bar.css', import.meta.url);
function createActionButton(action) {
	const button = document.createElement('top-bar-icon-button');
	button.state = action;
	return button;
}
export class GlobalTopBar extends WebComponent {
	static get observedAttributes() {
		return ['subtitle'];
	}
	constructor() {
		super([topBarStyles], {
			tooltips: true,
		});
		this.state = {
			actions: [],
			subtitle: '',
		};
	}
	get actions() {
		return this.state.actions;
	}
	set actions(value) {
		this.state.actions = Array.isArray(value) ? value : [];
	}
	get subtitleText() {
		return this.state.subtitle;
	}
	set subtitleText(value) {
		this.state.subtitle = value ?? '';
	}
	onAttributeChange(attributeName, empty, newVal) {
		if (attributeName === 'subtitle') {
			this.state.subtitle = newVal ?? '';
		}
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
			<header class="global-top-bar">
				<div class="tb-logo">
					<span class="tb-logo-mark">⩝</span> VIAT <span class="tb-logo-sep icon-font hidden">&#xe795</span>
					<span class="tb-subtitle">${this.state.subtitle}</span>
				</div>
				<div class="tb-status">
					<ui-theme-select></ui-theme-select>
					${() => {
						return this.buildActionList();
					}}
				</div>
			</header>
		`;
	}
}
customElements.define('global-top-bar', GlobalTopBar);
