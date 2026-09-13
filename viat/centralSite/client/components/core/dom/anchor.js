/*
	anchor.js — a tiny, dependency-free placement engine for floating UI (menus,
	popovers, tooltips, context-menus). Pure function: given an anchor rect and the
	floating element's size, it returns VIEWPORT coordinates plus the resolved
	placement. Viewport coords work for BOTH a top-layer popover (position: fixed)
	and an overlay-relative surface (caller subtracts the overlay origin).
	It does the two things naive anchoring gets wrong, plus one opt-in:
	  • FLIP — if the requested side overflows the viewport AND the opposite side
	    fits, flip to it (never flip into a second overflow — keep the request).
	  • SHIFT — clamp the cross-axis so the floating box stays within `padding` of
	    the viewport edges.
	  • fallbackAxis (default false) — if neither the request nor its opposite
	    fits, try the two orthogonal sides (vertical request → right then left;
	    horizontal → bottom then top) and take the first that fits. If none fit,
	    keep the request (shift-clamped). The menu family leaves this off.
	Placement = `<side>-<align>` where side ∈ top|bottom|left|right and
	align ∈ start|center|end (default `bottom-start`).
	Not a full Floating-UI (no arrow mids). Measure the floating element only AFTER
	it is visible, and cap its max size in CSS so the measured height is the real
	one (otherwise the flip math reasons about the wrong height).
*/
const OPPOSITE = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left',
};
const ORTHOGONAL = {
	top: ['right', 'left'],
	bottom: ['right', 'left'],
	left: ['bottom', 'top'],
	right: ['bottom', 'top'],
};
function clamp(value, min, max) {
	// Floating bigger than the available span → pin to the start padding rather
	// than producing a negative/inverted range.
	if (max < min) {
		return min;
	}
	return Math.min(Math.max(value, min), max);
}
/*
 * Whether the floating box fits on `candidate` side of the anchor within the
 * padded viewport. First-class module function (not a per-call closure) — the
 * geometry rides in as arguments, so computeAnchor allocates nothing to ask
 * the flip question twice.
 */
function fitsOn(candidate, anchor, floating, offset, padding, viewportWidth, viewportHeight) {
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
}
/*
 * First orthogonal side that fits, else the original `side`. First-class so
 * computeAnchor does not allocate a searcher per call.
 */
function pickFallbackSide(side, anchor, floating, offset, padding, viewportWidth, viewportHeight) {
	const candidates = ORTHOGONAL[side];
	if (!candidates) {
		return side;
	}
	const candidateCount = candidates.length;
	for (let index = 0; index < candidateCount; index += 1) {
		const candidate = candidates[index];
		if (fitsOn(candidate, anchor, floating, offset, padding, viewportWidth, viewportHeight)) {
			return candidate;
		}
	}
	return side;
}
/**
 * Viewport coords + resolved placement for a floating box next to an anchor.
 * @param {{top:number,left:number,bottom:number,right:number,width:number,height:number}} anchor
 * The anchor's viewport rect (e.g. trigger.getBoundingClientRect()).
 * @param {{width:number,height:number}} floating - The floating element's measured size.
 * @param {object} [options] - Placement knobs. Omit any key for its default.
 * @param {string} [options.placement='bottom-start'] - `<side>-<align>`.
 * @param {number} [options.offset=8] - Gap between anchor and floating, main axis.
 * @param {number} [options.padding=8] - Min distance kept from viewport edges.
 * @param {boolean} [options.flip=true] - Flip to the opposite side when it fits.
 * @param {boolean} [options.fallbackAxis=false] - Orthogonal search after flip fails.
 * @param {boolean} [options.shift=true] - Clamp the cross-axis inside padding.
 * @param {number} [options.viewportWidth] - Override `globalThis.innerWidth`.
 * @param {number} [options.viewportHeight] - Override `globalThis.innerHeight`.
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
	const requested = side;
	const requestedFits = fitsOn(requested, anchor, floating, offset, padding, viewportWidth, viewportHeight);
	let oppositeFits = false;
	if (!requestedFits) {
		oppositeFits = fitsOn(OPPOSITE[requested], anchor, floating, offset, padding, viewportWidth, viewportHeight);
	}
	// Flip ONLY when the request overflows and the opposite genuinely fits.
	if ((options.flip ?? true) && !requestedFits && oppositeFits) {
		side = OPPOSITE[requested];
	}
	// Orthogonal search is opt-in — default off so menu / context-menu /
	// nav-section / morph-surface stay request-or-opposite only.
	if (options.fallbackAxis === true && !requestedFits && !oppositeFits) {
		side = pickFallbackSide(requested, anchor, floating, offset, padding, viewportWidth, viewportHeight);
	}
	const vertical = side === 'top' || side === 'bottom';
	let topPosition;
	let left;
	if (vertical) {
		topPosition = side === 'bottom' ? anchor.bottom + offset : anchor.top - offset - floating.height;
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
			topPosition = anchor.bottom - floating.height;
		} else if (align === 'center') {
			topPosition = anchor.top + ((anchor.height - floating.height) / 2);
		} else {
			topPosition = anchor.top;
		}
	}
	if (options.shift ?? true) {
		if (vertical) {
			left = clamp(left, padding, viewportWidth - floating.width - padding);
		} else {
			topPosition = clamp(topPosition, padding, viewportHeight - floating.height - padding);
		}
	}
	return {
		top: topPosition,
		left,
		placement: `${side}-${align}`,
	};
}
/**
 * Write viewport coords onto a top-layer / `position: fixed` surface.
 * @param {HTMLElement} surface - Floating panel.
 * @param {{top:number,left:number,placement:string}} placed - computeAnchor result.
 * @returns {{top:number,left:number,placement:string}} The same `placed` object.
 */
