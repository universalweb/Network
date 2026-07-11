/*
 * Enter / leave animation helpers — they internalize the reactive-flag + class +
 * `animationend` idiom that components (notification, boot-screen, badge) currently
 * hand-roll, into shared prototype methods. AUTHOR-INVOKED ONLY: the framework never
 * auto-calls them, so a component that doesn't animate pays nothing — no stub call on
 * mount/disconnect, no op eaten. They live on the prototype (shared, like `delegate`),
 * not as per-instance fields.
 *
 * A detached node does not render, and `disconnectedCallback` fires AFTER the element
 * leaves the DOM (Custom Elements spec) — so a VISIBLE leave animation must play while
 * the element is still connected, BEFORE removal. `leave()` sequences that correctly
 * (`animateOut()` then `remove()`); `onDisconnect` is for async cleanup, not a visible
 * exit. For terminal teardown, compose `await this.animateOut(); this.destroy()`.
 *
 * Settling uses `Element.getAnimations()` (Web Animations) rather than manual
 * `animationend` plumbing: it returns the element's running CSS animations AND
 * transitions, each exposing a `.finished` promise. No animation → empty list →
 * resolves immediately (never hangs); an interrupted/cancelled animation rejects,
 * which `allSettled` absorbs (so a re-trigger never strands the await). Exit
 * animations must be FINITE — an infinite one never finishes.
 *
 * Default target is the HOST (`:host(.is-exiting)`), whose class the template never
 * manages, so an imperative add is safe from patch clobbering. Target an inner ref
 * only if that element's class is NOT also reactively bound in the template.
 */
function animationFinished(animation) {
	return animation.finished;
}
/**
 * Read a layout property to flush pending style changes — this REGISTERS a
 * class-triggered CSS transition synchronously (a `@keyframes` animation is already
 * present), so the subsequent `getAnimations()` sees it. Without the flush a just-
 * triggered transition is invisible and the animation would be skipped entirely.
 * @param {Element} element - The element to flush.
 * @returns {number} The element's offset width (read for its flush side effect).
 */
function forceReflow(element) {
	return element.offsetWidth;
}
/**
 * Resolve once every CSS animation/transition running on `element` has finished (or
 * been cancelled). Resolves immediately when none run, so an `await` never hangs on a
 * non-animating element. The reflow flush makes both `@keyframes` and just-triggered
 * transitions visible deterministically (no frame-timing dependency).
 * @param {Element} element - The element whose animations to await.
 * @returns {Promise<void>}
 */
async function settleAnimations(element) {
	forceReflow(element);
	const animations = element.getAnimations();
	if (!animations.length) {
		return;
	}
	await Promise.allSettled(animations.map(animationFinished));
}
/**
 * Play an ENTER animation: add `className` (default `is-entering`) to the target
 * (default the host), await the animation/transition, then strip the class.
 * @param {{target?: Element, className?: string}} [options] - `target` element to animate (default host), `className` toggled to drive the CSS.
 * @returns {Promise<void>}
 */
export async function animateIn(options) {
	const target = options?.target ?? this;
	const className = options?.className ?? 'is-entering';
	/* Commit the current computed style as the transition's "from" before the class
	 * change, so a transition fires deterministically regardless of paint timing
	 * (a @keyframes animation is unaffected by this). */
	forceReflow(target);
	target.classList.add(className);
	await settleAnimations(target);
	target.classList.remove(className);
}
/**
 * Play a LEAVE animation: add `className` (default `is-exiting`) to the target
 * (default the host) and await it. The class is LEFT in place (the element is on its
 * way out); the caller removes/destroys the element next — see `leave()`.
 * @param {{target?: Element, className?: string}} [options] - `target` element to animate (default host), `className` toggled to drive the CSS.
 * @returns {Promise<void>}
 */
export async function animateOut(options) {
	const target = options?.target ?? this;
	const className = options?.className ?? 'is-exiting';
	/* Commit the current computed style as the transition's "from" before the class
	 * change, so a fade/transition leave fires deterministically regardless of paint
	 * timing (a @keyframes leave is unaffected). */
	forceReflow(target);
	target.classList.add(className);
	await settleAnimations(target);
}
/**
 * Animate the host out, THEN remove it from the DOM — the correct order for a visible
 * exit (a detached node can't animate). Drop-in for `this.remove()` when an exit
 * animation is wanted. For a list child, the parent still drops it from its data on
 * the resolution.
 * @param {{target?: Element, className?: string}} [options] - `target` element to animate (default host), `className` toggled to drive the CSS.
 * @returns {Promise<void>}
 */
