/*
	DESCRIPTION: ui-range-calendar — a ui-calendar preset in range mode. Click a
	start day then an end day; the span between fills. Emits calendar:range-change
	{ from, to }. All grid + nav logic inherited from UICalendar.
*/
import { UICalendar } from '../calendar/calendar.js';
export class UIRangeCalendar extends UICalendar {
	static state = {
		selectMode: 'range',
	};
}
customElements.define('ui-range-calendar', UIRangeCalendar);
