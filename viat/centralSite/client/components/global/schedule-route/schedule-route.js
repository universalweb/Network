/*
	DESCRIPTION: ui-schedule-route — one resource's assignments for a day,
	on an existing map, with drive time between CONSECUTIVE jobs.
	COMPOSITION ONLY: ui-map-leaflet (items + polylines). No new map engine,
	no API keys, no routing provider.
	ASSUMPTION (cheap to revert): drive time is an INJECTED
	  travelTime(fromCoords, toCoords) -> Promise<minutes>
	on state (or the `travelTime` instance field). Missing / rejected lookups
	degrade to the sequence without durations — the map still paints.
	Lookups are memoised per coord pair (`lat,lng>lat,lng`). In-flight calls
	for the same key share one promise. A resolved number or resolved-null is
	cached (the provider answered). A rejection is not — a transient miss
	retries on the next genuine sync. Changing either endpoint, or the
	travelTime function identity, misses / clears the cache.
	If drive minutes exceed the gap between two jobs, `conflict` is OR'd onto
	those assignment objects (the same flag overlap uses — not a parallel one).
	── USAGE ────────────────────────────────────────────────────────────
	  <ui-schedule-route
	    .state.items=${assignments}
	    .state.resourceId=${'ada'}
	    .state.value=${'2026-08-22'}
	    .state.travelTime=${this.lookupDrive}></ui-schedule-route>
	─────────────────────────────────────────────────────────────────────
	Author: Universal Web
	Date: 2026-08-28
*/
import '../map-leaflet/map-leaflet.js';
import { isFunction, isNumber } from '@universalweb/utilitylib';
import {
	html,
	WebComponent,
} from 'webcomponent';
import {
	coordsOf,
	gapMinutes,
	markerItems,
	markTravelConflicts,
	routePolylines,
	routeStops,
} from './route.js';
/**
 * Coord-pair cache key. Distinct endpoints must not collide.
 * @param {{lat: number, lng: number}} fromPoint - Origin.
 * @param {{lat: number, lng: number}} toPoint - Destination.
 * @returns {string} Cache key.
 */
function travelCacheKey(fromPoint, toPoint) {
	return `${fromPoint.lat},${fromPoint.lng}>${toPoint.lat},${toPoint.lng}`;
}
/**
 * Settled provider answer. Non-finite → null (cacheable). Rejection throws
 * so the cache layer can retry later.
 * @param {Function} lookup - travelTime(from, to) -> Promise<minutes>.
 * @param {{lat: number, lng: number}} fromPoint - Origin.
 * @param {{lat: number, lng: number}} toPoint - Destination.
 * @returns {Promise<number|null>} Minutes, or null when the provider answered with no duration.
 */
