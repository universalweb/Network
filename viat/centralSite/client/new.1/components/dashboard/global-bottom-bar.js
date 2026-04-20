import {
	hostSheet,
	loadSheet,
	resetSheet,
} from '../componentLibrary/shared-styles.js';
import { WebComponent } from '../componentLibrary/base.js';
const bottomBarStyles = await loadSheet(new URL('../../styles/global-bottom-bar.css', import.meta.url));
const host = hostSheet(`:host { display: block; }`);
export class GlobalBottomBar extends WebComponent {
	constructor() {
		super([
			resetSheet, host, bottomBarStyles,
		]);
		this.state = {
			columns: [],
		};
	}
	get columns() {
		return this.state.columns;
	}
	set columns(data) {
		this.updateState({
			columns: Array.isArray(data) ? data : [],
		});
	}
	render() {
		this.html `
			<footer class="global-bottom-bar">
				${() => {
					return this.state.columns.map((item) => {
						return `
					<div class="bb-item">
						<span class="bb-key">${item.label}</span>
						<span class="bb-val${item.className ? ` ${item.className}` : ''}">${item.value}</span>
					</div>
				`;
					}).join('');
				}}
			</footer>
		`;
	}
}
customElements.define('global-bottom-bar', GlobalBottomBar);
