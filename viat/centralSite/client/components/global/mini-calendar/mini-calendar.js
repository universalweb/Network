/*
	DESCRIPTION: ui-mini-calendar — a ui-calendar preset in compact density: round
	cells, tight type, minimal chrome for sidebars and popovers. Single-date
	selection, all engine inherited from UICalendar.
*/
import { UICalendar } from '../calendar/calendar.js';
export class UIMiniCalendar extends UICalendar {
	static state = {
		density: 'compact',
	};
}
customElements.define('ui-mini-calendar', UIMiniCalendar);
