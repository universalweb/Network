/*
	Shared map geo helpers for ui-map + provider hosts.
	State writes use === only — always reuse an existing {lat,lng} / bounds
	ref when values match so parent re-binds and camera polls never trip
	"wasted set on center".
*/
export function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}
/** Normalize any lat/lng-shaped input to a plain { lat, lng } or null. */
export function toLatLng(input) {
	if (!input || typeof input !== 'object') {
		return null;
	}
	const lat = Number(input.lat ?? input.latitude);
	const lng = Number(input.lng ?? input.longitude ?? input.lon);
	if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
		return null;
	}
	return {
		lat,
		lng,
	};
}
export function sameLatLng(a, b) {
	return Boolean(a && b && a.lat === b.lat && a.lng === b.lng);
}
/**
 * Prefer `prev` when lat/lng match `next`; otherwise a fresh plain literal.
 * Callers: `state.center = reuseLatLng(state.center, candidate)` — equal →
 * same ref → proxy set trap no-ops (no wasted-set, no re-render).
 */
export function reuseLatLng(prev, next) {
	if (!next || !isFiniteNumber(next.lat) || !isFiniteNumber(next.lng)) {
		return prev || null;
	}
	if (prev && prev.lat === next.lat && prev.lng === next.lng) {
		return prev;
	}
	return {
		lat: next.lat,
		lng: next.lng,
	};
}
export function sameBounds(a, b) {
	return Boolean(a && b &&
		a.north === b.north &&
		a.south === b.south &&
		a.east === b.east &&
		a.west === b.west);
}
/** Normalize bounds to { north, south, east, west } or null. */
export function normalizeBounds(input) {
	if (!input || typeof input !== 'object') {
		return null;
	}
	const north = Number(input.north ?? input.n ?? input.maxLat);
	const south = Number(input.south ?? input.s ?? input.minLat);
	const east = Number(input.east ?? input.e ?? input.maxLng ?? input.maxLon);
	const west = Number(input.west ?? input.w ?? input.minLng ?? input.minLon);
	if (!isFiniteNumber(north) || !isFiniteNumber(south) || !isFiniteNumber(east) || !isFiniteNumber(west)) {
		return null;
	}
	return {
		north,
		south,
		east,
		west,
	};
}
/** Prefer `prev` when bounds match; otherwise a fresh plain literal. */
export function reuseBounds(prev, next) {
	const normalized = next ? normalizeBounds(next) : null;
	if (!normalized) {
		return prev || null;
	}
	if (sameBounds(prev, normalized)) {
		return prev;
	}
	return normalized;
}
