/*
 * matchMedia subscriptions for user-preference media queries. Self-init.
 * Writes globalState.environment.media and dispatches environment:change
 * when any preference flips.
 */
import { emitDelegate } from '../dom/delegate.js';
import { plainEqual } from '../utilities.js';
import { globalState } from '../state/globalState.js';
const queries = {
	reducedMotion: '(prefers-reduced-motion: reduce)',
	reducedTransparency: '(prefers-reduced-transparency: reduce)',
	reducedData: '(prefers-reduced-data: reduce)',
	contrast: '(prefers-contrast: more)',
	colorScheme: '(prefers-color-scheme: dark)',
	hover: '(hover: hover)',
	pointerFine: '(pointer: fine)',
};
let lastSnapshot = null;
function read() {
	const out = {};
	const keys = Object.keys(queries);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const mql = globalThis.matchMedia(queries[key]);
		if (key === 'colorScheme') {
			out[key] = mql.matches ? 'dark' : 'light';
		} else {
			out[key] = mql.matches;
		}
	}
	return out;
}
function update() {
	const value = read();
	if (plainEqual(lastSnapshot, value)) {
		return;
	}
	lastSnapshot = value;
	globalState.set({ 'environment.media': value });
	emitDelegate('environment:change', { area: 'media', value });
}
const keys = Object.keys(queries);
for (let i = 0; i < keys.length; i++) {
	globalThis.matchMedia(queries[keys[i]]).addEventListener('change', update);
}
update();
