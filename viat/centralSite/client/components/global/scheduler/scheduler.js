/*
	DESCRIPTION: ui-scheduler — month / week / day schedule. Composes
	ui-calendar (month chips), ui-toggle-group (view), and ui-scheduler-event
	rows (day/week agenda). Events are `{ id, label, date, start, end, tone }`.
	── EVENTS ───────────────────────────────────────────────────────────
	  scheduler:select { item, date }
	  scheduler:view { value }
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-scheduler
	    .state.events=${jobs}
	    .state.value=${'2026-08-22'}
	    @scheduler:select=${this.onJob}></ui-scheduler>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-22
*/
import '../calendar/calendar.js';
import '../toggle-group/toggle-group.js';
import {
	formatIsoDate, isArray, parseIsoDate, parseTime, todayIso, WebComponent,
} from 'webcomponent';
import { UISchedulerDay } from '../scheduler-day/scheduler-day.js';
import { UISchedulerEvent } from '../scheduler-event/scheduler-event.js';
const VIEWS = new Set([
	'month',
	'week',
	'day',
]);
const WEEKDAY_SHORT = [
	'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa',
];
function addDays(iso, count) {
	const stamp = parseIsoDate(iso);
	stamp.setDate(stamp.getDate() + count);
	return formatIsoDate(stamp);
}
function startOfWeek(iso, weekStart) {
	const stamp = parseIsoDate(iso);
	const weekday = stamp.getDay();
	const delta = (((weekday - weekStart) % 7) + 7) % 7;
	stamp.setDate(stamp.getDate() - delta);
	return formatIsoDate(stamp);
}
function normalizeView(view) {
	return VIEWS.has(view) ? view : 'month';
}
/**
 * Sort by start minute, tie-breaking on source index. Array#sort is stable in
 * modern engines, but two jobs booked on the same minute is ordinary in
 * dispatch, so the tie-break is stated rather than inherited.
 * @param {object} left - Decorated entry { entry, start, index }.
 * @param {object} right - Decorated entry { entry, start, index }.
 * @returns {number} Comparator result.
 */
function compareStart(left, right) {
	if (left.start !== right.start) {
		return left.start - right.start;
	}
	return left.index - right.index;
}
/*
 * Agenda order. .scheduler-day-list paints in normal flow, so the array
 * order IS the reading order — and a schedule is read down the clock. This is
 * the ordering contract for the agenda views only; ui-schedule-board positions
 * absolutely from --event-start and does not depend on it.
 *
 * An entry with no parseable start is a BACKLOG item, not a point on the
 * timeline, so it keeps source order and sits after the timed run — an
 * unscheduled job can never wedge itself between two booked ones.
 */
