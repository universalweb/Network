import '../surface/surface.js';
import { classList, WebComponent } from '../../core/index.js';
/*
	ui-panel — shell for dashboard/pulldown panels. Body is a bare method spot
	(`${this.renderBody}`) so subclasses return `this.htmlElement\`…\`` (Element —
	content spots do NOT mount bare html`` / LightTemplate; that JSON-stringifies).
	One root only. Nested lists: ${this.list(...)} inside the htmlElement. NOT ^html.
*/
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
		panelId: '',
		showDot: true,
		heading: '',
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
		return this.state.showDot ? this.htmlElement`<div class="ph-dot"></div>` : '';
	}
	render() {
		this.html`
			<ui-surface .state=${this.state.surfaceState}>
				<aside class=${classList('panel', this.state.classes)}>
					<div class="panel-header">
						<span>
							<span class="ph-id">${this.state.panelId}</span> // ${this.state.heading}
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
