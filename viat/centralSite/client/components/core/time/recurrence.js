/*
	DESCRIPTION: RRULE SUBSET — not full RFC 5545. Expand a recurrence into
	ISO dates that fall inside a half-open window [windowStart, windowEnd).
	ASSUMPTION (cheap to revert):
	  { freq: 'daily'|'weekly'|'monthly', interval, byDay?, until?, count?, start }
	  `start` is DTSTART (ISO day). `until` is an exclusive ISO end, matching
	  interval.js [start, end). `count` is the series length from DTSTART
	  (RFC COUNT), not the window size. `byDay` is ['mo','we',…] (weekly
	  filter; also accepted on daily/monthly as a weekday keep-list).
	NEVER materialise an unbounded series. The window is the primary bound.
	An open-ended rule still scans at most MAX_WINDOW_DAYS (366) days of the
	window and emits at most MAX_OCCURRENCES (366) dates. A COUNT that cannot
	be resolved without walking more than 366 days before the window fails
	closed (returns []).
	Occurrence edits (detached exceptions) are OUT OF SCOPE.
	── USAGE ────────────────────────────────────────────────────────────
	  expandOccurrences({ freq: 'weekly', interval: 1, byDay: ['mo','we'],
	    start: '2026-08-03', until: '2026-09-01' }, '2026-08-17', '2026-08-24')
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-28
*/
import { isArray, isNumber, isString } from '@universalweb/utilitylib';
import { formatIsoDate, parseIsoDate } from './format.js';
export const MAX_WINDOW_DAYS = 366;
export const MAX_OCCURRENCES = 366;
const WEEKDAY_INDEX = {
	su: 0,
	mo: 1,
	tu: 2,
	we: 3,
	th: 4,
	fr: 5,
	sa: 6,
};
/**
 * True when `iso` parses as a real local calendar day.
 * @param {string} iso - Candidate YYYY-MM-DD.
 * @returns {boolean} Whether it is a usable date.
 */
function isIsoDay(iso) {
	if (!isString(iso) || iso.length < 10) {
		return false;
	}
	const stamp = parseIsoDate(iso);
	return Number.isFinite(stamp.getTime()) && formatIsoDate(stamp) === iso.slice(0, 10);
}
/**
 * Advance an ISO day by `amount` calendar days via Date#setDate.
 * @param {string} iso - YYYY-MM-DD.
 * @param {number} amount - Signed day delta.
 * @returns {string} Advanced ISO day, or '' if `iso` is invalid.
 */
function addIsoDays(iso, amount) {
	const stamp = parseIsoDate(iso);
	if (!Number.isFinite(stamp.getTime())) {
		return '';
	}
	stamp.setDate(stamp.getDate() + amount);
	return formatIsoDate(stamp);
}
/**
 * Whole calendar days from `fromIso` to `toIso` (negative if to < from).
 * Uses UTC date ordinals so DST cannot yield 23/25h.
 * @param {string} fromIso - Start day.
 * @param {string} toIso - End day.
 * @returns {number} Day delta.
 */
function daysBetween(fromIso, toIso) {
	const from = parseIsoDate(fromIso);
	const to = parseIsoDate(toIso);
	if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) {
		return Number.NaN;
	}
	const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
	const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
	return Math.round((toUtc - fromUtc) / 86400000);
}
/**
 * Lowercased weekday token for a Date.
 * @param {Date} stamp - Local date.
 * @returns {string} su…sa.
 */
function weekdayToken(stamp) {
	const tokens = [
		'su',
		'mo',
		'tu',
		'we',
		'th',
		'fr',
		'sa',
	];
	return tokens[stamp.getDay()] || '';
}
/**
 * Normalize byDay to a Set of weekday tokens. Empty set = no weekday filter.
 * @param {Array<string>|undefined} byDay - Caller list.
 * @returns {Set<string>} Keep-set.
 */
function weekdayKeep(byDay) {
	const keep = new Set();
	if (!isArray(byDay)) {
		return keep;
	}
	const count = byDay.length;
	for (let index = 0; index < count; index += 1) {
		const token = isString(byDay[index]) ? byDay[index].toLowerCase() : '';
		if (Object.hasOwn(WEEKDAY_INDEX, token)) {
			keep.add(token);
		}
	}
	return keep;
}
/**
 * Months from `fromIso` to `toIso` (same-day comparison is the caller's).
 * @param {string} fromIso - DTSTART.
 * @param {string} toIso - Candidate.
 * @returns {number} Month delta.
 */
function monthsBetween(fromIso, toIso) {
	const from = parseIsoDate(fromIso);
	const to = parseIsoDate(toIso);
	if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) {
		return Number.NaN;
	}
	return ((to.getFullYear() - from.getFullYear()) * 12) + (to.getMonth() - from.getMonth());
}
/**
 * True when `iso` is a member of the series (ignores window, until, count).
 * @param {string} iso - Candidate day.
 * @param {object} rule - Normalized rule.
 * @returns {boolean} Whether it belongs.
 */