async function minutesFromLookup(lookup, fromPoint, toPoint) {
	const minutes = await lookup(fromPoint, toPoint);
	if (isNumber(minutes) && Number.isFinite(minutes)) {
		return minutes;
	}
	return null;
}
function onTravelMiss() {
	/*
	 * loadTravel degrades per-leg. This is the fire-and-forget rejection
	 * path so an unexpected throw cannot become unhandled.
	 */
	return null;
}
export class UIScheduleRoute extends WebComponent {
	static url = import.meta.url;
	static styles = {
		scheduleRoute: './schedule-route.css',
	};
	static state = {
		items: [],
		resourceId: '',
		value: '',
		travelTime: null,
		mapItems: [],
		polylines: [],
		legs: [],
	};
	onInit() {
		this.travelGeneration = 0;
		this.travelResults = new Map();
		this.travelPending = new Map();
		this.travelLookupRef = null;
	}
	onConnect() {
		this.observe([
			'items',
			'resourceId',
			'value',
			'travelTime',
		], this.syncRoute);
		this.syncRoute();
	}
	travelLookup() {
		let lookup = null;
		if (isFunction(this.state.travelTime)) {
			lookup = this.state.travelTime;
		} else if (isFunction(this.travelTime)) {
			lookup = this.travelTime;
		}
		if (lookup !== this.travelLookupRef) {
			this.travelResults.clear();
			this.travelPending.clear();
			this.travelLookupRef = lookup;
		}
		return lookup;
	}
	/**
	 * Memoised per coord pair. In-flight lookups for the same key share one
	 * promise. Resolved number|null is cached; rejection is not.
	 * @param {Function} lookup - Injected travelTime.
	 * @param {{lat: number, lng: number}} fromPoint - Origin.
	 * @param {{lat: number, lng: number}} toPoint - Destination.
	 * @returns {Promise<number|null>|number|null} Minutes, or null when unavailable.
	 */
	minutesForLeg(lookup, fromPoint, toPoint) {
		const key = travelCacheKey(fromPoint, toPoint);
		if (this.travelResults.has(key)) {
			return this.travelResults.get(key);
		}
		const pending = this.travelPending.get(key);
		if (pending) {
			return pending;
		}
		const request = this.fetchTravel(key, lookup, fromPoint, toPoint);
		this.travelPending.set(key, request);
		return request;
	}
	/**
	 * Injected travelTime is uncheckable. A rejection degrades to null and is
	 * not cached — a transient miss must retry on the next genuine sync. A
	 * resolved non-finite value is cached: the provider answered.
	 * @param {string} key - travelCacheKey.
	 * @param {Function} lookup - Injected travelTime.
	 * @param {{lat: number, lng: number}} fromPoint - Origin.
	 * @param {{lat: number, lng: number}} toPoint - Destination.
	 * @returns {Promise<number|null>} Minutes, or null when unavailable.
	 */
	async fetchTravel(key, lookup, fromPoint, toPoint) {
		try {
			const minutes = await minutesFromLookup(lookup, fromPoint, toPoint);
			this.travelResults.set(key, minutes);
			return minutes;
		} catch {
			return null;
		} finally {
			this.travelPending.delete(key);
		}
	}
	syncRoute() {
		const stops = routeStops(this.state.items, this.state.resourceId, this.state.value);
		this.state.mapItems = markerItems(stops);
		this.state.polylines = routePolylines(stops);
		this.paintLegs(stops, []);
		this.loadTravel(stops).catch(onTravelMiss);
	}
	paintLegs(stops, travelMinutes) {
		const legs = [];
		const count = stops.length;
		for (let index = 0; index < count - 1; index += 1) {
			const fromStop = stops[index];
			const toStop = stops[index + 1];
			const travel = travelMinutes[index];
			const gap = gapMinutes(fromStop, toStop);
			let tight = false;
			if (isNumber(travel) && Number.isFinite(travel) && isNumber(gap) && travel > gap) {
				tight = true;
			}
			legs.push({
				id: `${fromStop.id || index}->${toStop.id || index + 1}`,
				label: `${fromStop.label || fromStop.id} → ${toStop.label || toStop.id}`,
				minutes: isNumber(travel) && Number.isFinite(travel) ? travel : null,
				gap,
				conflict: tight,
			});
		}
		this.state.legs = legs;
	}
	async loadTravel(stops) {
		const lookup = this.travelLookup();
		const count = stops.length;
		if (!lookup || count < 2) {
			return;
		}
		this.travelGeneration += 1;
		const generation = this.travelGeneration;
		const travelMinutes = [];
		const legCount = count - 1;
		for (let index = 0; index < legCount; index += 1) {
			travelMinutes.push(null);
		}
		for (let index = 0; index < legCount; index += 1) {
			const fromPoint = coordsOf(stops[index]);
			const toPoint = coordsOf(stops[index + 1]);
			if (!fromPoint || !toPoint) {
				continue;
			}
			travelMinutes[index] = await this.minutesForLeg(lookup, fromPoint, toPoint);
			if (generation !== this.travelGeneration || this.isDisconnected) {
				return;
			}
		}
		markTravelConflicts(stops, travelMinutes);
		this.paintLegs(stops, travelMinutes);
	}
	legRow(leg) {
		const minutesLabel = isNumber(leg.minutes) ? `${leg.minutes} min` : '—';
		return html`<div class="schedule-route-leg" ?data-conflict=${leg.conflict}>
			<span class="schedule-route-leg-label">${leg.label}</span>
			<span class="schedule-route-leg-time">${minutesLabel}</span>
		</div>`;
	}
	render() {
		this.html`
			<div class="schedule-route">
				<div class="schedule-route-map">
					<ui-map-leaflet
						.state.items=${this.state.mapItems}
						.state.polylines=${this.state.polylines}
						.state.fitItems=${true}
						.state.zoom=${12}></ui-map-leaflet>
				</div>
				<div class="schedule-route-legs" ?hidden=${this.state.legs.length === 0}>
					${this.list('legs', this.legRow)}
				</div>
			</div>
		`;
	}
}
customElements.define('ui-schedule-route', UIScheduleRoute);
