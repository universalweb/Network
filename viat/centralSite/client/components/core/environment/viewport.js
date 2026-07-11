/*
 * Self-initializing viewport service. Single shared resize listener,
 * rAF-coalesced. Writes globalState.environment.viewport on every change.
 * Dispatches viewport:resize (every coalesced tick that actually changed)
 * and viewport:change (only on bucket transitions) at document level —
 * components subscribe via this.delegate('viewport:resize'/'viewport:change', ...).
 */
import { emitDelegate } from '../dom/delegate.js';
import { globalState } from '../state/globalState.js';
import { plainEqual } from '../utilities.js';
import {
	aspectBucket,
	heightBucket,
	orientationOf,
	widthBucket,
} from './breakpoints.js';
import { isTouch } from './device.js';
let scheduled = false;
let lastSnapshot = null;
function snapshot() {
	const width = globalThis.innerWidth;
	const height = globalThis.innerHeight;
	const ratio = height ? width / height : 0;
	return {
		width,
		height,
		ratio,
		pixelRatio: globalThis.devicePixelRatio,
		w: widthBucket(width),
		h: heightBucket(height),
		orientation: orientationOf(ratio),
		aspect: aspectBucket(ratio),
		touch: isTouch,
	};
}
function diffBuckets(before, after) {
	const changed = {};
	const keys = [
		'w', 'h', 'orientation', 'aspect', 'touch',
	];
	const keysLength = keys.length;
	for (let keyIndex = 0; keyIndex < keysLength; keyIndex++) {
		const key = keys[keyIndex];
		if (!before || before[key] !== after[key]) {
			changed[key] = {
				from: before?.[key] ?? null,
				to: after[key],
			};
		}
	}
	return Object.keys(changed).length ? changed : null;
}
function tick() {
	scheduled = false;
	const next = snapshot();
	if (plainEqual(lastSnapshot, next)) {
		return;
	}
	const bucketChanges = diffBuckets(lastSnapshot, next);
	lastSnapshot = next;
	globalState.set({
		'environment.viewport': next,
	});
	emitDelegate('viewport:resize', next);
	if (bucketChanges) {
		emitDelegate('viewport:change', {
			...next,
			changed: bucketChanges,
		});
	}
}
function schedule() {
	if (scheduled) {
		return;
	}
	scheduled = true;
	requestAnimationFrame(tick);
}
globalThis.addEventListener('resize', schedule);
globalThis.addEventListener('orientationchange', schedule);
/*
 * Mobile browser-chrome show/hide (URL-bar collapse/expand) changes the
 * viewport height WITHOUT a reliable window `resize` — `visualViewport`'s
 * resize event is the signal that always fires (it also covers pinch-zoom
 * settles). Routes into the same rAF-coalesced tick; the snapshot dedupe
 * makes the desktop overlap with the window listener free.
 */
globalThis.visualViewport?.addEventListener('resize', schedule);
tick();
