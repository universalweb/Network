/*
 * A component timeout is a reusable, reschedulable HANDLE, not a raw id. The
 * fired callback receives the component as its first argument, so a handler is a
 * first-class method reference — `this.setTimeout(this.onSettle, ms)` — with no
 * per-call forwarding closure at the call site. Pre-declare one with
 * `this.createTimeout(cb, ms)` (disarmed) and arm/clear/re-arm it in place, or
 * `this.setTimeout(cb, ms)` to create-and-arm on the fly.
 *
 * Untrack-on-fire (delete the fired id from `this.timeouts`) is a correctness
 * guard: browsers recycle timeout ids after a timer completes, so a fired id left
 * in the Set could make a later `clearTimeouts` cancel an unrelated timer that
 * reused the number. `invoke` untracks BEFORE running the callback, which also
 * makes a re-arm from INSIDE the callback safe — it stamps a fresh id on an
 * already-clean handle, no reentrancy hazard. Never native-forward
 * `setTimeout(cb, ms, this)`: it drops the untrack.
 *
 * A gc-normalized micro-bench put the class carrier ~19% ahead of a per-call
 * capturing arrow (which paid a JSFunction plus a context cell for the id).
 * Reusing one pre-declared handle across arm/clear/re-arm drops even that
 * per-arm allocation.
 */
// @engram em:network/concept/uwc-timer-arg-forwarding-settimeout-fn-ms-this-dual-use-meth
class ComponentTimeout {
	static create(component, callback, delayMs) {
		return new ComponentTimeout(component, callback, delayMs);
	}
	static is(value) {
		return value instanceof ComponentTimeout;
	}
	constructor(component, callback, delayMs) {
		this.component = component;
		this.callback = callback;
		this.delayMs = delayMs;
		this.id = 0;
	}
	/*
	 * Arm or reschedule. With no args, re-arms with the stored callback / delay.
	 * An already-armed handle is cleared first (clear() no-ops when disarmed), so a
	 * re-arm never leaves the prior timeout live. Returns the handle for chaining.
	 */
	run(callback, delayMs) {
		if (callback) {
			this.callback = callback;
		}
		if (delayMs !== undefined) {
			this.delayMs = delayMs;
		}
		this.clear();
		this.id = setTimeout(this.invoke, this.delayMs, this);
		(this.component.timeouts ??= new Set()).add(this.id);
		return this;
	}
	/*
	 * setTimeout invokes this unbound (deferred host callback → no `this`), so it
	 * reads the handle from its forwarded arg. Untracks before firing; the callback
	 * gets the component (arg 1) and this handle (arg 2, for self-reschedule).
	 */
	invoke(timer) {
		// Armed ⇒ timeouts Set exists (run() always creates it).
		timer.component.timeouts.delete(timer.id);
		timer.id = 0;
		timer.callback(timer.component, timer);
	}
	/*
	 * Cancel + untrack. No-op when disarmed, so it is always safe to call.
	 */
	clear() {
		if (this.id) {
			clearTimeout(this.id);
			// Armed ⇒ timeouts Set exists (run() always creates it).
			this.component.timeouts.delete(this.id);
			this.id = 0;
		}
	}
}
/*
 * Disarmed handle — pre-declare a reusable timer (e.g. in a constructor) and arm
 * it on demand with `.run()`. Nothing is scheduled until the first `run`.
 */
export function createComponentTimeout(callback, delayMs) {
	return ComponentTimeout.create(this, callback, delayMs);
}
/*
 * Create AND arm in one call — the fire-and-forget / on-the-fly path. Returns the
 * handle; ignore it to discard after firing, or keep it to `.clear()` / `.run()`.
 */
export function setComponentTimeout(callback, delayMs) {
	return ComponentTimeout.create(this, callback, delayMs).run();
}
/*
 * Cancel a timeout. Accepts a `ComponentTimeout` handle (calls `.clear()`) or a
 * raw timeout id (legacy) — polymorphic so pre-handle call sites keep working.
 */
export function removeComponentTimeout(timeout) {
	if (ComponentTimeout.is(timeout)) {
		timeout.clear();
		return;
	}
	clearTimeout(timeout);
	this.timeouts?.delete(timeout);
}
export function clearTimeouts() {
	if (!this.timeouts) {
		return;
	}
	this.timeouts.forEach(clearTimeout);
	this.timeouts.clear();
}
/*
 * Native `setInterval` arg-forwarding hands the component to the callback on every
 * tick — `this.addInterval(this.onTick, ms)` — with no wrapper closure at all.
 * Unlike a timeout, an interval never fires-and-completes (it is cleared
 * explicitly via `stopInterval` / `clearIntervals`), so there is no fired id to
 * untrack and the id-reuse guard `setComponentTimeout` needs does not apply.
 */
export function addInterval(callback, delayMs) {
	const intervalId = setInterval(callback, delayMs, this);
	(this.intervals ??= new Set()).add(intervalId);
	return intervalId;
}
export function stopInterval(intervalId) {
	clearInterval(intervalId);
	this.intervals?.delete(intervalId);
}
export function clearIntervals() {
	if (!this.intervals) {
		return;
	}
	this.intervals.forEach(clearInterval);
	this.intervals.clear();
}
