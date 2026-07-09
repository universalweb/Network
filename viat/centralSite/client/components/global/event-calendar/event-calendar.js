/*
	DESCRIPTION: ui-event-calendar — a ui-calendar preset that renders event chips
	inside each day cell (taller cells, number top-right). Feed it
	.state.items=${[{ date: '2026-06-13', label: 'DAO vote', tone: 'accent' }, …]}.
	Inherits grid + nav + single-date selection from UICalendar.
*/
import { UICalendar } from '../calendar/calendar.js';
export class UIEventCalendar extends UICalendar {
	static state = {
		showEvents: true,
	};
}
customElements.define('ui-event-calendar', UIEventCalendar);
