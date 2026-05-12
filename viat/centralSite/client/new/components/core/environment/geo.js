// Opt-in geolocation. Importing alone does NOT prompt the user. Call
// requestGeo() to trigger the permission dialog. Once granted, position
// is watched continuously and written to globalState.environment.geo.
import { setGlobal } from '../state/globalState.js';
let watchId = null;
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
	setGlobal({ 'environment.geo': value });
	document.dispatchEvent(new CustomEvent('environment:change', {
		bubbles: true,
		composed: true,
		detail: { data: { area: 'geo', value } },
	}));
}
function fail(error) {
	setGlobal({ 'environment.geo': { error: error.message, code: error.code } });
}
export function requestGeo(options = {}) {
	if (!navigator.geolocation) {
		return Promise.reject(new Error('Geolocation API not available'));
	}
	if (watchId !== null) {
		return Promise.resolve();
	}
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition((position) => {
			update(position);
			watchId = navigator.geolocation.watchPosition(update, fail, options);
			resolve();
		}, (error) => {
			fail(error);
			reject(error);
		}, options);
	});
}
export function stopGeo() {
	if (watchId !== null) {
		navigator.geolocation.clearWatch(watchId);
		watchId = null;
	}
}
