/*
	dragSnap — the one drag-to-snap gesture engine.
	A press, a drag along a single axis, a release that snaps a panel between
	two states (open / closed). The global top bar's pulldown handle and the
	sidebar's swipe each carried a private, line-for-line copy of this — same
	constants, same pointer bookkeeping, same velocity/travel snap maths. This
	is the single engine they both compose.
	The engine owns the *mechanic*: the single-pointer lifecycle, document-wide
	move tracking (a press can drag anywhere), the move-threshold gate that
	separates a tap from a drag, the velocity + travel-ratio snap verdict,
	click-suppression after a drag, and blur-cancel. The consumer owns the
	*visuals*: where the panel sits during the drag and how it animates to the
	snap point afterwards — supplied through callbacks.
*/
import { lockSelection, unlockSelection } from './selectionLock.js';
/*
 * Snap-animation timing. The engine never animates; it exports these so every
 * consumer animates the settle with one identical curve.
 */
export const SNAP_MS = 320;
export const SNAP_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
// Gesture-knob defaults — overridable per call through `options`.
// Raw travel before a press becomes a drag.
const DRAG_THRESHOLD_PX = 6;
// Travel fraction (of the snap extent) that flips state.
const SNAP_RATIO = 0.3;
// px/ms that flips state regardless of distance.
const SNAP_VELOCITY = 0.5;
/*
 * `opensToward` → the sign of axis movement that opens the panel. A pulldown
 * opens downward (+y); a right-edge drawer opens leftward (-x).
 */
const OPEN_SIGN = {
	down: 1,
	right: 1,
	up: -1,
	left: -1,
};
function alwaysTrue() {
	return true;
}
function alwaysFalse() {
	return false;
}
function zero() {
	return 0;
}
/**
 * Keep only the part of `raw` that points in `sign`'s direction; the opposite
 * direction reads as zero. This is what locks an opening drag to opening
 * movement and a closing drag to closing movement.
 * @returns {number} the direction-clamped travel.
 */
function keepDirection(raw, sign) {
	return sign * Math.max(0, sign * raw);
}
/*
	DragSnap.create(startElement, options) → DragSnap
	options:
	  axis          'x' | 'y'                   — drag axis (default 'y')
	  opensToward   'down'|'up'|'left'|'right'   — which way opens
	                                              (default 'down' / 'right')
	  threshold     px before a press is a drag            (default 6)
	  snapRatio     travel fraction that flips state       (default 0.3)
	  snapVelocity  px/ms that flips state                 (default 0.5)
	  enabled(domEvent) → boolean   — gate; vetoes a press    (default true)
	  isOpen() → boolean            — panel state, read at press
	  extent() → px                 — travel span, for `progress` 0..1
	  snapExtent() → px             — denominator of the flip ratio
	                                  (default: `extent`)
	  onStart(startedOpen)          — fired once, when the drag clears threshold
	  onMove(progress, delta)       — every tracked move; consumer positions
	  onSettle(shouldOpen)          — release verdict; consumer animates + commits
	The controller files itself as an EventListenerObject (it implements
	`handleEvent`), so a single instance reference serves as every listener and
	there are no per-instance handler closures to track. Tear it down with
	`destroy()`; `unsubscribe()` is the same teardown under the `disposeItem`
	protocol name.
*/
export class DragSnap {
	#startElement;
	#clientAxis;
	#openSign;
	#threshold;
	#snapRatio;
	#snapVelocity;
	#isEnabled;
	#isOpen;
	#extent;
	#snapExtent;
	#onStart;
	#onMove;
	#onSettle;
	#pointerId = null;
	#dragOrigin = 0;
	#startTime = 0;
	#delta = 0;
	#dragMoved = false;
	#startedOpen = false;
	#activeSign = 1;
	#suppressClick = false;
	#destroyed = false;
	/**
	 * The construction path — prefer this over `new DragSnap()`. Builds the
	 * controller and, when there is a start element, wires its press/click
	 * listeners. A missing element yields an inert controller whose `destroy()`
	 * is a safe no-op.
	 * @returns {DragSnap} the wired (or inert) controller.
	 */
	static create(startElement, options = {}) {
		const controller = new DragSnap(startElement, options);
		controller.#listen();
		return controller;
	}
	constructor(startElement, options = {}) {
		this.#startElement = startElement || null;
		const axis = options.axis === 'x' ? 'x' : 'y';
		this.#clientAxis = axis === 'x' ? 'clientX' : 'clientY';
		const opensToward = options.opensToward || (axis === 'x' ? 'right' : 'down');
		this.#openSign = OPEN_SIGN[opensToward] ?? 1;
		this.#threshold = options.threshold ?? DRAG_THRESHOLD_PX;
		this.#snapRatio = options.snapRatio ?? SNAP_RATIO;
		this.#snapVelocity = options.snapVelocity ?? SNAP_VELOCITY;
		this.#isEnabled = options.enabled || alwaysTrue;
		this.#isOpen = options.isOpen || alwaysFalse;
		this.#extent = options.extent || zero;
		this.#snapExtent = options.snapExtent || this.#extent;
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
		this.#startedOpen = this.#isOpen() === true;
		// A drag from the closed state opens; from the open state it closes.
		this.#activeSign = this.#startedOpen ? -this.#openSign : this.#openSign;
		this.#startTracking();
	}
	#onPointerMove(domEvent) {
		if (domEvent.pointerId !== this.#pointerId) {
			return;
		}
		const raw = domEvent[this.#clientAxis] - this.#dragOrigin;
		this.#delta = keepDirection(raw, this.#activeSign);
		if (!this.#dragMoved) {
			if (Math.abs(raw) <= this.#threshold) {
				return;
			}
			this.#dragMoved = true;
			this.#onStart?.(this.#startedOpen);
		}
		const span = this.#extent();
		const progress = span > 0 ? Math.min(1, Math.abs(this.#delta) / span) : 0;
		this.#onMove?.(progress, this.#delta);
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
		 * Losing the window mid-drag counts as a release — settle on the distance
		 * travelled so far.
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
		 * effect of the press, not an intent. Swallow it.
		 */
		this.#suppressClick = true;
		const elapsed = Math.max(performance.now() - this.#startTime, 1);
		const distance = Math.abs(this.#delta);
		const speed = distance / elapsed;
		const basis = this.#snapExtent();
		const ratio = basis > 0 ? distance / basis : 0;
		const shouldFlip = ratio >= this.#snapRatio || speed >= this.#snapVelocity;
		const shouldOpen = this.#startedOpen ? !shouldFlip : shouldFlip;
		this.#onSettle?.(shouldOpen);
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
	this.dragSnap(startElement, options) — the WebComponent prototype method.
	Same call as DragSnap.create, but the controller is filed in `gestureUnsubs`
	and torn down automatically on disconnect — the auto-cleanup contract that
	`this.dragTrack()`, `this.hotKey()`, and `this.delegate()` already follow. The
	instance itself is filed (not its bare `destroy`) so `disposeItem` invokes
	`.unsubscribe()` with `this` intact.
*/
export function dragSnap(startElement, options) {
	const controller = DragSnap.create(startElement, options);
	(this.gestureUnsubs ??= new Set()).add(controller);
	return controller;
}
