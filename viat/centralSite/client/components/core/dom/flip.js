/*
	DESCRIPTION: FLIP (First/Last/Invert/Play) for reordering lists.
	captureRects before a mutation; playFlip after layout. Reduced-motion is
	checked INSIDE playFlip — it returns no animations and never skips the
	caller's reorder.
	── USAGE ────────────────────────────────────────────────────────────
	  const first = captureRects(elements);
	  // mutate source / layout
	  playFlip(elements, first);
	─────────────────────────────────────────────────────────────────────
*/
export const FLIP_MS = 180;
export const FLIP_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
/**
 * True when the user has asked the UA to minimize non-essential motion.
 * @returns {boolean} Whether reduced-motion is on.
 */
export function prefersReducedMotion() {
	return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}
/**
 * Cancel WAAPI animations running on `element`.
 * @param {Element} element - Animated node.
 */
export function cancelElementMotion(element) {
	if (!element || typeof element.getAnimations !== 'function') {
		return;
	}
	const animations = element.getAnimations();
	const count = animations.length;
	for (let index = 0; index < count; index += 1) {
		animations[index].cancel();
	}
}
/**
 * Snapshot layout boxes keyed by element.
 * @param {Array<Element>|NodeList} elements - Nodes to measure.
 * @returns {Map<Element, DOMRect>} Element → box.
 */
export function captureRects(elements) {
	const map = new Map();
	if (!elements) {
		return map;
	}
	const count = elements.length;
	for (let index = 0; index < count; index += 1) {
		const element = elements[index];
		if (!element || typeof element.getBoundingClientRect !== 'function') {
			continue;
		}
		map.set(element, element.getBoundingClientRect());
	}
	return map;
}
/**
 * Invert-and-play from `firstRects` to the elements' current boxes.
 * Reduced-motion → empty array (reorder still happened).
 * @param {Array<Element>|NodeList} elements - Nodes to animate.
 * @param {Map<Element, {left: number, top: number}>} firstRects - Pre-mutation boxes.
 * @param {{durationMs?: number, easing?: string}} [options] - Timing override.
 * @returns {Animation[]} Running animations (empty when skipped).
 */
export function playFlip(elements, firstRects, options) {
	if (prefersReducedMotion() === true || !elements || !firstRects) {
		return [];
	}
	const durationMs = options?.durationMs ?? FLIP_MS;
	const easing = options?.easing ?? FLIP_EASE;
	const animations = [];
	const count = elements.length;
	for (let index = 0; index < count; index += 1) {
		const element = elements[index];
		const first = firstRects.get(element);
		if (!element || !first || typeof element.animate !== 'function') {
			continue;
		}
		const last = element.getBoundingClientRect();
		const deltaX = first.left - last.left;
		const deltaY = first.top - last.top;
		if (deltaX === 0 && deltaY === 0) {
			continue;
		}
		cancelElementMotion(element);
		animations.push(element.animate([
			{
				transform: `translate(${deltaX}px, ${deltaY}px)`,
			},
			{
				transform: 'none',
			},
		], {
			duration: durationMs,
			easing,
		}));
	}
	return animations;
}