function byStartTime(items) {
	const timed = [];
	const untimed = [];
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const entry = items[index];
		const start = parseTime(entry?.start);
		if (Number.isFinite(start)) {
			timed.push({
				entry,
				start,
				index,
			});
			continue;
		}
		untimed.push(entry);
	}
	timed.sort(compareStart);
	const ordered = [];
	const timedCount = timed.length;
	for (let index = 0; index < timedCount; index += 1) {
		ordered.push(timed[index].entry);
	}
	const untimedCount = untimed.length;
	for (let index = 0; index < untimedCount; index += 1) {
		ordered.push(untimed[index]);
	}
	return ordered;
}
export class UIScheduler extends WebComponent {
	static url = import.meta.url;
	static styles = {
		scheduler: './scheduler.css',
	};
	static state = {
		view: 'month',
		value: '',
		weekStart: 0,
		events: [],
		viewItems: [
			{
				value: 'month',
				label: 'Month',
			},
			{
				value: 'week',
				label: 'Week',
			},
			{
				value: 'day',
				label: 'Day',
			},
		],
		calendarItems: [],
		dayEvents: [],
		weekDays: [],
	};
	onConnect() {
		if (!this.state.value) {
			this.state.value = todayIso();
		}
		this.observe([
			'events',
			'value',
			'view',
			'weekStart',
		], this.syncDerived);
		this.syncDerived();
	}
	syncDerived() {
		const events = isArray(this.state.events) ? this.state.events : [];
		const eventCount = events.length;
		const chips = [];
		for (let index = 0; index < eventCount; index += 1) {
			const entry = events[index];
			if (!entry?.date) {
				continue;
			}
			chips.push({
				date: entry.date,
				label: entry.label || '',
				tone: entry.tone || 'accent',
			});
		}
		this.state.calendarItems = chips;
		const selected = this.state.value || todayIso();
		const dayEvents = [];
		for (let index = 0; index < eventCount; index += 1) {
			const entry = events[index];
			if (entry?.date === selected) {
				dayEvents.push(entry);
			}
		}
		this.state.dayEvents = byStartTime(dayEvents);
		const weekStart = Number(this.state.weekStart) || 0;
		const weekAnchor = startOfWeek(selected, weekStart);
		const weekDays = [];
		for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
			const iso = addDays(weekAnchor, dayIndex);
			const items = [];
			for (let index = 0; index < eventCount; index += 1) {
				const entry = events[index];
				if (entry?.date === iso) {
					items.push(entry);
				}
			}
			weekDays.push({
				id: iso,
				iso,
				label: WEEKDAY_SHORT[(weekStart + dayIndex) % 7],
				items: byStartTime(items),
			});
		}
		this.state.weekDays = weekDays;
	}
	viewFlag() {
		return normalizeView(this.state.view);
	}
	hideMonth() {
		return this.viewFlag() !== 'month';
	}
	hideWeek() {
		return this.viewFlag() !== 'week';
	}
	hideDay() {
		return this.viewFlag() !== 'day';
	}
	dayHeading() {
		return this.state.value || todayIso();
	}
	handleView(domEvent) {
		const value = domEvent.detail?.data?.value;
		if (!value || !VIEWS.has(value)) {
			return;
		}
		this.state.view = value;
		this.emit('scheduler:view', {
			value,
		});
	}
	handleDate(domEvent) {
		const value = domEvent.detail?.data?.value || '';
		this.state.value = value || todayIso();
	}
	handleEventSelect(domEvent) {
		const item = domEvent.detail?.data?.item;
		this.emit('scheduler:select', {
			item,
			date: item?.date || this.state.value,
		});
	}
	eventKey(item) {
		return item.id || `${item.date}-${item.start}-${item.label}`;
	}
	dayKey(item) {
		return item.id;
	}
	render() {
		this.html`
			<div class="scheduler" data-view=${this.viewFlag}>
				<header class="scheduler-toolbar">
					<ui-toggle-group
						.state.items=${this.state.viewItems}
						.state.value=${this.state.view}
						.state.size=${'sm'}
						@toggle-group:change=${this.handleView}></ui-toggle-group>
				</header>
				<div class="scheduler-month" ?hidden=${this.hideMonth}>
					<ui-calendar
						.state.showEvents=${true}
						.state.items=${this.state.calendarItems}
						.state.value=${this.state.value}
						.state.weekStart=${this.state.weekStart}
						@calendar:change=${this.handleDate}></ui-calendar>
				</div>
				<div class="scheduler-week" ?hidden=${this.hideWeek} @scheduler-event:select=${this.handleEventSelect}>
					${this.list('weekDays', UISchedulerDay, this.dayKey)}
				</div>
				<section class="scheduler-day" ?hidden=${this.hideDay} @scheduler-event:select=${this.handleEventSelect}>
					<header class="scheduler-day-head">${this.dayHeading}</header>
					<div class="scheduler-day-list">${this.list('dayEvents', UISchedulerEvent, this.eventKey)}</div>
				</section>
			</div>
		`;
	}
}
customElements.define('ui-scheduler', UIScheduler);
