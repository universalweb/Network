import '../../theme-select/theme-select.js';
import { WebComponent } from '../../base/base.js';
const topBarStyles = await WebComponent.styleSheet('./global-top-bar.css', import.meta.url);
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
		this.addEvent('handleTopBarAction', 'click', this.handleClick);
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
	handleClick(e, button) {
		this.emit('topbar-action', {
			id: button.dataset.id,
			title: button.dataset.title,
		});
	}
	render() {
		return this.html `
			<header class="global-top-bar">
				<div class="tb-logo">
					<span class="tb-logo-mark">⩝</span> VIAT <span class="tb-logo-sep icon-font hidden">&#xe795</span>
					<span class="tb-subtitle">${this.state.subtitle}</span>
				</div>
				<div class="tb-status">
					<ui-theme-select></ui-theme-select>
					${() => {
						return this.state.actions.map((action) => {
							return `
						<button class="tb-icon-btn icon-font${action.className ? ` ${action.className}` : ''}"
							aria-label="${action.title}"
							data-id="${action.id}"
							data-title="${action.title}"
							data-onclick="handleTopBarAction"
							data-tooltip="${action.title}">${action.icon}</button>
					`;
						}).join('');
					}}
				</div>
			</header>
		`;
	}
}
customElements.define('global-top-bar', GlobalTopBar);
