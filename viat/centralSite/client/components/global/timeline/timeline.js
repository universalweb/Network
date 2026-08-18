/*
	DESCRIPTION: ui-timeline — a vertical (default) or horizontal event stream
	(tx history, block events, audit trail). Binds `items[]`
	({ time, label, description, icon, tone }) straight off state via list(); each
	row is a flat light html row (shared CSS — no nested timeline-item shadow).
	The parent owns orientation + density decoration as host data-* attrs that set
	layout custom properties for the row CSS. Display-only.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-timeline .state.items=${[
	    { time: '12:04', label: 'Block 4821 sealed', tone: 'success', icon: 'check' },
	    { time: '12:03', label: 'Slow finality', description: '1.8s', tone: 'warning' },
	  ]} .state.orientation=${'vertical'} .state.density=${'normal'}></ui-timeline>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { html, WebComponent } from 'webcomponent';
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
		// host isn't template-rendered). CSS turns them into layout custom props.
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
	/*
	 * Plain light row — display only (no @events / tooltip). Optional icon is a
	 * nested ui-icon; time/desc stay in-DOM with ?hidden when empty.
	 */
	timelineItemRow(item) {
		const tone = item?.tone || 'neutral';
		const icon = item?.icon || '';
		const time = item?.time || '';
		const label = item?.label || '';
		const description = item?.description || '';
		return html`
			<div class="tli" role="listitem">
				<div class="tli-rail" aria-hidden="true">
					<span class="tli-dot" data-tone=${tone}>
						<ui-icon .state.name=${icon} .state.size=${'xs'} ?hidden=${!icon}></ui-icon>
					</span>
					<span class="tli-line"></span>
				</div>
				<div class="tli-body">
					<span class="tli-time" ?hidden=${!time}>${time}</span>
					<span class="tli-label">${label}</span>
					<span class="tli-desc" ?hidden=${!description}>${description}</span>
				</div>
			</div>`;
	}
	render() {
		this.html`
			<div class="tl" role="list">
				${this.list('items', this.timelineItemRow, this.itemKey)}
			</div>
		`;
	}
}
customElements.define('ui-timeline', UITimeline);
