/*
	DESCRIPTION: Pure route sequence for ui-schedule-route.
	One resource, one day, ordered by start. Drive-time minutes that exceed
	the half-open gap between consecutive jobs set `conflict` (OR into the
	existing overlap flag — not a parallel mechanism).
	Author: Universal Web
	Date: 2026-08-28
*/
import { isArray, isNumber, noValue } from '@universalweb/utilitylib';
import { expandAssignments } from '../../core/time/recurrence.js';
import { toLatLng } from '../map/map-geo.js';
import { nextIsoDay, numericInterval } from '../schedule-board/lanes.js';
/**
 * Assignment coordinates. Accepts lat/lng on the item, `.coords`, or `.position`.
 * @param {object} item - Assignment.
 * @returns {{lat: number, lng: number}|null} Point.
 */
export function coordsOf(item) {
	return toLatLng(item) || toLatLng(item?.coords) || toLatLng(item?.position);
}
/**
 * Compare two assignments by start minutes.
 * @param {object} first - A.
 * @param {object} second - B.
 * @returns {number} Sort delta.
 */
function startAscending(first, second) {
	const firstInterval = numericInterval(first);
	const secondInterval = numericInterval(second);
	const firstStart = firstInterval ? firstInterval.start : 0;
	const secondStart = secondInterval ? secondInterval.start : 0;
	return firstStart - secondStart;
}
/**
 * Visible assignments for one resource on one ISO day, start-sorted.
 * Recurrence expands for that day only.
 * @param {Array<object>} items - Master assignments.
 * @param {string} resourceId - Lane id.
 * @param {string} date - ISO day.
 * @returns {Array<object>} Ordered stops.
 */
export function routeStops(items, resourceId, date) {
	const source = isArray(items) ? items : [];
	const windowEnd = date ? nextIsoDay(date) : '';
	const expanded = date && windowEnd ? expandAssignments(source, date, windowEnd) : source;
	const lane = String(resourceId || '');
	const stops = [];
	const count = expanded.length;
	for (let index = 0; index < count; index += 1) {
		const item = expanded[index];
		if (!item) {
			continue;
		}
		if (lane && String(item.resourceId) !== lane) {
			continue;
		}
		if (date && item.date && item.date !== date) {
			continue;
		}
		stops.push(item);
	}
	stops.sort(startAscending);
	return stops;
}
/**
 * Minutes from end of `earlier` to start of `later`. Negative when they overlap.
 * @param {object} earlier - First assignment.
 * @param {object} later - Next assignment.
 * @returns {number|null} Gap, or null when clocks are invalid.
 */
export function gapMinutes(earlier, later) {
	const firstInterval = numericInterval(earlier);
	const secondInterval = numericInterval(later);
	if (!firstInterval || !secondInterval) {
		return null;
	}
	return secondInterval.start - firstInterval.end;
}
/**
 * OR `conflict` onto a stop when drive minutes exceed the gap to the next.
 * Missing/non-finite travel does not flag. Does not clear an overlap flag.
 * @param {Array<object>} stops - Ordered assignments (mutated).
 * @param {Array<number|null>} travelMinutes - Travel from i to i+1.
 * @returns {Array<object>} The same array.
 */
export function markTravelConflicts(stops, travelMinutes) {
	if (!isArray(stops) || !isArray(travelMinutes)) {
		return stops;
	}
	const count = stops.length;
	for (let index = 0; index < count - 1; index += 1) {
		const travel = travelMinutes[index];
		if (!isNumber(travel) || !Number.isFinite(travel)) {
			continue;
		}
		const gap = gapMinutes(stops[index], stops[index + 1]);
		if (noValue(gap) || travel <= gap) {
			continue;
		}
		stops[index].conflict = true;
		stops[index + 1].conflict = true;
	}
	return stops;
}
/**
 * Leaflet/Google marker items from stops that have coordinates.
 * @param {Array<object>} stops - Ordered assignments.
 * @returns {Array<object>} Map items.
 */
export function markerItems(stops) {
	const markers = [];
	if (!isArray(stops)) {
		return markers;
	}
	const count = stops.length;
	for (let index = 0; index < count; index += 1) {
		const item = stops[index];
		const point = coordsOf(item);
		if (!point) {
			continue;
		}
		markers.push({
			id: item.id,
			lat: point.lat,
			lng: point.lng,
			label: item.label || item.id,
			description: `${item.start || ''}–${item.end || ''}`,
		});
	}
	return markers;
}
/**
 * One polyline through consecutive geocoded stops.
 * @param {Array<object>} stops - Ordered assignments.
 * @returns {Array<object>} Polyline list (empty or one path).
 */
export function routePolylines(stops) {
	const path = [];
	if (!isArray(stops)) {
		return [];
	}
	const count = stops.length;
	for (let index = 0; index < count; index += 1) {
		const point = coordsOf(stops[index]);
		if (point) {
			path.push(point);
		}
	}
	if (path.length < 2) {
		return [];
	}
	return [
		{
			id: 'route',
			path,
		},
	];
}
