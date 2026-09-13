/*
	DESCRIPTION: ui-timeline — a vertical (default) or horizontal event stream
	(tx history, block events, audit trail). Binds `items[]`
	({ time, label, description, icon, tone }) straight off state via list(); each
	row is a feature-light row (click + circle tooltip; shared CSS — no nested
	timeline-item shadow). Emits timeline:select { item, index }.
	The parent owns orientation + density decoration as host data-* attrs that set
	layout custom properties for the row CSS.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-timeline .state.items=${[
	    { time: '12:04', label: 'Block 4821 sealed', tone: 'success', icon: 'check' },
	    { time: '12:03', label: 'Slow finality', description: '1.8s', tone: 'warning' },
	  ]} .state.orientation=${'vertical'} .state.density=${'normal'}></ui-timeline>
	─────────────────────────────────────────────────────────────────────
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
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
	handleItemClick(domEvent, item, itemIndex) {
		this.emit('timeline:select', {
			item,
			index: itemIndex,
		});
	}
	/*
	 * Feature-light row — @click on the row, tooltip on the plain dot
	 * (not a composed control). Optional icon is a nested ui-icon;
	 * time/desc stay in-DOM with ?hidden when empty.
	 */
	timelineItemRow(item) {
		const tone = item?.tone || 'neutral';
		const icon = item?.icon || '';
		const time = item?.time || '';
		const label = item?.label || '';
		const description = item?.description || '';
		const tip = item?.tooltip || label;
		return this.partial`
			<div class="timeline" role="listitem" @click=${this.handleItemClick}>
				<div class="timeline-rail">
					<span class="timeline-dot" data-tone=${tone} tooltip=${tip}>
						<ui-icon .state.name=${icon} .state.size=${'xs'} ?hidden=${!icon}></ui-icon>
					</span>
					<span class="timeline-line"></span>
				</div>
				<div class="timeline-body">
					<span class="timeline-time" ?hidden=${!time}>${time}</span>
					<span class="timeline-label">${label}</span>
					<span class="timeline-desc" ?hidden=${!description}>${description}</span>
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
