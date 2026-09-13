/*
	DESCRIPTION: Parse/format the time shapes ui-scheduler-event already uses:
	`{ id, label, date, start, end, tone }` where `date` is ISO `YYYY-MM-DD`
	and `start`/`end` are `HH:MM` (24:00 legal as an exclusive day end).
	Minutes-from-midnight (ui-tracker `start`/`end`) round-trip through the
	same pair: formatTime(1080) === '18:00'.
	── USAGE ────────────────────────────────────────────────────────────
	  parseTime('09:00') === 540
	  formatTime(540) === '09:00'
	  parseIsoDate('2026-08-22') / formatIsoDate(date)
	─────────────────────────────────────────────────────────────────────
*/
import { MINUTES_PER_DAY } from './interval.js';
/**
 * Two-digit zero pad.
 * @param {number} value - Integer.
 * @returns {string} Padded digits.
 */
export function pad2(value) {
	return String(value).padStart(2, '0');
}
/**
 * Parse `HH:MM` (or a finite minutes number) into minutes from midnight.
 * `24:00` is 1440 (exclusive end of day). Invalid input → NaN.
 * @param {string|number} value - Clock string or minutes.
 * @returns {number} Minutes from midnight.
 */
export function parseTime(value) {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : Number.NaN;
	}
	if (typeof value !== 'string') {
		return Number.NaN;
	}
	const colon = value.indexOf(':');
	if (colon < 1) {
		return Number.NaN;
	}
	const hours = Number(value.slice(0, colon));
	const mins = Number(value.slice(colon + 1));
	if (!Number.isInteger(hours) || !Number.isInteger(mins)) {
		return Number.NaN;
	}
	if (mins < 0 || mins > 59) {
		return Number.NaN;
	}
	if (hours === 24) {
		return mins === 0 ? MINUTES_PER_DAY : Number.NaN;
	}
	if (hours < 0 || hours > 23) {
		return Number.NaN;
	}
	return (hours * 60) + mins;
}
/**
 * Format minutes from midnight as `HH:MM`. 1440 → `24:00` (not `00:00`) so
 * a day-end tick stays visually midnight-next. Non-day integers stringify.
 * @param {number} value - Minutes from midnight (or a raw number).
 * @returns {string} Clock label.
 */
export function formatTime(value) {
	if (!Number.isFinite(value)) {
		return '';
	}
	if (value >= 0 && value <= MINUTES_PER_DAY && Number.isInteger(value)) {
		const hours = Math.floor(value / 60);
		const mins = value % 60;
		return `${pad2(hours)}:${pad2(mins)}`;
	}
	return String(value);
}
/**
 * `{ start, end }` in minutes from two scheduler-event clock fields.
 * @param {string|number} start - Start clock.
 * @param {string|number} end - End clock.
 * @returns {{start: number, end: number}} Numeric interval.
 */
export function clockInterval(start, end) {
	return {
		start: parseTime(start),
		end: parseTime(end),
	};
}
/**
 * ISO `YYYY-MM-DD` from a Date, or from (year, 0-based month, day).
 * @param {Date|number} yearOrDate - Date or full year.
 * @param {number} [monthIndex] - 0-based month when not a Date.
 * @param {number} [day] - Day of month when not a Date.
 * @returns {string} ISO date.
 */
export function formatIsoDate(yearOrDate, monthIndex, day) {
	if (yearOrDate instanceof Date) {
		return formatIsoDate(
			yearOrDate.getFullYear(),
			yearOrDate.getMonth(),
			yearOrDate.getDate()
		);
	}
	return `${yearOrDate}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}
/**
 * Parse `YYYY-MM-DD` as a local-midnight Date. Invalid → Invalid Date.
 * @param {string} iso - ISO date.
 * @returns {Date} Local midnight.
 */
export function parseIsoDate(iso) {
	if (typeof iso !== 'string' || iso.length < 10) {
		return new Date(Number.NaN);
	}
	const year = Number(iso.slice(0, 4));
	const month = Number(iso.slice(5, 7)) - 1;
	const day = Number(iso.slice(8, 10));
	return new Date(year, month, day);
}
/**
 * Today's local date as `YYYY-MM-DD`.
 * @returns {string} ISO date.
 */
export function todayIso() {
	return formatIsoDate(new Date());
}
