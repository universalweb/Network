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
import { lockSelection, unlockSelection } from './selectionLock.js';
export { SNAP_CURVE, SNAP_MS };
// Gesture-knob defaults — overridable per call through `options`.
// Raw travel before a press becomes a drag.
const DRAG_THRESHOLD_PX = 8;
// Travel fraction (of one detent) that commits a step.
const STEP_RATIO = 0.25;
// px/ms fling that commits a step regardless of distance.
const STEP_VELOCITY = 0.4;
function alwaysTrue() {
	return true;
}
function zero() {
	return 0;
}
/*
	DragTrack.create(startElement, options) → DragTrack
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
	The controller files itself as an EventListenerObject (it implements
	`handleEvent`), so a single instance reference serves as every listener and
	there are no per-instance handler closures to track. Tear it down with
	`destroy()`; `unsubscribe()` is the same teardown under the `disposeItem`
	protocol name.
*/
export class DragTrack {
	#startElement;
	#clientAxis;
	#threshold;
	#stepRatio;
	#stepVelocity;
	#isEnabled;
	#extent;
	#canStep;
	#onStart;
	#onMove;
	#onSettle;
	#pointerId = null;
	#dragOrigin = 0;
	#startTime = 0;
	#delta = 0;
	#dragMoved = false;
	#suppressClick = false;
	#destroyed = false;
	/**
	 * The construction path — prefer this over `new DragTrack()`. Builds the
	 * controller and, when there is a start element, wires its press/click
	 * listeners. A missing element yields an inert controller whose `destroy()`
	 * is a safe no-op.
	 * @returns {DragTrack} the wired (or inert) controller.
	 */
	static create(startElement, options = {}) {
		const controller = new DragTrack(startElement, options);
		controller.#listen();
		return controller;
	}
	constructor(startElement, options = {}) {
		this.#startElement = startElement || null;
		const axis = options.axis === 'y' ? 'y' : 'x';
		this.#clientAxis = axis === 'y' ? 'clientY' : 'clientX';
		this.#threshold = options.threshold ?? DRAG_THRESHOLD_PX;
		this.#stepRatio = options.stepRatio ?? STEP_RATIO;
		this.#stepVelocity = options.stepVelocity ?? STEP_VELOCITY;
		this.#isEnabled = options.enabled || alwaysTrue;
		this.#extent = options.extent || zero;
		this.#canStep = options.canStep || alwaysTrue;
		this.#onStart = options.onStart;
		this.#onMove = options.onMove;
		this.#onSettle = options.onSettle;
	}
	/**
	 * The DOM dispatches every registered event here because the instance is the
	 * listener. Route each type to its handler; the start element's press/click
	 * and the document's move/end/blur all funnel through this one entry point.
	 */
	handleEvent(domEvent) {
		switch (domEvent.type) {
			case 'pointerdown':
				this.#onPointerDown(domEvent);
				break;
			case 'pointermove':
				this.#onPointerMove(domEvent);
				break;
			case 'pointerup':
			case 'pointercancel':
				this.#onPointerEnd(domEvent);
				break;
			case 'blur':
				this.#onWindowBlur();
				break;
			case 'click':
				this.#onClick(domEvent);
				break;
			default:
				break;
		}
	}
	#listen() {
		const startElement = this.#startElement;
		if (!startElement) {
			return;
		}
		startElement.addEventListener('pointerdown', this);
		// Capture phase — kill the post-drag click before it reaches any handler.
		startElement.addEventListener('click', this, true);
	}
	#startTracking() {
		const doc = globalThis.document;
		doc.addEventListener('pointermove', this);
		doc.addEventListener('pointerup', this);
		doc.addEventListener('pointercancel', this);
		globalThis.addEventListener('blur', this);
		// Suppress drag-selection for the press lifetime. Paired with the release
		// below; the pointerId guard keeps the ref-count balanced on double-stop.
		lockSelection();
	}
	#stopTracking() {
		if (this.#pointerId === null) {
			return;
		}
		const doc = globalThis.document;
		doc.removeEventListener('pointermove', this);
		doc.removeEventListener('pointerup', this);
		doc.removeEventListener('pointercancel', this);
		globalThis.removeEventListener('blur', this);
		this.#pointerId = null;
		unlockSelection();
	}
	#onPointerDown(domEvent) {
		if (this.#destroyed || this.#pointerId !== null) {
			return;
		}
		if (domEvent.button !== undefined && domEvent.button !== 0) {
			return;
		}
		if (!this.#isEnabled(domEvent)) {
			return;
		}
		this.#pointerId = domEvent.pointerId;
		this.#dragOrigin = domEvent[this.#clientAxis];
		this.#startTime = performance.now();
		this.#delta = 0;
		this.#dragMoved = false;
		this.#suppressClick = false;
		this.#startTracking();
	}
	#onPointerMove(domEvent) {
		if (domEvent.pointerId !== this.#pointerId) {
			return;
		}
		/*
		 * Free axis — keep the sign. A leftward drag (negative) advances; a
		 * rightward drag (positive) goes back. The consumer reads the sign.
		 */
		this.#delta = domEvent[this.#clientAxis] - this.#dragOrigin;
		if (!this.#dragMoved) {
			if (Math.abs(this.#delta) <= this.#threshold) {
				return;
			}
			this.#dragMoved = true;
			this.#onStart?.();
		}
		const span = this.#extent();
		const progress = span > 0 ? Math.min(1, Math.abs(this.#delta) / span) : 0;
		this.#onMove?.(this.#delta, progress);
	}
	#onPointerEnd(domEvent) {
		if (domEvent.pointerId !== this.#pointerId) {
			return;
		}
		this.#settle();
	}
	#onWindowBlur() {
		if (this.#pointerId === null) {
			return;
		}
		/*
		 * Losing the window mid-drag counts as a release — settle on the travel so
		 * far against the live pointer id.
		 */
		this.#settle();
	}
	#settle() {
		this.#stopTracking();
		if (!this.#dragMoved) {
			return;
		}
		/**
		 * A real drag occurred — the click the browser synthesizes next is a side
		 * effect of the press, not an intent (e.g. advance-on-click). Swallow it.
		 */
		this.#suppressClick = true;
		const elapsed = Math.max(performance.now() - this.#startTime, 1);
		const distance = Math.abs(this.#delta);
		const speed = distance / elapsed;
		const span = this.#extent();
		const ratio = span > 0 ? distance / span : 0;
		const commit = ratio >= this.#stepRatio || speed >= this.#stepVelocity;
		/*
		 * Dragging the track left (delta < 0) moves toward the NEXT detent (+1);
		 * dragging right (delta > 0) moves toward the PREVIOUS detent (-1).
		 */
		let step = 0;
		if (commit && this.#delta !== 0) {
			const direction = this.#delta < 0 ? 1 : -1;
			if (this.#canStep(direction)) {
				step = direction;
			}
		}
		this.#onSettle?.(step);
	}
	#onClick(domEvent) {
		if (!this.#suppressClick) {
			return;
		}
		this.#suppressClick = false;
		domEvent.stopPropagation();
		domEvent.preventDefault();
	}
	destroy() {
		if (this.#destroyed) {
			return;
		}
		this.#destroyed = true;
		this.#stopTracking();
		const startElement = this.#startElement;
		if (startElement) {
			startElement.removeEventListener('pointerdown', this);
			startElement.removeEventListener('click', this, true);
		}
	}
	/**
	 * Adapter for the polymorphic `disposeItem` disposer protocol, which calls
	 * `.unsubscribe()` on Subscription-like items. Filing the instance under this
	 * name lets `gestureUnsubs` hold the controller itself instead of a bare
	 * `destroy` reference that would lose `this` when invoked detached.
	 */
	unsubscribe() {
		this.destroy();
	}
}
/*
	this.dragTrack(startElement, options) — the WebComponent prototype method.
	Same call as DragTrack.create, but the controller is filed in `gestureUnsubs`
	and torn down automatically on disconnect — the auto-cleanup contract that
	`this.dragSnap()`, `this.hotKey()`, and `this.delegate()` already follow. The
	instance itself is filed (not its bare `destroy`) so `disposeItem` invokes
	`.unsubscribe()` with `this` intact.
*/
export function dragTrack(startElement, options) {
	const controller = DragTrack.create(startElement, options);
	(this.gestureUnsubs ??= new Set()).add(controller);
	return controller;
}
