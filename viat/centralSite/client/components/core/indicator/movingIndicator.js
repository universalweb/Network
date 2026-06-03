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
	movingIndicator(indicatorElement, options) → { moveTo, hide, destroy }

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
export function movingIndicator(indicatorElement, options = {}) {
	if (!indicatorElement) {
		return {
			moveTo: noop,
			hide: noop,
			destroy: noop,
		};
	}
	const prefix = options.prefix || 'ind';
	const visibleClass = options.visibleClass || 'is-visible';
	const snapClass = options.snapClass || 'no-transition';
	const propX = `--${prefix}-x`;
	const propY = `--${prefix}-y`;
	const propW = `--${prefix}-w`;
	const propH = `--${prefix}-h`;
	let pendingFrame = 0;

	function writeMetrics(child) {
		const style = indicatorElement.style;
		style.setProperty(propX, `${child.offsetLeft}px`);
		style.setProperty(propY, `${child.offsetTop}px`);
		style.setProperty(propW, `${child.offsetWidth}px`);
		style.setProperty(propH, `${child.offsetHeight}px`);
	}

	function hide() {
		indicatorElement.classList.remove(visibleClass);
	}

	function moveTo(child, snap = false) {
		if (!child) {
			hide();
			return;
		}
		/**
		 * The suppress-transition class must be on *before* the props change so
		 * the position jump is instant; it comes off next frame.
		 */
		if (snap) {
			indicatorElement.classList.add(snapClass);
		}
		writeMetrics(child);
		indicatorElement.classList.add(visibleClass);
		if (!snap) {
			return;
		}
		// Force the jump to apply, then re-enable the transition next frame.
		indicatorElement.getBoundingClientRect();
		if (pendingFrame) {
			cancelAnimationFrame(pendingFrame);
		}
		pendingFrame = requestAnimationFrame(() => {
			pendingFrame = 0;
			indicatorElement.classList.remove(snapClass);
		});
	}

	function destroy() {
		if (pendingFrame) {
			cancelAnimationFrame(pendingFrame);
			pendingFrame = 0;
		}
	}

	return {
		moveTo,
		hide,
		destroy,
	};
}