export function applyAnchor(surface, placed) {
	surface.style.top = `${placed.top}px`;
	surface.style.left = `${placed.left}px`;
	surface.dataset.placement = placed.placement;
	return placed;
}
/**
 * Measure trigger + surface, then pin the surface with computeAnchor.
 * Shared popover-position helper — menu / dropdowns / hover-card call this
 * (or applyAnchor after their own measure). Not a positioning class.
 * @param {HTMLElement} surface - Floating panel (must be visible / measurable).
 * @param {Element} trigger - Anchor element.
 * @param {object} [options] - computeAnchor knobs plus `matchWidth`.
 * @param {boolean} [options.matchWidth] - Floor the panel to the trigger width.
 * @returns {{top:number,left:number,placement:string}|null} Placed coords, or null.
 */
export function positionOverlay(surface, trigger, options = {}) {
	if (!surface || !trigger) {
		return null;
	}
	const triggerBox = trigger.getBoundingClientRect();
	if (options.matchWidth) {
		surface.style.minInlineSize = `${triggerBox.width}px`;
	}
	const placed = computeAnchor(triggerBox, {
		width: surface.offsetWidth,
		height: surface.offsetHeight,
	}, options);
	return applyAnchor(surface, placed);
}
/**
 * True when the trigger has a laid-out box. A 0×0 / origin box is the
 * ifThen-mount flash: the popover would pin to viewport 0,0 for one frame.
 * @param {Element|null|undefined} trigger - Anchor element.
 * @returns {boolean} Whether getBoundingClientRect reports a real size.
 */
export function triggerBoxReady(trigger) {
	if (!trigger || typeof trigger.getBoundingClientRect !== 'function') {
		return false;
	}
	const box = trigger.getBoundingClientRect();
	return box.width > 0 && box.height > 0;
}
/**
 * Hide a popover surface before showPopover so the UA default origin (0,0)
 * cannot paint. positionOverlayWhenReady reveals after a real place.
 * @param {HTMLElement|null|undefined} surface - Floating panel.
 */
export function hideOverlay(surface) {
	if (!surface?.style) {
		return;
	}
	/*
	 * Cloak is only for the pre-show 0,0 flash. An already-open popover is
	 * placed — hiding it again (typeahead openList, syncOpen while open)
	 * drops the list because handleToggle / positionPanel do not re-run.
	 */
	if (typeof surface.matches === 'function' && surface.matches(':popover-open')) {
		return;
	}
	surface.style.visibility = 'hidden';
}
const pendingPlace = [];
function flushPendingPlace() {
	const queue = pendingPlace.splice(0, pendingPlace.length);
	const queueCount = queue.length;
	let reschedule = false;
	for (let index = 0; index < queueCount; index++) {
		const entry = queue[index];
		const surface = entry.surface;
		if (surface && triggerBoxReady(entry.trigger)) {
			const placed = positionOverlay(surface, entry.trigger, entry.options);
			if (placed && surface.style) {
				surface.style.visibility = '';
			}
			continue;
		}
		if (surface && entry.retried !== true) {
			entry.retried = true;
			pendingPlace.push(entry);
			reschedule = true;
		}
	}
	if (reschedule && typeof globalThis.requestAnimationFrame === 'function') {
		globalThis.requestAnimationFrame(flushPendingPlace);
	}
}
/**
 * Pin a popover after the trigger has a real box. Hides the surface until then
 * so a native popover cannot paint at viewport 0,0. Uncloaks only after a
 * successful place. One extra rAF if the trigger is still 0×0 — no poll.
 * @param {HTMLElement} surface - Floating panel.
 * @param {Element} trigger - Anchor element.
 * @param {object} [options] - positionOverlay knobs.
 * @returns {{top:number,left:number,placement:string}|null} Placed coords, or null when deferred.
 */
export function positionOverlayWhenReady(surface, trigger, options = {}) {
	if (!surface || !trigger) {
		return null;
	}
	if (triggerBoxReady(trigger)) {
		const placed = positionOverlay(surface, trigger, options);
		surface.style.visibility = '';
		return placed;
	}
	surface.style.visibility = 'hidden';
	if (pendingPlace.push({
		surface,
		trigger,
		options,
	}) === 1 && typeof globalThis.requestAnimationFrame === 'function') {
		globalThis.requestAnimationFrame(flushPendingPlace);
	}
	return null;
}
