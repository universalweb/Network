import '../surface/surface.js';
import { WebComponent, classList } from '../../core/index.js';
export class UIPanel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		panelBase: './panel.css',
	};
	static state = {
		// Reactive class set: subclasses seed it with their own identifier
		// (e.g. `new Set(['help-panel'])`) and runtime code adds/removes
		// modifier tokens via `.add(...)` / `.delete(...)`. Framework's
		// class-list spot diffs tokens onto the <aside> element.
		classes: new Set(),
		id: '',
		showDot: true,
		title: '',
		// Child-state for the composed <ui-surface> — a reactive key on the
		// one state tree, bound bare in render(); no method fabricates it.
		surfaceState: {
			tone: 'panel',
			padding: 'none',
			radius: 'md',
			border: true,
			elevation: '0',
		},
	};
	renderBody() {
		return '';
	}
	renderDot() {
		return this.state.showDot ? '<div class="ph-dot"></div>' : '';
	}
	render() {
		// eslint-disable-next-line no-unused-expressions
		this.html `
			<ui-surface .state=${this.state.surfaceState}>
				<aside class=${classList('panel', this.state.classes)}>
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
