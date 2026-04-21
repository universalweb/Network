import { WebComponent } from '../../base/base.js';
const bottomBarStyles = await WebComponent.styleSheet('./global-bottom-bar.css', import.meta.url);
export class GlobalBottomBar extends WebComponent {
	constructor() {
		super([bottomBarStyles]);
		this.state = {
			columns: [],
		};
	}
	get columns() {
		return this.state.columns;
	}
	set columns(data) {
		this.state.columns = Array.isArray(data) ? data : [];
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
