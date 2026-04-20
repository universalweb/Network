import {
	hostSheet,
	resetSheet,
	utilsSheet,
} from './componentLibrary/shared-styles.js';
import { WebComponent } from './componentLibrary/base.js';
const host = hostSheet(`
:host {
	display: block;
	flex-shrink: 0;
	width: 100%;
	box-sizing: border-box;
	background: var(--topbar-bg);
	border: 1px solid var(--topbar-border, var(--dark-divider));
	border-radius: 10px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.06);
	overflow: hidden;
	transition: border-color 0.25s, box-shadow 0.25s;
}
:host(:hover) {
	border-color: var(--panel-hover-border);
	box-shadow: var(--panel-hover-shadow);
}
.center-bar {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 16px;
	min-height: 40px;
}
.tb-icon-btn {
	background: transparent;
	border: none;
	color: var(--text-main);
	font-size: 1rem;
	cursor: pointer;
	padding: 4px 8px;
	transition: color 0.15s, text-shadow 0.15s;
}
.tb-icon-btn:hover { color: var(--cyan); }
`);
export class CenterBar extends WebComponent {
	constructor() {
		super([
			resetSheet, host, utilsSheet,
		], {
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
		this.updateState({
			actions: Array.isArray(value) ? value : [],
		});
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