function alignsWithRule(iso, rule) {
	if (iso < rule.start) {
		return false;
	}
	const stamp = parseIsoDate(iso);
	if (rule.weekdays.size > 0 && !rule.weekdays.has(weekdayToken(stamp))) {
		return false;
	}
	const interval = rule.interval;
	switch (rule.freq) {
		case 'daily': {
			const delta = daysBetween(rule.start, iso);
			return Number.isFinite(delta) && delta % interval === 0;
		}
		case 'weekly': {
			const delta = daysBetween(rule.start, iso);
			if (!Number.isFinite(delta)) {
				return false;
			}
			return Math.floor(delta / 7) % interval === 0;
		}
		case 'monthly': {
			const startStamp = parseIsoDate(rule.start);
			if (stamp.getDate() !== startStamp.getDate()) {
				return false;
			}
			const delta = monthsBetween(rule.start, iso);
			return Number.isFinite(delta) && delta % interval === 0;
		}
		default: {
			return false;
		}
	}
}
/**
 * How many series hits fall in [start, beforeIso). Caps the walk.
 * @param {object} rule - Normalized rule.
 * @param {string} beforeIso - Exclusive end.
 * @returns {number|null} Prior hit count, or null when the walk could not finish.
 */
function countPriorHits(rule, beforeIso) {
	if (beforeIso <= rule.start) {
		return 0;
	}
	let hits = 0;
	let iso = rule.start;
	for (let scanned = 0; scanned < MAX_WINDOW_DAYS; scanned += 1) {
		if (!iso || iso >= beforeIso) {
			return hits;
		}
		if (alignsWithRule(iso, rule)) {
			hits += 1;
			if (rule.count != null && hits >= rule.count) {
				return hits;
			}
		}
		iso = addIsoDays(iso, 1);
	}
	if (iso && iso < beforeIso) {
		return null;
	}
	return hits;
}
/**
 * Normalize caller input. Invalid → null.
 * @param {object} rule - Caller rule.
 * @returns {object|null} Normalized rule.
 */
function normalizeRule(rule) {
	if (!rule) {
		return null;
	}
	const freq = isString(rule.freq) ? rule.freq.toLowerCase() : '';
	if (freq !== 'daily' && freq !== 'weekly' && freq !== 'monthly') {
		return null;
	}
	if (!isIsoDay(rule.start)) {
		return null;
	}
	const intervalRaw = rule.interval;
	const interval = isNumber(intervalRaw) && intervalRaw > 0 ? Math.floor(intervalRaw) : 1;
	const countRaw = rule.count;
	let count = null;
	if (isNumber(countRaw) && countRaw > 0) {
		count = Math.floor(countRaw);
	}
	let until = '';
	if (isIsoDay(rule.until)) {
		until = rule.until.slice(0, 10);
	}
	return {
		freq,
		interval: interval > 0 ? interval : 1,
		start: rule.start.slice(0, 10),
		until,
		count,
		weekdays: weekdayKeep(rule.byDay),
	};
}
/**
 * Expand `rule` into ISO dates inside [windowStart, windowEnd).
 * @param {object} rule - RRULE subset (must include `start`).
 * @param {string} windowStart - Inclusive ISO start.
 * @param {string} windowEnd - Exclusive ISO end.
 * @returns {string[]} Occurrence dates, chronological, capped.
 */
export function expandOccurrences(rule, windowStart, windowEnd) {
	const dates = [];
	if (!isIsoDay(windowStart) || !isIsoDay(windowEnd) || windowStart >= windowEnd) {
		return dates;
	}
	const spec = normalizeRule(rule);
	if (!spec) {
		return dates;
	}
	let remaining = spec.count;
	if (spec.count != null && windowStart > spec.start) {
		const prior = countPriorHits(spec, windowStart);
		if (prior == null || prior >= spec.count) {
			return dates;
		}
		remaining = spec.count - prior;
	}
	let iso = windowStart;
	if (iso < spec.start) {
		iso = spec.start;
	}
	for (let scanned = 0; scanned < MAX_WINDOW_DAYS; scanned += 1) {
		if (!iso || iso >= windowEnd) {
			break;
		}
		if (spec.until && iso >= spec.until) {
			break;
		}
		if (alignsWithRule(iso, spec)) {
			dates.push(iso);
			if (remaining != null) {
				remaining -= 1;
				if (remaining <= 0) {
					break;
				}
			}
			if (dates.length >= MAX_OCCURRENCES) {
				break;
			}
		}
		iso = addIsoDays(iso, 1);
	}
	return dates;
}
/**
 * Clone recurring assignments into concrete dated blocks for a window.
 * Source items whose DTSTART day lands in the window are reused by
 * reference (drag still finds them). Other days are display clones
 * (`id` → `id::date`); occurrence edits are out of scope.
 * @param {Array<object>} items - Master assignments.
 * @param {string} windowStart - Inclusive ISO start.
 * @param {string} windowEnd - Exclusive ISO end.
 * @returns {Array<object>} Visible assignments.
 */
export function expandAssignments(items, windowStart, windowEnd) {
	const visible = [];
	if (!isArray(items)) {
		return visible;
	}
	const count = items.length;
	for (let index = 0; index < count; index += 1) {
		const item = items[index];
		if (!item) {
			continue;
		}
		const recurrence = item.recurrence;
		if (!recurrence || !recurrence.freq) {
			visible.push(item);
			continue;
		}
		const spec = {
			...recurrence,
			start: recurrence.start || item.date,
		};
		const dates = expandOccurrences(spec, windowStart, windowEnd);
		const dateCount = dates.length;
		const originId = item.id != null && item.id !== '' ? String(item.id) : '';
		for (let dateIndex = 0; dateIndex < dateCount; dateIndex += 1) {
			const iso = dates[dateIndex];
			if (iso === item.date) {
				visible.push(item);
				continue;
			}
			visible.push({
				...item,
				id: originId ? `${originId}::${iso}` : iso,
				date: iso,
				recurrence: null,
				occurrenceOf: originId,
			});
		}
	}
	return visible;
}
