/*
	DESCRIPTION: Pure resource-lane grouping for ui-schedule-board.
	Master `items` are ASSIGNMENTS `{ id, jobId, resourceId, start, end }`,
	not jobs — one item, one lane. Conflicts and overlap tracks use
	core/time/interval.js (half-open [start, end)). Recurring items carry
	`recurrence` (RRULE subset); expandAssignments materialises the visible
	day only. Occurrence edits are out of scope.
	Author: Universal Web
	Date: 2026-08-28
*/
import { isArray } from '@universalweb/utilitylib';
import { groupIntoLanes } from '../../core/board/items.js';
import {
	formatIsoDate, formatTime, parseIsoDate, parseTime,
} from '../../core/time/format.js';
import {
	durationOf,
	findConflicts,
	MINUTES_PER_DAY,
	snapTo,
} from '../../core/time/interval.js';
import { expandAssignments } from '../../core/time/recurrence.js';
/**
 * `{ start, end }` in minutes from an assignment's clock fields.
 * Invalid clocks yield null so they cannot falsely overlap.
 * @param {{start?: *, end?: *}} item - Assignment.
 * @returns {{start: number, end: number, item: object}|null} Numeric interval.
 */
export function numericInterval(item) {
	if (!item) {
		return null;
	}
	const start = parseTime(item.start);
	const end = parseTime(item.end);
	if (!Number.isFinite(start) || !Number.isFinite(end)) {
		return null;
	}
	return {
		start,
		end,
		item,
	};
}
/**
 * Write `conflict` onto each member that overlaps another in `items`.
 * Skips invalid clocks. Uses findConflicts (half-open).
 * @param {Array<object>} items - Assignments in one resource lane.
 * @returns {void}
 */
export function markConflicts(items) {
	if (!isArray(items)) {
		return;
	}
	const count = items.length;
	const intervals = [];
	for (let index = 0; index < count; index += 1) {
		const interval = numericInterval(items[index]);
		if (interval) {
			intervals.push(interval);
		} else if (items[index]) {
			items[index].conflict = false;
		}
	}
	const intervalCount = intervals.length;
	for (let index = 0; index < intervalCount; index += 1) {
		const hits = findConflicts(intervals[index], intervals);
		intervals[index].item.conflict = hits.length > 0;
	}
}
/**
 * Greedy track index so overlapping assignments in one lane do not share a
 * row. Back-to-back (non-overlapping) stay on track 0.
 * Writes `track` onto each item. Returns the lane's track count (≥ 1).
 * @param {Array<object>} items - Assignments in one resource lane.
 * @returns {number} Occupied tracks.
 */
export function assignTracks(items) {
	if (!isArray(items) || items.length === 0) {
		return 1;
	}
	const count = items.length;
	const tracks = [];
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		const interval = numericInterval(item);
		if (!interval) {
			item.track = 0;
			if (tracks.length === 0) {
				tracks.push([]);
			}
			continue;
		}
		let placed = false;
		const trackCount = tracks.length;
		for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
			if (findConflicts(interval, tracks[trackIndex]).length === 0) {
				tracks[trackIndex].push(interval);
				item.track = trackIndex;
				placed = true;
				break;
			}
		}
		if (!placed) {
			item.track = tracks.length;
			tracks.push([interval]);
		}
	}
	return tracks.length || 1;
}
/**
 * Day window in minutes. Inverted or invalid end snaps to 1440.
 * @param {string|number} start - Clock or minutes.
 * @param {string|number} end - Clock or minutes.
 * @returns {{start: number, end: number, span: number}} Window.
 */
export function dayWindow(start, end) {
	const from = parseTime(start);
	const to = parseTime(end);
	const windowStart = Number.isFinite(from) ? from : 0;
	let windowEnd = Number.isFinite(to) ? to : MINUTES_PER_DAY;
	if (windowEnd <= windowStart) {
		windowEnd = MINUTES_PER_DAY;
	}
	return {
		start: windowStart,
		end: windowEnd,
		span: windowEnd - windowStart,
	};
}
/**
 * Percent offset of a minute mark inside a window. 0 when span is not positive.
 * @param {number} value - Minutes from midnight.
 * @param {number} windowStart - Window start minutes.
 * @param {number} windowSpan - Window length.
 * @returns {number} Percent in `[0, …]`.
 */
/**
 * Minute mark for a 0–1 position along a day window.
 * @param {number} ratio - Fraction of the canvas (may be outside 0–1).
 * @param {number} windowStart - Window start minutes.
 * @param {number} windowSpan - Window length.
 * @returns {number} Minutes from midnight.
 */
