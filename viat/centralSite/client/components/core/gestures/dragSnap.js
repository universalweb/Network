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

/*
 * Snap-animation timing. The engine never animates; it exports these so every
 * consumer animates the settle with one identical curve.
 */
export const SNAP_MS = 320;
export const SNAP_CURVE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// Gesture-knob defaults — overridable per call through `options`.
const DRAG_THRESHOLD_PX = 6; // raw travel before a press becomes a drag
const SNAP_RATIO = 0.3; // travel fraction (of the snap extent) that flips state
const SNAP_VELOCITY = 0.5; // px/ms that flips state regardless of distance

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

/*
	createDragSnap(startElement, options) → { destroy() }

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
*/
export function createDragSnap(startElement, options = {}) {
	if (!startElement) {
		return {
			destroy() {},
		};
	}
	const axis = options.axis === 'x' ? 'x' : 'y';
	const clientAxis = axis === 'x' ? 'clientX' : 'clientY';
	const opensToward = options.opensToward || (axis === 'x' ? 'right' : 'down');
	const openSign = OPEN_SIGN[opensToward] ?? 1;
	const threshold = options.threshold ?? DRAG_THRESHOLD_PX;
	const snapRatio = options.snapRatio ?? SNAP_RATIO;
	const snapVelocity = options.snapVelocity ?? SNAP_VELOCITY;
	const isEnabled = options.enabled || alwaysTrue;
	const isOpen = options.isOpen || alwaysFalse;
	const extent = options.extent || zero;
	const snapExtent = options.snapExtent || extent;
	const onStart = options.onStart;
	const onMove = options.onMove;
	const onSettle = options.onSettle;

	let pointerId = null;
	let dragOrigin = 0;
	let startTime = 0;
	let delta = 0;
	let dragMoved = false;
	let startedOpen = false;
	let activeSign = 1;
	let suppressClick = false;
	let destroyed = false;

	/**
	 * Keep only the part of `raw` that points in `sign`'s direction; the
	 * opposite direction reads as zero. This is what locks an opening drag to
	 * opening movement and a closing drag to closing movement.
	 */
	function keepDirection(raw, sign) {
		return sign * Math.max(0, sign * raw);
	}

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
		startedOpen = isOpen() === true;
		// A drag from the closed state opens; from the open state it closes.
		activeSign = startedOpen ? -openSign : openSign;
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
		const raw = domEvent[clientAxis] - dragOrigin;
		delta = keepDirection(raw, activeSign);
		if (!dragMoved) {
			if (Math.abs(raw) <= threshold) {
				return;
			}
			dragMoved = true;
			onStart?.(startedOpen);
		}
		const span = extent();
		const progress = span > 0 ? Math.min(1, Math.abs(delta) / span) : 0;
		onMove?.(progress, delta);
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
		 * A real drag occurred — the click the browser synthesizes next is a
		 * side effect of the press, not an intent. Swallow it.
		 */
		suppressClick = true;
		const elapsed = Math.max(performance.now() - startTime, 1);
		const distance = Math.abs(delta);
		const speed = distance / elapsed;
		const basis = snapExtent();
		const ratio = basis > 0 ? distance / basis : 0;
		const shouldFlip = ratio >= snapRatio || speed >= snapVelocity;
		const shouldOpen = startedOpen ? !shouldFlip : shouldFlip;
		onSettle?.(shouldOpen);
	}

	function handleWindowBlur() {
		if (pointerId === null) {
			return;
		}
		/*
		 * Losing the window mid-drag counts as a release — settle on the
		 * distance travelled so far.
		 */
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
	this.dragSnap(startElement, options) — the WebComponent prototype method.
	Same call as createDragSnap, but the controller is filed in `gestureUnsubs`
	and destroyed automatically on disconnect — the auto-cleanup contract that
	`this.hotKey()` and `this.delegate()` already follow.
*/
export function dragSnap(startElement, options) {
	const controller = createDragSnap(startElement, options);
	(this.gestureUnsubs ??= new Set()).add(controller.destroy);
	return controller;
}
