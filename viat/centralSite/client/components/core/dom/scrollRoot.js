/*
 * Shared scroll-root walk — crosses shadow boundaries via host.
 * collectionEngine IO roots require real overflow; virtual lists at first
 * paint do not (nothing overflows yet) → requireOverflow: false.
 */
const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/;
/**
 * Nearest scrollable ancestor of startElement, or null (viewport / document).
 * @param {Element|null|undefined} startElement - Walk start.
 * @param {{requireOverflow?:boolean}} [options] - When true (default), node must
 * already overflow (scrollHeight > clientHeight). Virtual lists pass false.
 * @returns {Element|null}
 */
export function findScrollableAncestor(startElement, options = {}) {
	const requireOverflow = options.requireOverflow !== false;
	let node = startElement;
	while (node && node.nodeType === 1) {
		const overflowY = getComputedStyle(node).overflowY;
		if (SCROLLABLE_OVERFLOW.test(overflowY)) {
			if (!requireOverflow || node.scrollHeight > node.clientHeight) {
				return node;
			}
		} else if (
			!requireOverflow &&
			overflowY === 'hidden' &&
			node.clientHeight > 0 &&
			node.scrollHeight > node.clientHeight + 1
		) {
			/*
			 * Overlay scroll-lock freezes the real scroller with overflow:hidden.
			 * Still the box that will scroll once unlocked — virtual attach during
			 * boot must bind here, not fall through to document.
			 */
			return node;
		}
		const ancestor = node.parentNode;
		node = ancestor && ancestor.nodeType === 11 ? ancestor.host : ancestor;
	}
	return null;
}
