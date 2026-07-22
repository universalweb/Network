/*
	DESCRIPTION: ui-timeline — a vertical (default) or horizontal event stream
	(tx history, block events, audit trail). Binds `items[]`
	({ time, label, description, icon, tone }) straight off state via list(); each
	row is a <ui-timeline-item> that owns its own render. The parent owns only the
	orientation + density decoration — applied as host data-* attrs that set
	layout custom properties INHERITED into every child shadow (so two timelines
	can share one items array without fighting over it). Display-only.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-timeline .state.items=${[
	    { time: '12:04', label: 'Block 4821 sealed', tone: 'success', icon: 'check' },
	    { time: '12:03', label: 'Slow finality', description: '1.8s', tone: 'warning' },
	  ]} .state.orientation=${'vertical'} .state.density=${'normal'}></ui-timeline>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
import { UITimelineItem } from './timeline-item.js';
export class UITimeline extends WebComponent {
	static url = import.meta.url;
	static styles = {
		timeline: './timeline.css',
	};
	static state = {
		items: [],
		orientation: 'vertical',
		density: 'normal',
	};
	onConnect() {
		// Orientation + density are enumerated visual dims → host data-* attrs (the
		// host isn't template-rendered). The CSS turns them into inherited layout
		// props the children read; nothing is written onto the item objects.
		this.observe([
			'orientation',
			'density',
		], this.reflectDecoration);
		this.reflectDecoration();
	}
	reflectDecoration() {
		this.dataset.orientation = this.state.orientation;
		this.dataset.density = this.state.density;
	}
	itemKey(item) {
		return item.id ?? item.label ?? item.time;
	}
	render() {
		this.html`
			<div class="tl" role="list">
				${this.list('items', UITimelineItem, this.itemKey)}
			</div>
		`;
	}
}
customElements.define('ui-timeline', UITimeline);
