/*
	DESCRIPTION: ui-schedule-lane — one resource row on ui-schedule-board.
	Items are assignments passed through as-is to ui-scheduler-event. Position
	inside the canvas is TIME (CSS vars on the event host), not ordinal.
	Author: Universal Web
	Date: 2026-08-28
*/
import { WebComponent } from 'webcomponent';
import { minutesFromRatio } from '../schedule-board/lanes.js';
import { UISchedulerEvent } from '../scheduler-event/scheduler-event.js';
export class UIScheduleLane extends WebComponent {
	static url = import.meta.url;
	static styles = {
		scheduleLane: './schedule-lane.css',
	};
	static state = {
		id: '',
		label: '',
		tone: 'accent',
		items: [],
		trackCount: 1,
	};
	onConnect() {
		this.observe('tone', this.syncHostTone, {
			immediate: true,
		});
	}
	syncHostTone(tone) {
		this.dataset.tone = tone || 'accent';
	}
	eventKey(item) {
		return item.id;
	}
	canvasVars() {
		const tracks = Number(this.state.trackCount);
		const count = Number.isFinite(tracks) && tracks > 0 ? tracks : 1;
		return `--lane-tracks:${count}`;
	}
	minutesAt(clientX) {
		const canvas = this.refs.canvas;
		if (!canvas) {
			return Number.NaN;
		}
		const box = canvas.getBoundingClientRect();
		if (!(box.width > 0)) {
			return Number.NaN;
		}
		const styles = globalThis.getComputedStyle(this);
		const windowStart = Number.parseFloat(styles.getPropertyValue('--schedule-board-start')) || 0;
		const windowSpan = Number.parseFloat(styles.getPropertyValue('--schedule-board-span')) || 1440;
		return minutesFromRatio((clientX - box.left) / box.width, windowStart, windowSpan);
	}
	render() {
		this.html`
			<section class="schedule-lane" data-lane=${this.state.id} data-tone=${this.state.tone || 'accent'}>
				<header class="schedule-lane-rail">${this.state.label}</header>
				<div class="schedule-lane-canvas" #canvas style=${this.canvasVars}>
					${this.list('items', UISchedulerEvent, this.eventKey)}
				</div>
			</section>
		`;
	}
}
customElements.define('ui-schedule-lane', UIScheduleLane);
