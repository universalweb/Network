/*
	DESCRIPTION: ui-calendar — a hand-rolled month-grid calendar (zero-dep, no
	build). One base owns the grid math, month navigation, and selection; config
	flips it between modes, so ui-range-calendar / ui-event-calendar /
	ui-mini-calendar are thin presets over the same engine.
	  • selectMode 'single' → pick one day (emits calendar:change).
	  • selectMode 'range'  → pick start → end, the span fills (emits calendar:range-change).
	  • showEvents          → render event chips inside day cells.
	  • density 'compact'   → tight mini layout.
	Weekday labels + day cells render via `list()` light html rows (auto-escaped
	chip labels; no escapeText / `^html` string builder). Grid rebuilds into
	`state.days` / `state.weekdays` at observe-time.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-calendar @calendar:change=${this.handlePick}></ui-calendar>
	─────────────────────────────────────────────────────────────────────
*/
import { html, WebComponent } from 'webcomponent';
const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];
const WEEKDAY_SHORT = [
	'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa',
];
const TONE_TOKEN = /^[\w-]+$/;
function pad2(value) {
	return String(value).padStart(2, '0');
}
function isoOf(year, month, day) {
	return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}
function daysInMonth(year, month) {
	return new Date(year, month + 1, 0).getDate();
}
function firstWeekday(year, month, weekStart) {
	return (((new Date(year, month, 1).getDay() - weekStart) % 7) + 7) % 7;
}
function orderedWeekdays(weekStart) {
	const labels = [];
	for (let index = 0; index < 7; index += 1) {
		labels.push(WEEKDAY_SHORT[(index + weekStart) % 7]);
	}
	return labels;
}
function pushCell(cells, year, month, day, inMonth, todayIso) {
	const iso = isoOf(year, month, day);
	cells.push({
		id: iso,
		day,
		iso,
		inMonth,
		isToday: iso === todayIso,
	});
}
function buildMonthMatrix(year, month, weekStart, todayIso) {
	const cells = [];
	const lead = firstWeekday(year, month, weekStart);
	const dim = daysInMonth(year, month);
	const prevMonth = month === 0 ? 11 : month - 1;
	const prevYear = month === 0 ? year - 1 : year;
	const prevDim = daysInMonth(prevYear, prevMonth);
	for (let offset = lead - 1; offset >= 0; offset -= 1) {
		pushCell(cells, prevYear, prevMonth, prevDim - offset, false, todayIso);
	}
	for (let day = 1; day <= dim; day += 1) {
		pushCell(cells, year, month, day, true, todayIso);
	}
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;
	let trailing = 1;
	while (cells.length % 7 !== 0) {
		pushCell(cells, nextYear, nextMonth, trailing, false, todayIso);
		trailing += 1;
	}
	return cells;
}
function applyCellFlags(cell, context) {
	cell.isSelected = !context.isRange && cell.iso === context.selected;
	cell.isRangeStart = context.isRange && cell.iso === context.rangeStart;
	cell.isRangeEnd = context.isRange && cell.iso === context.rangeEnd;
	cell.isInRange = Boolean(context.isRange &&
		context.rangeStart &&
		context.rangeEnd &&
		cell.iso > context.rangeStart &&
		cell.iso < context.rangeEnd);
}
/* Flatten up to 3 event chips onto the cell as plain fields — light day rows
   cannot nest html`` / arrays (those stringify as TEXT JSON). */
