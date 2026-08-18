/*
	DESCRIPTION: ui-segment-strip — a rounded pill shell of equal-width data
	segments. Generic counterpart to marketing “trust bars”: each segment is a
	structured cell (icon · label · value · description · hint), not free-form HTML.
	── STANDARD INTERACTION ─────────────────────────────────────────────
	  <ui-segment-strip .state.items=${[
	    { id: 'crews', icon: 'users', label: 'Local crews',
	      description: 'Uniformed teams, marked trucks, accountable work.' },
	    { id: 'tps', icon: 'activity', label: 'TPS', value: '9,410',
	      hint: 'peak', tone: 'accent', description: '24h high watermark.' },
	    { id: 'up', icon: 'shield-check', label: 'Uptime', value: '99.98%',
	      tone: 'success', description: 'Rolling 30-day SLA.' },
	  ]}></ui-segment-strip>
	Items pass through as-is to <ui-segment-item>. `muted: true` drops a cell.
	`dividers: false` kills inter-cell rules. `equal: false` sizes cells to content.
	Optional group interactivity stamps `interactive` onto items; selection bubbles:
	  segment-strip:select  { id, value, label }
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import { UISegmentItem } from '../segment-item/segment-item.js';
export class UISegmentStrip extends WebComponent {
	static url = import.meta.url;
	static styles = {
		segmentStrip: './segment-strip.css',
	};
	static state = {
		items: [],
		dividers: true,
		equal: true,
		size: 'md',
		interactive: false,
	};
	onConnect() {
		this.observe([
			'items',
			'interactive',
		], this.syncItemFlags);
		this.syncItemFlags();
	}
	/* Group config the child needs for its render — stamped onto bound items when
	   inputs change, never mapped per render. Deep writes flow through list(). */
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
		}
	}
	handleSelect(domEvent) {
		const data = domEvent.detail?.data;
		if (!data) {
			return;
		}
		this.emit('segment-strip:select', {
			id: data.id,
			value: data.value,
			label: data.label,
		});
	}
	render() {
		this.html`
			<div
				class="strip"
				role="list"
				data-size=${this.state.size || 'md'}
				?data-equal=${this.state.equal !== false}
				?data-flat=${!this.state.dividers}
				@segment-item:select=${this.handleSelect}>
				${this.filter('items', UISegmentItem, 'muted')}
			</div>
		`;
	}
}
customElements.define('ui-segment-strip', UISegmentStrip);
