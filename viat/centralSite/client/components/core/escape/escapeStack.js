/*
 * ESC dismissal order — a LIFO stack of the currently OPEN dismissible layers.
 *
 * WHY THIS IS BOOKKEEPING AND NOT A LISTENER
 * Escape already has many handlers: ~11 components test `key === 'Escape'` in
 * their own local keydown handler, MorphSurface binds a GLOBAL keydown per open
 * surface, and modules/app.js registers a document-level `escape` hotkey. Adding
 * one more document-level listener would mean every existing handler had to
 * learn to signal consumption, and any single one missed would dismiss two
 * layers on one keypress.
 *
 * So this module owns NO listener. Each component keeps the ESC handling it
 * already has and adds one guard — `if (!isTopEscapable(this)) return;` — which
 * is additive, migratable one component at a time, and cannot double-fire.
 *
 * The stack answers exactly one question: "of everything currently open, am I
 * the most recent?" That is what makes ESC close the top layer instead of all of
 * them (which is what MorphSurface does today — every open surface binds its own
 * global listener and they all run) or the oldest (which is what any scheme
 * built on the hotkey registry would give, since its dispatch iterates a Set in
 * insertion order and invokes every entry without consumption).
 *
 * DO NOT REGISTER a `popover="auto"` or `<dialog>` surface. The UA already
 * light-dismisses those in correct LIFO order via the top layer; registering
 * them means the UA closes one and our guard lets another close too. Verified
 * UA-dismissed today: modal, command, alert-dialog and the gallery lightbox
 * (`<dialog>`); menu, context-menu and menubar (`popover="auto"`).
 *
 * NO FALL-THROUGH by design. If the top layer declines to close (an unsaved-work
 * guard, say), ESC is spent. Falling through to the layer beneath would dismiss
 * the thing behind a guard dialog, which is worse than doing nothing.
 */
const stack = [];
/*
 * Strong references, deliberately: an entry only lives here while its component
 * is OPEN, and every member releases on close and on disconnect. `pruneDead` is
 * the belt-and-braces for a component torn out of the DOM without either.
 */
function pruneDead() {
	for (let index = stack.length - 1; index >= 0; index -= 1) {
		if (stack[index].isConnected === false) {
			stack.splice(index, 1);
		}
	}
}
/**
 * Mark `component` as the newest open dismissible layer. Call on OPEN.
 * Idempotent — re-pushing a component already on the stack moves it to the top
 * rather than stacking a duplicate, so a double-open cannot wedge the ordering.
 * @param {object} component - The component becoming dismissible.
 * @returns {Function} Release callback; safe to call more than once.
 */
export function pushEscapable(component) {
	releaseEscapable(component);
	stack.push(component);
	return function releaseThis() {
		releaseEscapable(component);
	};
}
/**
 * Remove `component` from the stack. Call on CLOSE and on disconnect.
 * @param {object} component - The component that is no longer dismissible.
 */
export function releaseEscapable(component) {
	const index = stack.lastIndexOf(component);
	if (index !== -1) {
		stack.splice(index, 1);
	}
}
/*
 * UA-MANAGED LAYERS OUTRANK REGISTERED ONES.
 *
 * The header explains why a modal <dialog> or a popover="auto" must NOT be pushed
 * here: the UA light-dismisses them already, so registering one kills two layers
 * on a single Escape. Not tracking them at all left the OPPOSITE hole — a
 * registered layer sitting UNDERNEATH an open dialog still answered "I am top",
 * so Escape dismissed the buried layer and left the dialog above it standing.
 *
 * Verified live before this was written: an open overlay sidebar under
 * showModal() reported depth 1 and isTopEscapable === true, then closed on Escape
 * while the dialog did not. That is the reported "Escape closes the sidebar too".
 *
 * So the stack does not TRACK those surfaces, it OBSERVES them at ask-time. A UA
 * surface outranks a registered entry unless the entry lives INSIDE it — a
 * combobox opened within a modal dialog is genuinely the newer layer and keeps
 * Escape.
 */
/*
 * A pseudo-class the engine does not know throws, and a core dismissal path must
 * not be takeable down by a selector-support gap. Probe results are cached
 * because these run on every Escape.
 */
let popoverSelectorWorks = null;
/**
 * Whether an auto/hint popover is currently showing.
 * @param {Element} element - A popover element.
 * @returns {boolean} Whether it is open.
 */
function isPopoverOpen(element) {
	/* Defensive only: an engine without `:popover-open` has no popover API
	   either, so `element.popover` is undefined and this is never reached. */
	if (popoverSelectorWorks === false) {
		return true;
	}
	try {
		const result = element.matches(':popover-open');
		popoverSelectorWorks = true;
		return result;
	} catch {
		popoverSelectorWorks = false;
		return true;
	}
}
let modalSelectorWorks = null;
/**
 * Whether an open <dialog> is the modal kind. `showModal()` light-dismisses on
 * Escape; `show()` does not. Without `:modal` the two are indistinguishable, and
 * treating an open dialog as modal errs toward DECLINING Escape — losing one
 * dismissal beats dismissing the wrong layer.
 * @param {Element} dialog - An open dialog element.
 * @returns {boolean} Whether it consumes Escape itself.
 */
