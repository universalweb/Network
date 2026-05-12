import { WebComponent } from '../../core/base.js';
export class Panel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		panelBase: './panel.css',
	};
	static state = {
		className: [],
		id: '',
		showDot: true,
		title: '',
	};
	renderBody() {
		return '';
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<aside class="${() => {
				return `panel ${this.state.className?.join(' ') || ''}`;
			}}">
				<div class="panel-header">
					<span>
						<span class="ph-id">${() => this.state.id}</span> // ${() => this.state.title}
					</span>
					${() => {
						return this.state.showDot ? '<div class="ph-dot"></div>' : '';
					}}
				</div>
				<div class="panel-body">${() => this.renderBody()}</div>
			</aside>
		`;
	}
}
customElements.define('ui-panel', Panel);
