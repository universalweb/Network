// Self-initializing viewport service. Single shared resize listener,
// rAF-coalesced. Writes globalState.environment.viewport on every change.
// Dispatches viewport:resize (every coalesced tick) and viewport:change
// (only on bucket transitions) at document level — components subscribe
// via this.delegate('viewport:resize'/'viewport:change', ...).
import { setGlobal } from '../state/globalState.js';
import {
	aspectBucket,
	heightBucket,
	orientationOf,
	widthBucket,
} from './breakpoints.js';
let scheduled = false;
let lastSnapshot = null;
function snapshot() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	const ratio = height ? width / height : 0;
	return {
		width,
		height,
		ratio,
		pixelRatio: window.devicePixelRatio,
		w: widthBucket(width),
		h: heightBucket(height),
		orientation: orientationOf(ratio),
		aspect: aspectBucket(ratio),
		touch: navigator.maxTouchPoints > 0,
	};
}
function diffBuckets(before, after) {
	const changed = {};
	const keys = ['w', 'h', 'orientation', 'aspect', 'touch'];
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (!before || before[key] !== after[key]) {
			changed[key] = { from: before?.[key] ?? null, to: after[key] };
		}
	}
	return Object.keys(changed).length ? changed : null;
}
function dispatchViewport(eventName, data) {
	document.dispatchEvent(new CustomEvent(eventName, {
		bubbles: true,
		composed: true,
		detail: { data, source: null },
	}));
}
function tick() {
	scheduled = false;
	const next = snapshot();
	const bucketChanges = diffBuckets(lastSnapshot, next);
	lastSnapshot = next;
	setGlobal({ 'environment.viewport': next });
	dispatchViewport('viewport:resize', next);
	if (bucketChanges) {
		dispatchViewport('viewport:change', { ...next, changed: bucketChanges });
	}
}
function schedule() {
	if (scheduled) {
		return;
	}
	scheduled = true;
	requestAnimationFrame(tick);
}
window.addEventListener('resize', schedule);
window.addEventListener('orientationchange', schedule);
tick();
