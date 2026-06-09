import { WebComponent, each } from 'webcomponent';
import '../bar/bar.js';
import { UIStatusCell } from './status-cell.js';
// `<ui-status-bar>` — a bottom-fixed status bar. Composes `<ui-bar>`: the
// `cells` config renders as `<ui-status-cell>`s in the start region; the `end`
// slot takes a trailing region (e.g. a connection badge). Pure chrome — no
// app content baked in. Per-cell `hidden` drops a cell reactively.
export class UIStatusBar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		statusBar: './status-bar.css',
	};
	static state = {
		cells: [],
		dividers: true,
	};
	cellItems() {
		// Genuine computation feeding each(): drop hidden cells, attach the
		// divider flag. Not a child `.state` fabricator — this is a list source.
		const cells = this.state.cells || [];
		const dividers = this.state.dividers !== false;
		const out = [];
		for (let index = 0; index < cells.length; index += 1) {
			const cell = cells[index];
			if (cell.hidden) {
				continue;
			}
			out.push({
				label: cell.label,
				value: cell.value,
				valueClass: cell.valueClass || '',
				divider: dividers,
			});
		}
		return out;
	}
	cellKey(item) {
		return item.label;
	}
	render() {
		
		this.html`
			<ui-bar class="status-bar">
				<div slot="start" class="status-cells">
					${each(this.cellItems(), UIStatusCell, this.cellKey)}
				</div>
				<slot slot="end" name="end"></slot>
			</ui-bar>
		`;
	}
}
customElements.define('ui-status-bar', UIStatusBar);