export function minutesFromRatio(ratio, windowStart, windowSpan) {
	if (!(windowSpan > 0) || !Number.isFinite(ratio)) {
		return windowStart;
	}
	let clamped = ratio;
	if (ratio < 0) {
		clamped = 0;
	} else if (ratio > 1) {
		clamped = 1;
	}
	return windowStart + (clamped * windowSpan);
}
/**
 * Snap a start instant onto the grid and keep the block inside the window.
 * @param {number} minutes - Unsnapped start.
 * @param {number} stepMinutes - Grid size (`snapTo`).
 * @param {number} windowStart - Window start.
 * @param {number} windowEnd - Window end.
 * @param {number} duration - Block length (end − start).
 * @returns {number} Snapped start.
 */
export function snapStart(minutes, stepMinutes, windowStart, windowEnd, duration) {
	const snapped = snapTo(minutes, stepMinutes);
	const span = duration > 0 ? duration : 0;
	const maxStart = windowEnd - span;
	const high = maxStart >= windowStart ? maxStart : windowStart;
	if (!Number.isFinite(snapped)) {
		return windowStart;
	}
	if (snapped < windowStart) {
		return windowStart;
	}
	if (snapped > high) {
		return high;
	}
	return snapped;
}
/**
 * Write a new snapped start (duration preserved) and optional resource onto
 * an assignment. Overbooking is allowed — callers re-run `markConflicts`.
 * @param {object} item - Assignment.
 * @param {number} startMinutes - New start.
 * @param {string} [resourceId] - New lane when crossing resources.
 * @param {string} [laneField] - Field the lane id is written to.
 * @returns {object} The same item.
 */
export function applyReschedule(item, startMinutes, resourceId, laneField = 'resourceId') {
	const interval = numericInterval(item);
	const duration = interval ? durationOf(interval) : 0;
	const span = duration > 0 ? duration : 0;
	item.start = formatTime(startMinutes);
	item.end = formatTime(startMinutes + span);
	if (resourceId != null && resourceId !== '') {
		item[laneField] = resourceId;
	}
	return item;
}
export function timePercent(value, windowStart, windowSpan) {
	if (!(windowSpan > 0) || !Number.isFinite(value)) {
		return 0;
	}
	return ((value - windowStart) / windowSpan) * 100;
}
/**
 * Inclusive tick marks from windowStart to windowEnd at `step` minutes.
 * @param {number} windowStart - Start minutes.
 * @param {number} windowEnd - End minutes.
 * @param {number} step - Grid size in minutes.
 * @returns {Array<{id: string, label: string, start: number, percent: number}>} Ticks.
 */
export function ticksForWindow(windowStart, windowEnd, step) {
	const ticks = [];
	const span = windowEnd - windowStart;
	if (!(span > 0) || !(step > 0)) {
		return ticks;
	}
	for (let minute = windowStart; minute <= windowEnd; minute += step) {
		ticks.push({
			id: `t${minute}`,
			label: formatTime(minute),
			start: minute,
			percent: timePercent(minute, windowStart, span),
		});
	}
	return ticks;
}
/**
 * Next local calendar day after `iso`. Invalid → ''.
 * @param {string} iso - YYYY-MM-DD.
 * @returns {string} Next ISO day.
 */
export function nextIsoDay(iso) {
	const stamp = parseIsoDate(iso);
	if (!Number.isFinite(stamp.getTime())) {
		return '';
	}
	stamp.setDate(stamp.getDate() + 1);
	return formatIsoDate(stamp);
}
/**
 * Expand recurring assignments into the visible day [date, date+1), then
 * group. Master `items` stay as templates — clones are display-only.
 * @param {Array<{id?: *, value?: *, label?: *, tone?: *}>} resources - Lanes.
 * @param {Array<object>} assignments - Master assignment list.
 * @param {string} date - ISO day to keep; empty keeps every dated item (no expand).
 * @returns {Array<{id: string, label: string, tone: string, items: Array, trackCount: number}>} Lanes.
 */
export function groupAssignments(resources, assignments, date, laneField = 'resourceId') {
	const windowEnd = date ? nextIsoDay(date) : '';
	let source = isArray(assignments) ? assignments : [];
	if (date && windowEnd) {
		source = expandAssignments(assignments, date, windowEnd);
	}
	/*
	 * Bucketing is the SHARED half (core/board/items.js — the same function
	 * ui-task-board groups columns with). Everything below is this board's own
	 * policy, which is why it rides in as hooks rather than living in the shared
	 * module: a day window is a scheduling idea, and overlap tracks are meaningless
	 * on a column board where position is ordinal.
	 */
	return groupIntoLanes(resources, source, {
		laneField,
		accept: (entry) => {
			return !date || !entry.date || entry.date === date;
		},
		decorate: (lane, resource) => {
			lane.tone = resource?.tone || 'accent';
			markConflicts(lane.items);
			lane.trackCount = assignTracks(lane.items);
		},
	});
}
