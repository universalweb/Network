/*
 * Default thresholds. Override by mutating these maps before importing
 * viewport.js, or by calling setBreakpoints() at any time (re-evaluates
 * the current state on next resize).
 */
export const widthBreakpoints = {
	xs: 480,
	sm: 768,
	md: 1024,
	lg: 1440,
	xl: 1920,
	xxl: Infinity,
};
export const heightBreakpoints = {
	short: 480,
	medium: 768,
	tall: Infinity,
};
export const aspectBuckets = [
	{ name: 'tall', max: 1 },
	{ name: 'square', max: 1.2 },
	{ name: 'standard', max: 1.6 },
	{ name: 'wide', max: 2.1 },
	{ name: 'ultra-wide', max: Infinity },
];
function pickBreakpoint(value, table) {
	const keys = Object.keys(table);
	for (let i = 0; i < keys.length; i++) {
		if (value < table[keys[i]]) {
			return keys[i];
		}
	}
	return keys[keys.length - 1];
}
export function widthBucket(width) {
	return pickBreakpoint(width, widthBreakpoints);
}
export function heightBucket(height) {
	return pickBreakpoint(height, heightBreakpoints);
}
export function aspectBucket(ratio) {
	for (let i = 0; i < aspectBuckets.length; i++) {
		if (ratio < aspectBuckets[i].max) {
			return aspectBuckets[i].name;
		}
	}
	return aspectBuckets[aspectBuckets.length - 1].name;
}
export function orientationOf(ratio) {
	if (ratio < 0.95) {
		return 'portrait';
	}
	if (ratio > 1.05) {
		return 'landscape';
	}
	return 'square';
}
