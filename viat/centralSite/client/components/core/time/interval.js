/*
	DESCRIPTION: Half-open time intervals [start, end). Back-to-back events
	(one ending when the next starts) do NOT overlap — that is the availability
	rule. Units are the caller's (minutes-from-midnight, epoch ms, …) as long
	as both ends use the same numeric scale.
	── USAGE ────────────────────────────────────────────────────────────
	  overlaps({ start: 540, end: 600 }, { start: 600, end: 660 }) === false
	  findConflicts(candidate, dayEvents)
	─────────────────────────────────────────────────────────────────────
*/
export const MINUTES_PER_DAY = 1440;
/**
 * True when two half-open intervals share any point.
 * @param {{start: number, end: number}} first - Interval A.
 * @param {{start: number, end: number}} second - Interval B.
 * @returns {boolean} Whether they conflict.
 */
export function overlaps(first, second) {
	if (!first || !second) {
		return false;
	}
	return first.start < second.end && second.start < first.end;
}
/**
 * True when `outer` covers every point of `inner` under [start, end).
 * A zero-length inner sitting on `outer.end` is NOT contained.
 * @param {{start: number, end: number}} outer - Containing interval.
 * @param {{start: number, end: number}} inner - Candidate.
 * @returns {boolean} Whether outer contains inner.
 */
export function contains(outer, inner) {
	if (!outer || !inner) {
		return false;
	}
	return outer.start <= inner.start && inner.end <= outer.end && inner.start < outer.end;
}
/**
 * Signed length of an interval (end − start). Does not wrap overnight.
 * @param {{start: number, end: number}} interval - Numeric range.
 * @returns {number} Duration in the same units as the ends.
 */
export function durationOf(interval) {
	if (!interval) {
		return 0;
	}
	return interval.end - interval.start;
}
/**
 * Round `value` to the nearest multiple of `stepMinutes`.
 * Tie-break matches `Math.round`: halfway cases round toward +∞
 * (for non-negative minutes that is half-up: 7.5 with step 15 → 15).
 * @param {number} value - Unsnapped position.
 * @param {number} stepMinutes - Grid size. Non-positive returns `value`.
 * @returns {number} Snapped value.
 */
export function snapTo(value, stepMinutes) {
	if (!Number.isFinite(value) || !(stepMinutes > 0)) {
		return value;
	}
	return Math.round(value / stepMinutes) * stepMinutes;
}
/**
 * Clamp a numeric instant onto the closed day [0, 1440]. 1440 is legal as an
 * END (midnight-next) and illegal as a START of the same day.
 * @param {number} value - Minutes from midnight.
 * @returns {number} Clamped minutes.
 */
export function clampToDay(value) {
	if (!Number.isFinite(value)) {
		return 0;
	}
	if (value < 0) {
		return 0;
	}
	if (value > MINUTES_PER_DAY) {
		return MINUTES_PER_DAY;
	}
	return value;
}
/**
 * Clamp both ends of an interval onto the day. Does not swap inverted ranges.
 * @param {{start: number, end: number}} interval - Numeric range.
 * @returns {{start: number, end: number}} Clamped copy.
 */
export function clampInterval(interval) {
	return {
		start: clampToDay(interval?.start),
		end: clampToDay(interval?.end),
	};
}
/**
 * Members of `list` that overlap `interval`. Skips `interval` itself by
 * reference so the caller can pass the whole day's events.
 * @param {{start: number, end: number}} interval - Candidate.
 * @param {Array<{start: number, end: number}>} list - Other intervals.
 * @returns {Array<{start: number, end: number}>} Overlapping members.
 */
export function findConflicts(interval, list) {
	const hits = [];
	if (!interval || !list) {
		return hits;
	}
	const count = list.length;
	for (let index = 0; index < count; index += 1) {
		const other = list[index];
		if (other === interval) {
			continue;
		}
		if (overlaps(interval, other)) {
			hits.push(other);
		}
	}
	return hits;
}