function applyCellChips(cell, items, showEvents) {
	cell.chip0 = '';
	cell.chip0Tone = 'accent';
	cell.chip1 = '';
	cell.chip1Tone = 'accent';
	cell.chip2 = '';
	cell.chip2Tone = 'accent';
	cell.hasChips = false;
	if (!showEvents || !Array.isArray(items)) {
		return;
	}
	const iso = cell.iso;
	let slot = 0;
	const itemCount = items.length;
	for (let index = 0; index < itemCount; index += 1) {
		const eventItem = items[index];
		if (eventItem.date !== iso) {
			continue;
		}
		const rawTone = eventItem.tone || 'accent';
		const tone = TONE_TOKEN.test(rawTone) ? rawTone : 'accent';
		const label = eventItem.label || '';
		if (slot === 0) {
			cell.chip0 = label;
			cell.chip0Tone = tone;
		} else if (slot === 1) {
			cell.chip1 = label;
			cell.chip1Tone = tone;
		} else {
			cell.chip2 = label;
			cell.chip2Tone = tone;
			slot = 3;
			break;
		}
		slot += 1;
	}
	cell.hasChips = slot > 0;
}
export class UICalendar extends WebComponent {
	static url = import.meta.url;
	static styles = {
		calendar: './calendar.css',
	};
	static state = {
		viewYear: 0,
		viewMonth: 0,
		weekStart: 0,
		selectMode: 'single',
		density: 'normal',
		showEvents: false,
		value: '',
		rangeStart: '',
		rangeEnd: '',
		items: [],
		weekdays: [],
		days: [],
	};
	onConnect() {
		if (!this.state.viewYear) {
			const now = new Date();
			this.assignState({
				viewYear: now.getFullYear(),
				viewMonth: now.getMonth(),
			});
		}
		this.observe('viewYear', this.syncGrid);
		this.observe('viewMonth', this.syncGrid);
		this.observe('weekStart', this.syncGrid);
		this.observe('value', this.syncGrid);
		this.observe('rangeStart', this.syncGrid);
		this.observe('rangeEnd', this.syncGrid);
		this.observe('selectMode', this.syncGrid);
		this.observe('showEvents', this.syncGrid);
		this.observe('items', this.syncGrid);
		this.syncGrid();
	}
	todayIso() {
		const now = new Date();
		return isoOf(now.getFullYear(), now.getMonth(), now.getDate());
	}
	monthTitle() {
		return `${MONTH_NAMES[this.state.viewMonth] || ''} ${this.state.viewYear}`;
	}
	syncGrid() {
		const weekStart = this.state.weekStart;
		const labels = orderedWeekdays(weekStart);
		const weekdays = [];
		for (let index = 0; index < labels.length; index += 1) {
			weekdays.push({
				id: index,
				label: labels[index],
			});
		}
		const matrix = buildMonthMatrix(
			this.state.viewYear,
			this.state.viewMonth,
			weekStart,
			this.todayIso()
		);
		const context = {
			selected: this.state.value,
			rangeStart: this.state.rangeStart,
			rangeEnd: this.state.rangeEnd,
			isRange: this.state.selectMode === 'range',
		};
		const showEvents = this.state.showEvents;
		const items = this.state.items;
		const matrixLength = matrix.length;
		for (let index = 0; index < matrixLength; index += 1) {
			const cell = matrix[index];
			applyCellFlags(cell, context);
			applyCellChips(cell, items, showEvents);
		}
		this.assignState({
			weekdays,
			days: matrix,
		});
	}
	shiftMonth(delta) {
		let month = this.state.viewMonth + delta;
		let year = this.state.viewYear;
		if (month < 0) {
			month = 11;
			year -= 1;
		} else if (month > 11) {
			month = 0;
			year += 1;
		}
		this.assignState({
			viewMonth: month,
			viewYear: year,
		});
	}
	handlePrev() {
		this.shiftMonth(-1);
	}
	handleNext() {
		this.shiftMonth(1);
	}
	handleToday() {
		const now = new Date();
		this.assignState({
			viewYear: now.getFullYear(),
			viewMonth: now.getMonth(),
		});
	}
	handleGridClick(domEvent) {
		const button = domEvent.target.closest('button.cal-cell');
		const iso = button?.dataset?.iso;
		if (!iso) {
			return;
		}
		if (this.state.selectMode === 'range') {
			this.applyRange(iso);
			return;
		}
		// Re-clicking the active day clears it, freeing the next pick.
		this.state.value = this.state.value === iso ? '' : iso;
		this.emit('calendar:change', {
			value: this.state.value,
		});
	}
	applyRange(iso) {
		const start = this.state.rangeStart;
		const end = this.state.rangeEnd;
		if (!start || (start && end)) {
			this.assignState({
				rangeStart: iso,
				rangeEnd: '',
			});
		} else if (iso === start) {
			// Re-clicking the lone start day clears the in-progress range.
			this.assignState({
				rangeStart: '',
				rangeEnd: '',
			});
		} else if (iso < start) {
			// Clicked before the start — the old start becomes the end.
			this.assignState({
				rangeStart: iso,
				rangeEnd: start,
			});
		} else {
			this.state.rangeEnd = iso;
		}
		this.emit('calendar:range-change', {
			from: this.state.rangeStart,
			to: this.state.rangeEnd,
		});
	}
	weekdayRow(item) {
		return html`<span class="cal-wd">${item.label}</span>`;
	}
	weekdayKey(item) {
		return item.id;
	}
	/* Light day row — plain values only (no nested html`` / chip arrays). */
	dayRow(cell) {
		return html`<button type="button" class="cal-cell"
			data-iso=${cell.inMonth ? cell.iso : false}
			?data-out=${!cell.inMonth}
			?data-today=${cell.isToday}
			?data-selected=${cell.isSelected}
			?data-range-start=${cell.isRangeStart}
			?data-range-end=${cell.isRangeEnd}
			?data-in-range=${cell.isInRange}
			?disabled=${!cell.inMonth}
			aria-label=${cell.iso}>
			<span class="cal-num">${cell.day}</span>
			<span class="cal-chips" ?hidden=${!cell.hasChips}>
				<span class="cal-chip" data-tone=${cell.chip0Tone} ?hidden=${!cell.chip0}>${cell.chip0}</span>
				<span class="cal-chip" data-tone=${cell.chip1Tone} ?hidden=${!cell.chip1}>${cell.chip1}</span>
				<span class="cal-chip" data-tone=${cell.chip2Tone} ?hidden=${!cell.chip2}>${cell.chip2}</span>
			</span>
		</button>`;
	}
	dayKey(cell) {
		return cell.id;
	}
	render() {
		this.html`
			<div class="cal" data-density=${this.state.density} data-mode=${this.state.selectMode} ?data-events=${this.state.showEvents}>
				<div class="cal-head">
					<button class="cal-nav" type="button" tooltip="Previous month" aria-label="Previous month" @click=${this.handlePrev}>
						<ui-icon .state.name=${'chevron-left'} .state.size=${'sm'}></ui-icon>
					</button>
					<span class="cal-title">${this.monthTitle}</span>
					<button class="cal-nav" type="button" tooltip="Next month" aria-label="Next month" @click=${this.handleNext}>
						<ui-icon .state.name=${'chevron-right'} .state.size=${'sm'}></ui-icon>
					</button>
					<button class="cal-today" type="button" @click=${this.handleToday}>Today</button>
				</div>
				<div class="cal-weekdays">${this.list('weekdays', this.weekdayRow, this.weekdayKey)}</div>
				<div class="cal-grid" @click=${this.handleGridClick}>${this.list('days', this.dayRow, this.dayKey)}</div>
			</div>
		`;
	}
}
customElements.define('ui-calendar', UICalendar);
