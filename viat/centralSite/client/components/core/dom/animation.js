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
