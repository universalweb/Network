/*
	DESCRIPTION: ui-scheduler-day — one day column in week view. Items pass
	through as-is to ui-scheduler-event.
	Author: Universal Web
	Date: 2026-08-22
*/
import { WebComponent } from 'webcomponent';
import { UISchedulerEvent } from '../scheduler-event/scheduler-event.js';
export class UISchedulerDay extends WebComponent {
	static url = import.meta.url;
	static styles = {
		schedulerDay: './scheduler-day.css',
	};
	static state = {
		iso: '',
		label: '',
		items: [],
	};
	eventKey(item) {
		return item.id || `${item.date}-${item.start}-${item.label}`;
	}
	render() {
		this.html`
			<section class="scheduler-day">
				<header class="scheduler-day-head">${this.state.label}
					<span class="scheduler-day-iso">${this.state.iso.slice(8)}</span>
				</header>
				<div class="scheduler-day-list">${this.list('items', UISchedulerEvent, this.eventKey)}</div>
			</section>
		`;
	}
}
customElements.define('ui-scheduler-day', UISchedulerDay);
