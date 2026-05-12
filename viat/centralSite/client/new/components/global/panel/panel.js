import '../surface/surface.js';
import { WebComponent, classList } from '../../core/index.js';
export class UIPanel extends WebComponent {
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
	surfaceState() {
		return {
			tone: 'panel',
			padding: 'none',
			radius: 'md',
			border: true,
			elevation: '0',
		};
	}
	renderBody() {
		return '';
	}
	renderDot() {
		return this.state.showDot ? '<div class="ph-dot"></div>' : '';
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-surface .state=${this.surfaceState}>
				<aside class="panel ${classList(this.state.className)}">
					<div class="panel-header">
						<span>
							<span class="ph-id">${this.state.id}</span> // ${this.state.title}
						</span>
						${this.renderDot}
					</div>
					<div class="panel-body">${this.renderBody}</div>
				</aside>
			</ui-surface>
		`;
	}
}
// Backward-compat alias for existing consumers that imported { Panel }.
export { UIPanel as Panel };
customElements.define('ui-panel', UIPanel);
