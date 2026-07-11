/*
	movingIndicator — the sliding pill that tracks a selected child.
	A small element (a tab strip's underline, the dock's active bar) that
	measures a chosen child and slides itself to sit behind it. `global/tabs`
	and `global-dock` each carried a private build of this; it is now one engine.
	The engine measures the child and writes its position + size as CSS custom
	properties on the indicator — both axes, every move, so the consumer's
	stylesheet picks the pair it honours by orientation. It toggles a visible
	class and handles the snap case, where a move (first show, a resize, an
	orientation flip) must land with no transition. The transition itself, and
	any flourish beyond a straight slide, stay in the consumer's CSS.
*/
function noop() {}
/*
	MovingIndicator(indicatorElement, options) — construct via the static
	`MovingIndicator.create(element, opts)`, or the `movingIndicator(element, opts)` entry
	below (which returns a no-op handle when given no element).
	options:
	  prefix        CSS custom-property stem — writes
	                --<prefix>-x / -y / -w / -h        (default 'ind')
	  visibleClass  class that reveals the indicator    (default 'is-visible')
	  snapClass     class that suppresses the transition for one frame
	                                                    (default 'no-transition')
	moveTo(child, snap)  measure `child`, write the props, reveal. `snap` true
	                     lands the move with no transition. A falsy `child`
	                     hides the indicator.
	hide()               hide the indicator (no selected child).
	destroy()            cancel any pending snap frame.
*/
export class MovingIndicator {
	#pendingFrame = 0;
	constructor(indicatorElement, options = {}) {
		const prefix = options.prefix || 'ind';
		this.indicatorElement = indicatorElement;
		this.visibleClass = options.visibleClass || 'is-visible';
		this.snapClass = options.snapClass || 'no-transition';
		this.propX = `--${prefix}-x`;
		this.propY = `--${prefix}-y`;
		this.propW = `--${prefix}-w`;
		this.propH = `--${prefix}-h`;
	}
	static create(indicatorElement, options) {
		return new MovingIndicator(indicatorElement, options);
	}
	#writeMetrics(child) {
		const elementStyle = this.indicatorElement.style;
		elementStyle.setProperty(this.propX, `${child.offsetLeft}px`);
		elementStyle.setProperty(this.propY, `${child.offsetTop}px`);
		elementStyle.setProperty(this.propW, `${child.offsetWidth}px`);
		elementStyle.setProperty(this.propH, `${child.offsetHeight}px`);
	}
	/*
	 * The snap frame body — extracted to a named method so the rAF call site can
	 * forward to it. A bare `this.#onSnapFrame` reference would lose `this` (rAF
	 * invokes with no receiver), and `.bind` is forbidden, so the call site uses a
	 * thin forwarding arrow per the js-style deferred-callback rule.
	 */
	#onSnapFrame() {
		this.#pendingFrame = 0;
		this.indicatorElement.classList.remove(this.snapClass);
	}
	hide() {
		this.indicatorElement.classList.remove(this.visibleClass);
	}
	moveTo(child, snap = false) {
		if (!child) {
			this.hide();
			return;
		}
		/**
		 * The suppress-transition class must be on *before* the props change so
		 * the position jump is instant; it comes off next frame.
		 */
		if (snap) {
			this.indicatorElement.classList.add(this.snapClass);
		}
		this.#writeMetrics(child);
		this.indicatorElement.classList.add(this.visibleClass);
		if (!snap) {
			return;
		}
		// Force the jump to apply, then re-enable the transition next frame.
		this.indicatorElement.getBoundingClientRect();
		if (this.#pendingFrame) {
			cancelAnimationFrame(this.#pendingFrame);
		}
		this.#pendingFrame = requestAnimationFrame(() => {
			this.#onSnapFrame();
		});
	}
	destroy() {
		if (this.#pendingFrame) {
			cancelAnimationFrame(this.#pendingFrame);
			this.#pendingFrame = 0;
		}
	}
}
/*
 * No-element handle: the same {moveTo, hide, destroy} surface, all no-ops, so
 * callers never branch on a missing indicator. Shared + frozen — the methods
 * hold no per-instance state.
 */
const NOOP_INDICATOR = Object.freeze({
	moveTo: noop,
	hide: noop,
	destroy: noop,
});
/**
 * Backwards-compatible entry — preserves the original `movingIndicator(element, opts)`
 * call shape. Returns a live `MovingIndicator` when given an element, or the
 * shared no-op handle when not.
 */
export function movingIndicator(indicatorElement, options = {}) {
	if (!indicatorElement) {
		return NOOP_INDICATOR;
	}
	return MovingIndicator.create(indicatorElement, options);
}
