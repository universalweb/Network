/*
	anchor.js — a tiny, dependency-free placement engine for floating UI (menus,
	popovers, tooltips, context-menus). Pure function: given an anchor rect and the
	floating element's size, it returns VIEWPORT coordinates plus the resolved
	placement. Viewport coords work for BOTH a top-layer popover (position: fixed)
	and an overlay-relative surface (caller subtracts the overlay origin).
	It does the two things naive anchoring gets wrong:
	  • FLIP — if the requested side overflows the viewport AND the opposite side
	    fits, flip to it (never flip into a second overflow — keep the request).
	  • SHIFT — clamp the cross-axis so the floating box stays within `padding` of
	    the viewport edges.
	Placement = `<side>-<align>` where side ∈ top|bottom|left|right and
	align ∈ start|center|end (default `bottom-start`).
	Not a full Floating-UI (no arrow mids, no auto-placement search) — deliberately
	the minimum the menu family needs. Measure the floating element only AFTER it is
	visible, and cap its max size in CSS so the measured height is the real one
	(otherwise the flip math reasons about the wrong height).
*/
const OPPOSITE = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
};
function clamp(value, min, max) {
	// Floating bigger than the available span → pin to the start padding rather
	// than producing a negative/inverted range.
	if (max < min) {
		return min;
	}
	return Math.min(Math.max(value, min), max);
}
/**
 * @param {{top:number,left:number,bottom:number,right:number,width:number,height:number}} anchor
 * The anchor's viewport rect (e.g. trigger.getBoundingClientRect()).
 * @param {{width:number,height:number}} floating - The floating element's measured size.
 * @param {object} [options]
 * @param {string} [options.placement='bottom-start']
 * @param {number} [options.offset=8] - Gap between anchor and floating, main axis.
 * @param {number} [options.padding=8] - Min distance kept from viewport edges.
 * @param {boolean} [options.flip=true]
 * @param {boolean} [options.shift=true]
 * @param {number} [options.viewportWidth]
 * @param {number} [options.viewportHeight]
 * @returns {{top:number,left:number,placement:string}} Viewport coords + resolved placement.
 */
export function computeAnchor(anchor, floating, options = {}) {
	const offset = options.offset ?? 8;
	const padding = options.padding ?? 8;
	const viewportWidth = options.viewportWidth ?? globalThis.innerWidth ?? 0;
	const viewportHeight = options.viewportHeight ?? globalThis.innerHeight ?? 0;
	const parts = String(options.placement ?? 'bottom-start').split('-');
	let side = parts[0];
	const align = parts[1] ?? 'start';
	const fitsOn = (candidate) => {
		if (candidate === 'bottom') {
			return anchor.bottom + offset + floating.height <= viewportHeight - padding;
		}
		if (candidate === 'top') {
			return anchor.top - offset - floating.height >= padding;
		}
		if (candidate === 'right') {
			return anchor.right + offset + floating.width <= viewportWidth - padding;
		}
		if (candidate === 'left') {
			return anchor.left - offset - floating.width >= padding;
		}
		return true;
	};
	// Flip ONLY when the request overflows and the opposite genuinely fits.
	if ((options.flip ?? true) && !fitsOn(side) && fitsOn(OPPOSITE[side])) {
		side = OPPOSITE[side];
	}
	const vertical = side === 'top' || side === 'bottom';
	let top;
	let left;
	if (vertical) {
		top = side === 'bottom' ? anchor.bottom + offset : anchor.top - offset - floating.height;
		if (align === 'end') {
			left = anchor.right - floating.width;
		} else if (align === 'center') {
			left = anchor.left + ((anchor.width - floating.width) / 2);
		} else {
			left = anchor.left;
		}
	} else {
		left = side === 'right' ? anchor.right + offset : anchor.left - offset - floating.width;
		if (align === 'end') {
			top = anchor.bottom - floating.height;
		} else if (align === 'center') {
			top = anchor.top + ((anchor.height - floating.height) / 2);
		} else {
			top = anchor.top;
		}
	}
	if (options.shift ?? true) {
		if (vertical) {
			left = clamp(left, padding, viewportWidth - floating.width - padding);
		} else {
			top = clamp(top, padding, viewportHeight - floating.height - padding);
		}
	}
	return {
		top,
		left,
		placement: `${side}-${align}`,
	};
}
