/*
	One entry in a <ui-timeline>. Receives its item as-is
	({ time, label, description, icon, tone }) and renders a tone-coloured marker
	dot (optional icon) on a connector rail + a time/label/description body. The
	rail's connector line is hidden on the last item via :host(:last-child). The
	vertical↔horizontal layout is driven entirely by --tli-* props inherited from
	the parent, so the child holds no orientation state. Display-only — no events.
*/
import '../icon/icon.js';
import { WebComponent } from 'webcomponent';
export class UITimelineItem extends WebComponent {
	static url = import.meta.url;
	static styles = {
		timelineItem: './timeline-item.css',
	};
	static state = {
		time: '',
		label: '',
		description: '',
		icon: '',
		tone: 'neutral',
	};
	render() {
		this.html`
			<div class="tli" role="listitem">
				<div class="tli-rail" aria-hidden="true">
					<span class="tli-dot" data-tone=${this.state.tone || 'neutral'}>${this.markerIcon}</span>
					<span class="tli-line"></span>
				</div>
				<div class="tli-body">
					${this.timeNode}
					<span class="tli-label">${this.state.label}</span>
					${this.descNode}
				</div>
			</div>
		`;
	}
	markerIcon() {
		return this.state.icon ? this.htmlElement`<ui-icon .state.name=${this.state.icon} .state.size=${'xs'}></ui-icon>` : '';
	}
	timeNode() {
		return this.state.time ? this.htmlElement`<span class="tli-time">${this.state.time}</span>` : '';
	}
	descNode() {
		return this.state.description ? this.htmlElement`<span class="tli-desc">${this.state.description}</span>` : '';
	}
}
customElements.define('ui-timeline-item', UITimelineItem);
