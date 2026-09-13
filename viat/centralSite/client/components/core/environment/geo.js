/*
 * Opt-in geolocation. Importing alone does NOT prompt the user. Call
 * requestGeo() to trigger the permission dialog. Once granted, position
 * is watched continuously and written to globalState.environment.geo.
 */
import { emitDelegate } from '../dom/delegate.js';
import { globalState } from '../state/globalState.js';
let watchId = null;
/*
 * Single-flight request state: the getCurrentPosition callbacks are browser
 * API callbacks with no context channel, so the pending resolvers + options
 * ride module scope (like `watchId`) — named module handlers can then be
 * passed to getCurrentPosition by reference, no per-call closure. Cleared in
 * both handlers; a concurrent requestGeo() shares the in-flight promise.
 */
let pendingResolvers = null;
let pendingOptions = null;
function update(position) {
	const value = {
		latitude: position.coords.latitude,
		longitude: position.coords.longitude,
		accuracy: position.coords.accuracy,
		altitude: position.coords.altitude,
		heading: position.coords.heading,
		speed: position.coords.speed,
		timestamp: position.timestamp,
	};
	globalState.set({
		'environment.geo': value,
	});
	emitDelegate('environment:change', {
		area: 'geo',
		value,
	});
}
function fail(error) {
	globalState.set({
		'environment.geo': {
			error: error.message,
			code: error.code,
		},
	});
}
function clearPendingGeo() {
	const resolvers = pendingResolvers;
	pendingResolvers = null;
	pendingOptions = null;
	return resolvers;
}
function onGeoFixed(position) {
	update(position);
	watchId = navigator.geolocation.watchPosition(update, fail, pendingOptions);
	clearPendingGeo()?.resolve();
}
function onGeoDenied(error) {
	fail(error);
	clearPendingGeo()?.reject(error);
}
export function requestGeo(options = {}) {
	if (!navigator.geolocation) {
		return Promise.reject(new Error('Geolocation API not available'));
	}
	if (watchId !== null) {
		return Promise.resolve();
	}
	// A request already in flight — share its promise instead of double-prompting.
	if (pendingResolvers) {
		return pendingResolvers.promise;
	}
	pendingResolvers = Promise.withResolvers();
	pendingOptions = options;
	navigator.geolocation.getCurrentPosition(onGeoFixed, onGeoDenied, options);
	return pendingResolvers.promise;
}
export function stopGeo() {
	if (watchId !== null) {
		navigator.geolocation.clearWatch(watchId);
		watchId = null;
	}
}
