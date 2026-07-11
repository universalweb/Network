/*
 * Pure drag geometry for the top-bar pulldown — no DOM, unit-testable.
 *
 * The pulldown snap is a 320ms CSS transition, so the committed open/closed
 * boolean leads the bar's *rendered* position. A gesture that positioned the
 * bar from the boolean (`open ? max*(1-progress) : max*progress`) teleported it
 * to the wrong end whenever a drag began mid-animation (grab the bar inside the
 * snap, or after rapid toggles): the bar jumped to the bottom, then snapped
 * back up. The cure is to track the bar's ACTUAL offset — capture where it is
 * when the drag starts, then follow the pointer from there.
 */
/**
 * Where the bar should sit this move: the offset it started the drag at, plus
 * the pointer's signed travel, clamped to the [0, max] travel span.
 * @param {number} startOffset - Rendered translateY when the drag began (px).
 * @param {number} delta - Signed pointer travel along the axis (px).
 * @param {number} maxOffset - Open-position travel extent (px).
 * @returns {number} The clamped target offset (px).
 */
export function clampOffset(startOffset, delta, maxOffset) {
	const next = startOffset + delta;
	if (next < 0) {
		return 0;
	}
	if (next > maxOffset) {
		return maxOffset;
	}
	return next;
}
/**
 * Is the bar more open than closed right now? Read from the rendered offset, not
 * the boolean — this is what decides whether a fresh drag opens or closes, so it
 * must reflect what the user sees mid-animation.
 * @param {number} offset - Current rendered translateY (px).
 * @param {number} maxOffset - Open-position travel extent (px).
 * @returns {boolean} True once past the halfway line.
 */
export function offsetIsOpen(offset, maxOffset) {
	return offset > maxOffset / 2;
}
