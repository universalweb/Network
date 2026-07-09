/*
	DESCRIPTION: ui-calendar — a hand-rolled month-grid calendar (zero-dep, no
	build). One base owns the grid math, month navigation, and selection; config
	flips it between modes, so ui-range-calendar / ui-event-calendar /
	ui-mini-calendar are thin presets over the same engine.
	  • selectMode 'single' → pick one day (emits calendar:change).
	  • selectMode 'range'  → pick start → end, the span fills (emits calendar:range-change).
	  • showEvents          → render event chips inside day cells.
	  • density 'compact'   → tight mini layout.
	── STANDARD USAGE ───────────────────────────────────────────────────
	  <ui-calendar @calendar:change=${this.handlePick}></ui-calendar>
	─────────────────────────────────────────────────────────────────────
*/
import { WebComponent } from 'webcomponent';
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
function escapeText(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
function buildChips(events, iso) {
	let out = '';
	let count = 0;
	for (let index = 0; index < events.length; index += 1) {
		if (events[index].date !== iso) {
			continue;
		}
		count += 1;
		if (count > 3) {
			break;
		}
		const rawTone = events[index].tone || 'accent';
		const tone = TONE_TOKEN.test(rawTone) ? rawTone : 'accent';
		out += `<span class="cal-chip" data-tone="${tone}">${escapeText(events[index].label)}</span>`;
	}
	return out ? `<span class="cal-chips">${out}</span>` : '';
}
// Per-cell selection/decoration flags. Kept out of gridHtml so the grid loop
// stays a simple assembler (and under the cognitive-complexity bar).
function cellFlags(cell, context) {
	let flags = cell.inMonth ? '' : ' data-out';
	if (cell.isToday) {
		flags += ' data-today';
	}
	if (context.isRange) {
		if (cell.iso === context.rangeStart) {
			flags += ' data-range-start';
		}
		if (cell.iso === context.rangeEnd) {
			flags += ' data-range-end';
		}
		if (context.rangeStart && context.rangeEnd && cell.iso > context.rangeStart && cell.iso < context.rangeEnd) {
			flags += ' data-in-range';
		}
	} else if (cell.iso === context.selected) {
		flags += ' data-selected';
	}
	return flags;
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
	};
	onConnect() {
		if (!this.state.viewYear) {
			const now = new Date();
			this.assignState({
				viewYear: now.getFullYear(),
				viewMonth: now.getMonth(),
			});
		}
	}
	todayIso() {
		const now = new Date();
		return isoOf(now.getFullYear(), now.getMonth(), now.getDate());
	}
	monthTitle() {
		return `${MONTH_NAMES[this.state.viewMonth] || ''} ${this.state.viewYear}`;
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
		const iso = domEvent.target?.dataset?.iso;
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
	weekdayHtml() {
		const labels = orderedWeekdays(this.state.weekStart);
		let out = '';
		for (let index = 0; index < labels.length; index += 1) {
			out += `<span class="cal-wd">${labels[index]}</span>`;
		}
		return out;
	}
	gridHtml() {
		const matrix = buildMonthMatrix(this.state.viewYear, this.state.viewMonth, this.state.weekStart, this.todayIso());
		const selected = this.state.value;
		const rangeStart = this.state.rangeStart;
		const rangeEnd = this.state.rangeEnd;
		const context = {
			selected,
			rangeStart,
			rangeEnd,
			isRange: this.state.selectMode === 'range',
		};
		const events = this.state.showEvents ? this.state.items : [];
		let markup = '';
		for (let index = 0; index < matrix.length; index += 1) {
			const cell = matrix[index];
			const flags = cellFlags(cell, context);
			const isoAttr = cell.inMonth ? ` data-iso="${cell.iso}"` : '';
			const disabledAttr = cell.inMonth ? '' : ' disabled';
			const chips = events.length ? buildChips(events, cell.iso) : '';
			markup += `<button type="button" class="cal-cell"${isoAttr}${flags}${disabledAttr} aria-label="${cell.iso}"><span class="cal-num">${cell.day}</span>${chips}</button>`;
		}
		return markup;
	}
	render() {
		this.html `
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
				<div class="cal-weekdays">^html${this.weekdayHtml()}</div>
				<div class="cal-grid" @click=${this.handleGridClick}>^html${this.gridHtml()}</div>
			</div>
		`;
	}
}
customElements.define('ui-calendar', UICalendar);