function isModalDialog(dialog) {
	if (modalSelectorWorks === false) {
		return true;
	}
	try {
		const result = dialog.matches(':modal');
		modalSelectorWorks = true;
		return result;
	} catch {
		modalSelectorWorks = false;
		return true;
	}
}
/**
 * Whether the UA dismisses this surface on Escape by itself.
 *
 * `popover="manual"` is the one that must NOT qualify, and getting this wrong is
 * not theoretical: a permanently-open `ui-notification` (popover=manual) sits in
 * the light DOM of every page here, and counting it outranked every registered
 * layer on the page — Escape stopped working entirely until this filter was
 * added. Manual popovers are the surfaces that REGISTER on this stack in the
 * first place (see syncEscapable); they are already ordered, not UA-owned.
 * @param {Element} surface - An open dialog or popover.
 * @returns {boolean} Whether the UA owns its Escape.
 */
function isUaDismissed(surface) {
	if (surface.tagName === 'DIALOG') {
		return surface.open === true && isModalDialog(surface);
	}
	/* `auto` and `hint` light-dismiss; `manual` does not. */
	if (surface.popover !== 'auto' && surface.popover !== 'hint') {
		return false;
	}
	return isPopoverOpen(surface);
}
/**
 * Containment across shadow boundaries. `Node.contains` walks parentNode only, so
 * it answers FALSE for a component inside a shadow root nested within the
 * surface — which is most of them here.
 * @param {Element} ancestor - Candidate container.
 * @param {object} node - Component or node to locate.
 * @returns {boolean} Whether `ancestor` contains `node`.
 */
function containsDeep(ancestor, node) {
	let current = node;
	while (current) {
		if (current === ancestor) {
			return true;
		}
		current = current.parentNode || current.host || null;
	}
	return false;
}
/**
 * Whether a UA-dismissed surface is open ABOVE `component`.
 * @param {object} component - The component asking about Escape.
 * @returns {boolean} Whether something the UA owns outranks it.
 */
function hasUaLayerAbove(component) {
	/*
	 * No DOM: the ordering tests drive plain objects deliberately (the module owns
	 * no listener, so there is nothing to simulate) and there is no top layer for
	 * anything to hide under.
	 */
	if (typeof document === 'undefined') {
		return false;
	}
	return searchUaLayer(document, component);
}
/**
 * Depth-first search for an open UA surface that does not contain `component`.
 *
 * THE WALK CROSSES SHADOW ROOTS, and that is the whole point: these surfaces live
 * inside components, not beside them. ui-gallery renders its `<dialog #lightbox>`
 * in its own template, so `document.querySelectorAll('dialog[open]')` answers
 * ZERO while that lightbox is open and modal — measured, not assumed. A
 * document-scoped query would have covered only the surfaces that happen to sit
 * in the light DOM, which is the minority of them.
 *
 * REJECTED: having every dialog/popover register itself here as a non-closing
 * occupant. It costs no walk, but it touches every such component and any one
 * that forgets silently restores this defect — the same per-component fragility
 * this module exists to remove. Escape is a human-timescale event and the search
 * stops at the first hit; correctness that cannot be forgotten is worth more.
 * @param {DocumentOrShadowRoot} root - Tree to search.
 * @param {object} component - The layer asking about Escape.
 * @returns {boolean} Whether an outranking surface was found.
 */
function searchUaLayer(root, component) {
	const elements = root.querySelectorAll('*');
	const count = elements.length;
	for (let index = 0; index < count; index += 1) {
		const element = elements[index];
		if (isUaDismissed(element) && !containsDeep(element, component)) {
			return true;
		}
		if (element.shadowRoot && searchUaLayer(element.shadowRoot, component)) {
			return true;
		}
	}
	return false;
}
/**
 * True when `component` is the most recently opened live layer — i.e. the one
 * ESC belongs to. A component that never registered is never top, so an
 * unguarded caller simply keeps whatever behaviour it had.
 *
 * Answers FALSE while a UA-managed surface is open above it, even when this
 * component is genuinely the top REGISTERED layer — the UA owns that Escape.
 * @param {object} component - The component asking whether ESC is its to handle.
 * @returns {boolean} Whether this component owns the next Escape.
 */
export function isTopEscapable(component) {
	pruneDead();
	if (stack.length === 0 || stack[stack.length - 1] !== component) {
		return false;
	}
	return !hasUaLayerAbove(component);
}
/**
 * Number of live open layers — for tests and debugging.
 * @returns {number} Current stack depth.
 */
export function escapableDepth() {
	pruneDead();
	return stack.length;
}
/**
 * Open/close bookkeeping for a surface whose visibility is driven by a single
 * reactive `open` flag — the shape every `popover="manual"` dropdown here has
 * (combobox, cascade-select, multi-select all observe `open` into a `syncOpen`
 * and additionally re-call it from `onRendered`).
 *
 * That re-call is why this exists rather than a bare `pushEscapable` at the
 * call site: a plain push on every render would keep moving an already-open
 * surface back to the top of the stack, so a child layer opened above it would
 * silently lose ownership of Escape on the parent's next paint. Holding the
 * release callback makes the push happen exactly once per open.
 *
 * Lives here, next to the stack it manipulates, instead of in its own module —
 * it is the same concern, and a second file would just be somewhere else to
 * look. Callers still ask `isTopEscapable` directly; there is deliberately no
 * wrapper for that, since an alias would be a parallel way to say the same
 * thing.
 * @param {object} component - The surface, carrying an `escapeRelease` field.
 * @param {boolean} isOpen - Whether the surface is now open.
 */
export function syncEscapable(component, isOpen) {
	if (isOpen) {
		component.escapeRelease ??= pushEscapable(component);
		return;
	}
	component.escapeRelease?.();
	component.escapeRelease = null;
}
