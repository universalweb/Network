import '../surface/surface.js';
import { WebComponent, classList } from '../../core/index.js';
export class UIPanel extends WebComponent {
	static url = import.meta.url;
	static styles = {
		panelBase: './panel.css',
	};
	/*
	 * Per-theme RULE overrides for panels live in `./themes/{id}.css` and are
	 * adopted into the shadow root by theme (core/environment/themeStyles.js) —
	 * the document-level theme sheet only carries tokens, which can't reach a
	 * shadow root. Every Panel subclass inherits this layer via the chain walk.
	 */
	static themes = [
		'midnight', 'dark', 'marathon', 'hypr', 'gnosis',
	];
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
		this.html `
			<ui-surface .state=${this.state.surfaceState}>
				<aside class=${classList('panel', this.state.classes)}>
					<div class="panel-header">
						<span>
							<span class="ph-id">${this.state.id}</span> // ${this.state.title}
						</span>
						^html${this.renderDot}
					</div>
					<div class="panel-body">^html${this.renderBody}</div>
				</aside>
			</ui-surface>
		`;
	}
}
// Backward-compat alias for existing consumers that imported { Panel }.
export { UIPanel as Panel };
customElements.define('ui-panel', UIPanel);
