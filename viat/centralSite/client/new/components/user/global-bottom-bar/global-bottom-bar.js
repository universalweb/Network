import { WebComponent } from '../../core/index.js';
export class GlobalBottomBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		globalBottomBar: './global-bottom-bar.css',
	};
	static state = {
		columns: [],
	};
	render() {
		// eslint-disable-next-line no-unused-expressions
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
