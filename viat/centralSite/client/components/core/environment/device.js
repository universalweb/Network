/*
 * Device detection — the ONLY module in the client allowed to read
 * `navigator.userAgent` / `navigator.platform` / `maxTouchPoints`. One-shot at
 * module load; none of these change at runtime, so every consumer reads a
 * precomputed const instead of re-running regex sniffing.
 *
 * Core-loaded (see core/index.js) — the detection runs while the framework
 * module graph evaluates, before any component boots. Results are available
 * two ways:
 *   • module consts — `import { isMobile, isApple } from '…/device.js'`
 *   • globalState   — `environment.device.{os,browser,mobile,mac,…}` for
 *     template bindings and observers.
 */
import { globalState } from '../state/globalState.js';
const navigatorRef = globalThis.navigator;
export const userAgent = navigatorRef?.userAgent ?? '';
export const isTouch = (navigatorRef?.maxTouchPoints ?? 0) > 0;
/*
 * `userAgentData.platform` survives UA reduction/freezing; `navigator.platform`
 * is the legacy fallback; the UA string is the last resort.
 */
const platform = navigatorRef?.userAgentData?.platform || navigatorRef?.platform || userAgent;
function detectOS() {
	if ((/iPhone|iPad|iPod/).test(userAgent)) {
		return 'iOS';
	}
	if ((/Android/).test(userAgent)) {
		return 'Android';
	}
	if ((/Mac OS X|Macintosh/).test(userAgent)) {
		/*
		 * iPadOS ships a desktop "Macintosh" UA; a touch-capable "Mac" is
		 * actually an iPad. No shipping Mac reports touch points.
		 */
		return isTouch ? 'iOS' : 'macOS';
	}
	if ((/Windows/).test(userAgent)) {
		return 'Windows';
	}
	if ((/Linux/).test(userAgent)) {
		return 'Linux';
	}
	return 'unknown';
}
function detectBrowser() {
	if ((/Edg\//).test(userAgent)) {
		return 'Edge';
	}
	if ((/OPR\//).test(userAgent)) {
		return 'Opera';
	}
	if ((/Firefox\//).test(userAgent)) {
		return 'Firefox';
	}
	if ((/Chrome\//).test(userAgent)) {
		return 'Chrome';
	}
	if ((/Safari\//).test(userAgent)) {
		return 'Safari';
	}
	return 'unknown';
}
function detectEngine() {
	if ((/Gecko\/20/).test(userAgent)) {
		return 'Gecko';
	}
	if ((/AppleWebKit/).test(userAgent) && (/Chrome|Edg|OPR/).test(userAgent)) {
		return 'Blink';
	}
	if ((/AppleWebKit/).test(userAgent)) {
		return 'WebKit';
	}
	return 'unknown';
}
export const os = detectOS();
function detectDeviceType() {
	if ((/Mobi|iPhone|iPod|Android.*Mobile/i).test(userAgent)) {
		return 'mobile';
	}
	if ((/iPad|Tablet|Android(?!.*Mobile)/i).test(userAgent)) {
		return 'tablet';
	}
	if (os === 'iOS' && isTouch) {
		return 'tablet';
	}
	return 'desktop';
}
export const browser = detectBrowser();
export const engine = detectEngine();
export const deviceType = detectDeviceType();
export const isMobile = deviceType === 'mobile';
export const isTablet = deviceType === 'tablet';
export const isDesktop = deviceType === 'desktop';
export const isIOS = os === 'iOS';
export const isAndroid = os === 'Android';
export const isMac = os === 'macOS';
export const isWindows = os === 'Windows';
export const isLinux = os === 'Linux';
/*
 * Apple platform → the ⌘/meta modifier convention (hotkeys' `mod` alias).
 * The platform test is the belt for reduced-UA browsers where the UA string
 * alone under-reports.
 */
export const isApple = isMac || isIOS || (/mac|iphone|ipad|ipod/i).test(platform);
globalState.set({
	'environment.device': {
		os,
		browser,
		engine,
		deviceType,
		mobile: isMobile,
		tablet: isTablet,
		desktop: isDesktop,
		touch: isTouch,
		apple: isApple,
		mac: isMac,
		ios: isIOS,
		android: isAndroid,
		windows: isWindows,
		linux: isLinux,
		pixelRatio: globalThis.devicePixelRatio,
	},
});
