/*
	DESCRIPTION: ui-legend — a chart legend. Binds `series[]` ({label, color})
	straight off state via `list()` — items pass through as-is and each
	<ui-legend-item> owns its render AND its own hidden toggle. The parent owns
	only the group concerns: it stamps `interactive` onto items at observe-time
	(never a per-render loop) and aggregates the children's hidden set at
	event-time into `legend:change` (detail.data = {label, active, hidden[]},
	hidden = labels) so a host chart can show/hide series. Blank-slate primitive —
	colours are caller-supplied; it invents none.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-legend .series=${[
	    { label: 'TPS',      color: 'var(--cyan)' },
	    { label: 'Finality', color: 'var(--color-success)' },
	  ]} .interactive=${true}></ui-legend>
	  el.addEventListener('legend:change', e => chart.toggle(e.detail.data.label));
	─────────────────────────────────────────────────────────────────────
*/
import { list, WebComponent } from 'webcomponent';
import { UILegendItem } from './legend-item.js';
export class UILegend extends WebComponent {
	static url = import.meta.url;
	static styles = {
		legend: './legend.css',
	};
	static state = {
		series: [],
		interactive: false,
	};
	onConnect() {
		/*
		 * `interactive` is group config the child needs for its render (button vs
		 * span) — stamped onto the bound items when the inputs change, not mapped
		 * per render. Deep `item.interactive` writes flow through the list binding.
		 */
		this.observe([
			'series',
			'interactive',
		], this.syncInteractive);
		this.syncInteractive();
	}
	syncInteractive() {
		const series = this.state.series;
		if (!Array.isArray(series)) {
			return;
		}
		const interactive = this.state.interactive === true;
		for (let index = 0; index < series.length; index += 1) {
			const item = series[index];
			if (item && item.interactive !== interactive) {
				item.interactive = interactive;
			}
		}
	}
	handleSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		/* The child already flipped itself; aggregate the group's hidden set from
		   the live children (event-time, direct shadow children). */
		const hidden = [];
		const items = this.getComponentsArray('ui-legend-item');
		for (let index = 0; index < items.length; index += 1) {
			if (items[index].state.hidden === true) {
				hidden.push(items[index].state.label);
			}
		}
		this.emit('legend:change', {
			label: data.label,
			active: data.active,
			hidden,
		});
	}
	render() {
		this.html `
			<div class="lg" role="list" @legend-select=${this.handleSelect}>
				${list('series', UILegendItem)}
			</div>
		`;
	}
}
customElements.define('ui-legend', UILegend);