export async function leave(options) {
	await this.animateOut(options);
	this.remove();
}
/* ── FLIP morph — cult-ui "expand outward" surfaces ──────────────────────────
   A surface that grows OUT of a trigger and shrinks back into it. Pure viewport
   math (`getBoundingClientRect` + a WAAPI transform), so it is indifferent to
   shadow/portal boundaries — the trigger can live in a shadow root and the surface
   in a body-side portal; both measure in the same viewport space. It is
   interruptible (reverse/cancel the returned handle) and concurrent-safe (per
   element, unlike a document-global View Transition). The container morphs while a
   separate content layer fades/staggers in over it (cult-ui's decomposition), so
   the mid-flight scale distortion is masked. Reduced-motion collapses the geometry
   to an opacity-only fade. */
/**
 * True when the user asked for reduced motion. Read live (not cached) so a
 * preference change between opens is honoured.
 * @returns {boolean} True when `(prefers-reduced-motion: reduce)` matches.
 */
function prefersReducedMotion() {
	return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
/**
 * The inverse transform that maps a surface's final box back onto a trigger box:
 * translate the surface's top-left corner onto the trigger's, then scale it down to
 * the trigger's size. Played to identity, the surface expands trigger → final.
 * @param {DOMRect} fromRect - The trigger's box (FLIP "first").
 * @param {DOMRect} toRect - The surface's natural box (FLIP "last").
 * @returns {string} A CSS transform value (assumes a `top left` transform origin).
 */
function invertToTrigger(fromRect, toRect) {
	const scaleX = toRect.width ? fromRect.width / toRect.width : 1;
	const scaleY = toRect.height ? fromRect.height / toRect.height : 1;
	const shiftX = fromRect.left - toRect.left;
	const shiftY = fromRect.top - toRect.top;
	return `translate(${shiftX}px, ${shiftY}px) scale(${scaleX}, ${scaleY})`;
}
/**
 * Morph `surface` between its natural rendered box and a collapsed box anchored on
 * `fromRect` (a trigger's `getBoundingClientRect()`). The surface MUST already sit at
 * its final position/size and be visible — it is measured here as the FLIP "last".
 * Forward (default) grows it out of the trigger; `reverse: true` shrinks it back in.
 * Returns the WAAPI Animation: `await .finished`, keep the handle to drive an
 * interruptible open↔close, or `.cancel()` to drop the filled effect and restore the
 * natural box for a fresh re-measure. Reduced-motion → a short opacity-only fade.
 * @param {Element} surface - The element to morph (already at its final box).
 * @param {DOMRect} fromRect - The trigger box to grow from / shrink into.
 * @param {{reverse?: boolean, duration?: number, easing?: string, radiusFrom?: string, radiusTo?: string}} [options] - Morph tuning: `reverse` flips direction (close), `duration` in ms, `easing` curve, and an optional `radiusFrom`/`radiusTo` border-radius morph.
 * @returns {Animation} The running WAAPI animation handle (`.finished`, `.cancel()`, `.reverse()`).
 */
export function flipMorph(surface, fromRect, options = {}) {
	const reverse = options.reverse === true;
	const reduced = prefersReducedMotion();
	const toRect = surface.getBoundingClientRect();
	let collapsed;
	let expanded;
	if (reduced) {
		collapsed = {
			opacity: 0,
		};
		expanded = {
			opacity: 1,
		};
	} else {
		surface.style.transformOrigin = 'top left';
		collapsed = {
			transform: invertToTrigger(fromRect, toRect),
			opacity: 0,
		};
		expanded = {
			transform: 'none',
			opacity: 1,
		};
		if (options.radiusFrom != null && options.radiusTo != null) {
			collapsed.borderRadius = options.radiusFrom;
			expanded.borderRadius = options.radiusTo;
		}
	}
	return surface.animate(reverse ? [
		expanded,
		collapsed,
	] : [
		collapsed,
		expanded,
	], {
		duration: reduced ? 120 : (options.duration ?? 380),
		easing: options.easing ?? 'cubic-bezier(0.34, 1.3, 0.64, 1)',
		fill: 'both',
	});
}
