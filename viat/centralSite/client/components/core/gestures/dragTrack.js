/*
	dragTrack — the drag-to-step gesture engine for a free, multi-detent track.
	Where dragSnap is BINARY (a panel between open/closed, locked to a single
	opening/closing direction), dragTrack is the carousel's mechanic: a track that
	rests on one of N detents and can be dragged EITHER way, settling forward or
	back by a single step or snapping home. The two are honest siblings — same
	pointer skeleton, different verdict — and a deliberate later pass extracts the
	shared `createPointerDrag` lifecycle and rebases both on it.
	The engine owns the *mechanic*: the single-pointer lifecycle, document-wide
	move tracking (a drag can travel off the start element), the move-threshold
	gate that separates a tap from a drag, the single-step velocity/travel verdict,
	click-suppression after a drag, and blur-cancel. The consumer owns the
	*visuals*: where the track sits during the drag and how it animates to the
	settle point — supplied through callbacks. Timing constants are shared from
	dragSnap so every gesture settles on one identical curve.
*/
import { SNAP_CURVE, SNAP_MS } from './dragSnap.js';
export { SNAP_CURVE, SNAP_MS };
// Gesture-knob defaults — overridable per call through `options`.
const DRAG_THRESHOLD_PX = 8; // raw travel before a press becomes a drag
const STEP_RATIO = 0.25; // travel fraction (of one detent) that commits a step
const STEP_VELOCITY = 0.4; // px/ms fling that commits a step regardless of distance
function alwaysTrue() {
	return true;
}
function zero() {
	return 0;
}
/*
	createDragTrack(startElement, options) → { destroy() }
	options:
	  axis          'x' | 'y'                    — drag axis (default 'x')
	  threshold     px before a press is a drag             (default 8)
	  stepRatio     travel fraction that commits a step     (default 0.25)
	  stepVelocity  px/ms fling that commits a step          (default 0.4)
	  enabled(domEvent) → boolean  — gate; vetoes a press     (default true)
	  extent() → px                — one detent's span (slide width), for
	                                 `progress` 0..1 and the ratio denominator
	  canStep(step) → boolean      — veto a committed step at an edge
	                                 (step is -1 | +1); default allows all
	  onStart()                    — fired once, when the drag clears threshold
	  onMove(delta, progress)      — every tracked move; `delta` is SIGNED axis
	                                 travel, `progress` is |delta|/extent clamped
	  onSettle(step)               — release verdict; `step` is -1 | 0 | +1
	                                 (0 = snap home). A vetoed step yields 0.
*/
export function createDragTrack(startElement, options = {}) {
	if (!startElement) {
		return {
			destroy() {},
		};
	}
	const axis = options.axis === 'y' ? 'y' : 'x';
	const clientAxis = axis === 'y' ? 'clientY' : 'clientX';
	const threshold = options.threshold ?? DRAG_THRESHOLD_PX;
	const stepRatio = options.stepRatio ?? STEP_RATIO;
	const stepVelocity = options.stepVelocity ?? STEP_VELOCITY;
	const isEnabled = options.enabled || alwaysTrue;
	const extent = options.extent || zero;
	const canStep = options.canStep || alwaysTrue;
	const onStart = options.onStart;
	const onMove = options.onMove;
	const onSettle = options.onSettle;
	let pointerId = null;
	let dragOrigin = 0;
	let startTime = 0;
	let delta = 0;
	let dragMoved = false;
	let suppressClick = false;
	let destroyed = false;
	function stopTracking() {
		if (pointerId === null) {
			return;
		}
		const doc = globalThis.document;
		doc.removeEventListener('pointermove', handlePointerMove);
		doc.removeEventListener('pointerup', handlePointerEnd);
		doc.removeEventListener('pointercancel', handlePointerEnd);
		globalThis.removeEventListener('blur', handleWindowBlur);
		pointerId = null;
	}
	function handlePointerDown(domEvent) {
		if (destroyed || pointerId !== null) {
			return;
		}
		if (domEvent.button !== undefined && domEvent.button !== 0) {
			return;
		}
		if (!isEnabled(domEvent)) {
			return;
		}
		pointerId = domEvent.pointerId;
		dragOrigin = domEvent[clientAxis];
		startTime = performance.now();
		delta = 0;
		dragMoved = false;
		suppressClick = false;
		const doc = globalThis.document;
		doc.addEventListener('pointermove', handlePointerMove);
		doc.addEventListener('pointerup', handlePointerEnd);
		doc.addEventListener('pointercancel', handlePointerEnd);
		globalThis.addEventListener('blur', handleWindowBlur);
	}
	function handlePointerMove(domEvent) {
		if (domEvent.pointerId !== pointerId) {
			return;
		}
		// Free axis — keep the sign. A leftward drag (negative) advances; a
		// rightward drag (positive) goes back. The consumer reads the sign.
		delta = domEvent[clientAxis] - dragOrigin;
		if (!dragMoved) {
			if (Math.abs(delta) <= threshold) {
				return;
			}
			dragMoved = true;
			onStart?.();
		}
		const span = extent();
		const progress = span > 0 ? Math.min(1, Math.abs(delta) / span) : 0;
		onMove?.(delta, progress);
	}
	function handlePointerEnd(domEvent) {
		if (domEvent.pointerId !== pointerId) {
			return;
		}
		stopTracking();
		if (!dragMoved) {
			return;
		}
		/**
		 * A real drag occurred — the click the browser synthesizes next is a side
		 * effect of the press, not an intent (e.g. advance-on-click). Swallow it.
		 */
		suppressClick = true;
		const elapsed = Math.max(performance.now() - startTime, 1);
		const distance = Math.abs(delta);
		const speed = distance / elapsed;
		const span = extent();
		const ratio = span > 0 ? distance / span : 0;
		const commit = ratio >= stepRatio || speed >= stepVelocity;
		// Dragging the track left (delta < 0) moves toward the NEXT detent (+1);
		// dragging right (delta > 0) moves toward the PREVIOUS detent (-1).
		let step = 0;
		if (commit && delta !== 0) {
			const direction = delta < 0 ? 1 : -1;
			if (canStep(direction)) {
				step = direction;
			}
		}
		onSettle?.(step);
	}
	function handleWindowBlur() {
		if (pointerId === null) {
			return;
		}
		// Losing the window mid-drag counts as a release — settle on the travel so
		// far against the live pointer id.
		handlePointerEnd({
			pointerId,
		});
	}
	function handleClick(domEvent) {
		if (!suppressClick) {
			return;
		}
		suppressClick = false;
		domEvent.stopPropagation();
		domEvent.preventDefault();
	}
	startElement.addEventListener('pointerdown', handlePointerDown);
	// Capture phase — kill the post-drag click before it reaches any handler.
	startElement.addEventListener('click', handleClick, true);
	function destroy() {
		if (destroyed) {
			return;
		}
		destroyed = true;
		stopTracking();
		startElement.removeEventListener('pointerdown', handlePointerDown);
		startElement.removeEventListener('click', handleClick, true);
	}
	return {
		destroy,
	};
}
/*
	this.dragTrack(startElement, options) — the WebComponent prototype method.
	Same call as createDragTrack, but the controller is filed in `gestureUnsubs`
	and destroyed automatically on disconnect — the auto-cleanup contract that
	`this.dragSnap()`, `this.hotKey()`, and `this.delegate()` already follow.
*/
export function dragTrack(startElement, options) {
	const controller = createDragTrack(startElement, options);
	(this.gestureUnsubs ??= new Set()).add(controller.destroy);
	return controller;
}
