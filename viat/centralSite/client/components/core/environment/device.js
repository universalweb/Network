/*
 * One-shot detection at module load. Writes globalState.environment.device.
 * No listeners — these don't change at runtime.
 */
import { globalState } from '../state/globalState.js';
const ua = navigator.userAgent || '';
function detectOS() {
	if ((/iPhone|iPad|iPod/).test(ua)) {
		return 'iOS';
	}
	if ((/Android/).test(ua)) {
		return 'Android';
	}
	if ((/Mac OS X|Macintosh/).test(ua)) {
		return 'macOS';
	}
	if ((/Windows/).test(ua)) {
		return 'Windows';
	}
	if ((/Linux/).test(ua)) {
		return 'Linux';
	}
	return 'unknown';
}
function detectBrowser() {
	if ((/Edg\//).test(ua)) {
		return 'Edge';
	}
	if ((/OPR\//).test(ua)) {
		return 'Opera';
	}
	if ((/Firefox\//).test(ua)) {
		return 'Firefox';
	}
	if ((/Chrome\//).test(ua)) {
		return 'Chrome';
	}
	if ((/Safari\//).test(ua)) {
		return 'Safari';
	}
	return 'unknown';
}
function detectEngine() {
	if ((/Gecko\/20/).test(ua)) {
		return 'Gecko';
	}
	if ((/AppleWebKit/).test(ua) && (/Chrome|Edg|OPR/).test(ua)) {
		return 'Blink';
	}
	if ((/AppleWebKit/).test(ua)) {
		return 'WebKit';
	}
	return 'unknown';
}
function detectDeviceType() {
	if ((/Mobi|iPhone|iPod|Android.*Mobile/i).test(ua)) {
		return 'mobile';
	}
	if ((/iPad|Tablet|Android(?!.*Mobile)/i).test(ua)) {
		return 'tablet';
	}
	return 'desktop';
}
globalState.set({
	'environment.device': {
		os: detectOS(),
		browser: detectBrowser(),
		engine: detectEngine(),
		deviceType: detectDeviceType(),
		touch: navigator.maxTouchPoints > 0,
		pixelRatio: globalThis.devicePixelRatio,
	},
});
