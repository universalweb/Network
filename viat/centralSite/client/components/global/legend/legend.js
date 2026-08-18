/*
	DESCRIPTION: ui-legend — shared chart legend. Binds `items[]`
	({ label, color, tip?, detail?, id? }) via list(); each row is a
	this.partial flat node (framework tooltip= + @click) — no nested
	legend-item shadow. Parent stamps `interactive` onto items at
	observe-time and emits legend:change with muted labels.
	orientation: horizontal (wrap row) | vertical (column stack).
	align: start | center | end.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-legend .state.items=${[…]} .state.orientation=${'vertical'}></ui-legend>
	  <ui-legend .state.interactive=${true} @legend:change=${this.handleLegend}>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
export class UILegend extends WebComponent {
	static url = import.meta.url;
	static styles = {
		legend: './legend.css',
	};
	static state = {
		items: [],
		interactive: false,
		// horizontal | vertical
		orientation: 'horizontal',
		// start | center | end
		align: 'start',
	};
	onConnect() {
		/*
		 * `interactive` is group config the row needs (button vs span) — stamped
		 * onto the bound items when the inputs change, not mapped per render.
		 * Deep `item.interactive` writes flow through the list binding.
		 */
		this.observe([
			'items',
			'interactive',
		], this.syncItemFlags);
		this.syncItemFlags();
	}
	syncItemFlags() {
		const series = this.state.items;
		if (!Array.isArray(series)) {
			return;
		}
		const interactive = this.state.interactive === true;
		const count = series.length;
		for (let index = 0; index < count; index += 1) {
			const item = series[index];
			if (!item || typeof item !== 'object') {
				continue;
			}
			if (item.interactive !== interactive) {
				item.interactive = interactive;
			}
			// Prefer explicit tip; fall back to label so hover always has something.
			if (!item.tip && item.label) {
				item.tip = String(item.label);
			}
		}
	}
	/*
	 * Feature-light row: tooltip= + @click when interactive. Host owns muted
	 * toggle (item.muted) — no per-row CE.
	 */
	legendItemRow(item) {
		const tip = item?.tip || '';
		const detail = item?.detail || '';
		const color = item?.color || 'currentColor';
		const label = item?.label || '';
		const swatchStyle = `background:${color}`;
		const pressed = item?.muted === true ? 'false' : 'true';
		if (item?.interactive === true) {
			return this.partial`
				<button type="button" class="lg-item"
					aria-pressed=${pressed}
					tooltip=${tip}
					@click=${this.handleItemClick}>
					<span class="lg-swatch" style=${swatchStyle}></span>
					<span class="lg-label">${label}</span>
					<span class="lg-detail" ?hidden=${!detail}>${detail}</span>
				</button>`;
		}
		return this.partial`
			<span class="lg-item" role="listitem" tooltip=${tip}>
				<span class="lg-swatch" style=${swatchStyle}></span>
				<span class="lg-label">${label}</span>
				<span class="lg-detail" ?hidden=${!detail}>${detail}</span>
			</span>`;
	}
	handleItemClick(_domEvent, item) {
		if (!item || item.interactive !== true) {
			return;
		}
		item.muted = item.muted !== true;
		const muted = [];
		const series = this.state.items;
		if (Array.isArray(series)) {
			const count = series.length;
			for (let index = 0; index < count; index += 1) {
				const entry = series[index];
				if (entry?.muted === true) {
					muted.push(entry.label);
				}
			}
		}
		this.emit('legend:change', {
			label: item.label,
			active: item.muted !== true,
			muted,
		});
	}
	legendOrientation() {
		return this.state.orientation === 'vertical' ? 'vertical' : 'horizontal';
	}
	legendAlign() {
		const align = String(this.state.align || 'start');
		if (align === 'center' || align === 'end') {
			return align;
		}
		return 'start';
	}
	render() {
		this.html`
			<div class="lg" role="list"
				data-orientation=${this.legendOrientation}
				data-align=${this.legendAlign}>
				${this.list('items', this.legendItemRow)}
			</div>
		`;
	}
}
customElements.define('ui-legend', UILegend);
