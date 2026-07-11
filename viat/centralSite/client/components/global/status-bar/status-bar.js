import '../bar/bar.js';
import { WebComponent } from 'webcomponent';
import { UIStatusCell } from './status-cell.js';
// `<ui-status-bar>` — a bottom-fixed status bar. Composes `<ui-bar>`: the
// `items` config renders as `<ui-status-cell>`s in the start region; the `end`
// slot takes a trailing region (e.g. a connection badge). Pure chrome — no
// app content baked in. Per-cell `hidden` drops a cell reactively (the `filter`
// keep-predicate), and the inter-cell separator is positional CSS (status-cell.css)
// gated by the shared `dividers` flag — no per-item enrichment.
export class UIStatusBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		statusBar: './status-bar.css',
	};
	static state = {
		items: [],
		dividers: true,
	};
	// Cells carry no id → key by the stable `label`.
	cellKey(item) {
		return item.label;
	}
	render() {
		this.html`
			<ui-bar class="status-bar">
				<div slot="start" class="status-cells" ?data-flat=${!this.state.dividers}>
					${this.filter('items', UIStatusCell, 'hidden', this.cellKey)}
				</div>
				<slot slot="end" name="end"></slot>
			</ui-bar>
		`;
	}
}
customElements.define('ui-status-bar', UIStatusBar);
