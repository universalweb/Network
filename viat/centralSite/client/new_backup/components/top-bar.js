import {
	hostSheet,
	loadSheet,
	resetSheet,
} from './shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
import './theme-select.js';
const topBarStyles = await loadSheet(new URL('../styles/top-bar.css', import.meta.url));
const host = hostSheet(`
:host {
	display: block;
	height: 100%;
	min-height: 56px;
	width: 100%;
	box-sizing: border-box;
}
`);
export class ViatTopBar extends WebComponent {
	static get observedAttributes() {
		return [
			'network',
			'subtitle',
		];
	}
	constructor() {
		super([
			resetSheet,
			host,
			topBarStyles,
		], {
			tooltips: true,
		});
		this.state = {
			actions: [],
			network: '',
			subtitle: '',
		};
		this.addEvent('handleTopBarAction', 'click', this.handleClick);
	}
	get actions() {
		return this.state.actions;
	}
	set actions(value) {
		this.updateState({
			actions: Array.isArray(value) ? value : [],
		});
	}
	get networkName() {
		return this.state.network;
	}
	set networkName(value) {
		this.updateState({
			network: value ?? '',
		});
	}
	get subtitleText() {
		return this.state.subtitle;
	}
	set subtitleText(value) {
		this.updateState({
			subtitle: value ?? '',
		});
	}
	onAttributeChange(attributeName, empty, newVal) {
		const nextState = {};
		if (attributeName === 'network') {
			nextState.network = newVal ?? '';
		}
		if (attributeName === 'subtitle') {
			nextState.subtitle = newVal ?? '';
		}
		if (Object.keys(nextState).length) {
			this.updateState(nextState);
		}
	}
	handleClick(e, button) {
		this.emit('topbar-action', {
			id: button.dataset.id,
			title: button.dataset.title,
		});
	}
	render() {
		const {
			actions,
			network,
			subtitle,
		} = this.state;
		this.shadowRoot.innerHTML = `
			<header class="top-bar">
				<div class="tb-logo">
					<span class="tb-logo-mark">⩝</span> VIAT <span class="tb-logo-sep hidden">//</span>
					<span class="tb-subtitle">${subtitle}</span>
				</div>
				<div class="tb-status">
					${actions.map((action) => {
						return `<button class="tb-icon-btn icon-font" aria-label="${action.title}" data-id="${action.id}" data-title="${action.title}" data-onclick="handleTopBarAction" data-tooltip="${action.title}">${action.icon}</button>`;
					}).join('')}
					<viat-theme-select></viat-theme-select>
					<div class="tb-network-badge">${network}</div>
				</div>
			</header>
		`;
	}
}
customElements.define('viat-top-bar', ViatTopBar);
