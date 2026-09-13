/*
	DESCRIPTION: ui-scheduler-event — one timed row in a scheduler agenda.
	Receives the event as-is ({ id, label, date, start, end, tone }). Emits
	scheduler-event:select { item, additive, range }. additive = ctrl/cmd,
	  range = shift.
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-scheduler-event .state=${event}
	    @scheduler-event:select=${this.onEvent}></ui-scheduler-event>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import { parseTime, WebComponent } from 'webcomponent';
export class UISchedulerEvent extends WebComponent {
	static url = import.meta.url;
	static styles = {
		schedulerEvent: './scheduler-event.css',
	};
	static state = {
		id: '',
		label: '',
		date: '',
		start: '',
		end: '',
		tone: 'accent',
		track: 0,
		conflict: false,
		selected: false,
	};
	onConnect() {
		this.observe([
			'start',
			'end',
			'track',
		], this.syncTimeVars);
		this.syncTimeVars();
	}
	syncTimeVars() {
		const start = parseTime(this.state.start);
		const end = parseTime(this.state.end);
		this.style.setProperty('--event-start', String(Number.isFinite(start) ? start : 0));
		this.style.setProperty('--event-end', String(Number.isFinite(end) ? end : 0));
		this.style.setProperty('--event-track', String(Number(this.state.track) || 0));
	}
	handlePointerDown(domEvent) {
		if (domEvent.button != null && domEvent.button !== 0) {
			return;
		}
		domEvent.preventDefault();
		if (domEvent.currentTarget?.setPointerCapture && domEvent.pointerId != null) {
			domEvent.currentTarget.setPointerCapture(domEvent.pointerId);
		}
		this.emit('scheduler-event:drag', {
			id: this.state.id,
			clientX: domEvent.clientX,
			clientY: domEvent.clientY,
			pointerId: domEvent.pointerId,
		});
	}
	handleClick(domEvent) {
		this.emit('scheduler-event:select', {
			item: {
				id: this.state.id,
				label: this.state.label,
				date: this.state.date,
				start: this.state.start,
				end: this.state.end,
				tone: this.state.tone,
			},
			additive: domEvent.metaKey === true || domEvent.ctrlKey === true,
			range: domEvent.shiftKey === true,
		});
	}
	timeLabel() {
		const start = this.state.start;
		const end = this.state.end;
		if (start && end) {
			return `${start}–${end}`;
		}
		return start || end || '';
	}
	hideTime() {
		return !this.timeLabel();
	}
	render() {
		this.html`
			<button type="button" class="scheduler-event" data-tone=${this.state.tone || 'accent'} ?data-conflict=${this.state.conflict} aria-selected=${this.state.selected === true ? 'true' : 'false'} @pointerdown=${this.handlePointerDown} @click=${this.handleClick}>
				<span class="scheduler-event-time" ?hidden=${this.hideTime}>${this.timeLabel}</span>
				<span class="scheduler-event-label">${this.state.label}</span>
			</button>
		`;
	}
}
customElements.define('ui-scheduler-event', UISchedulerEvent);
