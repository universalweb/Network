/*
 * EventEntry — the unified subscription object for `this.addEvent(...)` and,
 * after Phase 2, for `this.on/.off` as well. The entry IS the EventListener
 * (DOM spec — any object with a `handleEvent` method qualifies), so the browser
 * invokes `entry.handleEvent(domEvent)` with `this = entry`. No per-registration
 * wrapper closure, no `.bind`, no arrow field. Handler `this` is bound via
 * `handler.call(component, …)` inside `handleEvent`.
 *
 * The same entry doubles as the abort-signal listener — a dispatch whose target
 * IS the signal is the in-method branch for that role. One object, two callsite
 * roles, separated by target because `abort` is also a real DOM event name.
 *
 * `componentRef` and `elementRef` are WeakRefs so the entry never pins either —
 * stale derefs short-circuit the dispatch and self-detach.
 */
import {
	isFunction, isObject, isPromiseLike, weakRefFor,
} from '../utilities.js';
import { settleEventResult } from './settle.js';
export class EventEntry {
	componentRef = null;
	elementRef = null;
	eventName = '';
	handler = null;
	options = null;
	subscribed = false;
	signal = null;
	fireOnce = false;
	static create(component, eventName, handler, element, options) {
		const entry = new EventEntry();
		/*
		 * weakRefFor dedupes — on the dominant on() route element IS the
		 * component, so both fields hold the one cached WeakRef.
		 */
		entry.componentRef = weakRefFor(component);
		entry.elementRef = weakRefFor(element || component);
		entry.eventName = eventName;
		entry.handler = handler;
		entry.options = options || null;
		entry.fireOnce = isObject(options) && options.once === true;
		entry.signal = isObject(options) ? (options.signal || null) : null;
		return entry;
	}
	/**
	 * EventListener-object hook. The browser calls this with `this = entry` for
	 * the real event AND for the `'abort'` event when an AbortSignal was passed
	 * (the entry is registered against the signal too). One method, two roles,
	 * branched by `domEvent.type`.
	 * @param {Event} domEvent - The dispatched event (or an `'abort'` event).
	 * @returns {*} The handler's result, or undefined for abort / no-op paths.
	 */
	handleEvent(domEvent) {
		const component = this.componentRef.deref();
		// @engram em:network/code/evententry-dual-role-branch-must-key-on-the-dispatch-target- — why the role branch keys on target, not on type === 'abort'
		if (this.signal !== null && domEvent.target === this.signal) {
			/*
			 * Signal aborted. The browser already detached this entry from the
			 * element's listener list (that is how `{ signal }` works on
			 * addEventListener). Clear our bookkeeping; the abort registration
			 * was `{ once: true }` so it self-detaches.
			 *
			 * Keyed on the TARGET, never on `type === 'abort'`: `abort` is a real
			 * DOM event (img / video / XHR fire it), so a type check swallowed
			 * genuine `on('abort')` subscribers. Only the signal role dispatches
			 * with the signal as target, so this separates the two roles even when
			 * one entry serves an 'abort' subscription that also carries a signal.
			 */
			if (component) {
				component.eventEntries?.delete(this);
			}
			this.subscribed = false;
			this.signal = null;
			return undefined;
		}
		if (!component) {
			/*
			 * Component was GC'd but the entry is still firing because the
			 * lifecycle sweep never ran (detached subtree, perhaps). Self-detach.
			 */
			this.unsubscribe();
			return undefined;
		}
		if (this.fireOnce) {
			this.unsubscribe();
		}
		if (!isFunction(this.handler)) {
			return undefined;
		}
		const element = this.elementRef.deref() || domEvent.currentTarget;
		const result = this.handler.call(component, domEvent, element, this.eventName);
		if (isPromiseLike(result)) {
			settleEventResult(result, component, domEvent, element, this.eventName);
		}
		return result;
	}
	/**
	 * Attach to the element + register in `component.eventEntries`. Idempotent —
	 * re-subscribing a live entry is a no-op. If the entry was created from a
	 * signal that is already aborted, `subscribe()` short-circuits.
	 * @returns {EventEntry} This entry, for chaining.
	 */
	subscribe() {
		if (this.subscribed) {
			return this;
		}
		if (this.signal?.aborted) {
			return this;
		}
		const component = this.componentRef.deref();
		const element = this.elementRef.deref();
		if (!component || !element) {
			return this;
		}
		element.addEventListener(this.eventName, this, this.options || undefined);
		(component.eventEntries ??= new Set()).add(this);
		this.subscribed = true;
		if (this.signal) {
			/*
			 * Entry doubles as the abort listener — same object, same
			 * `handleEvent`, branched by whether the dispatch target is the signal.
			 */
			this.signal.addEventListener('abort', this, {
				once: true,
			});
		}
		return this;
	}
	/**
	 * Detach from the element + unregister from `eventEntries`. Idempotent. Also
	 * detaches the abort listener if one was registered.
	 * @returns {EventEntry} This entry, for chaining.
	 */
	unsubscribe() {
		if (!this.subscribed) {
			this.detachSignal();
			return this;
		}
		const component = this.componentRef.deref();
		const element = this.elementRef.deref();
		if (element) {
			element.removeEventListener(this.eventName, this, this.options || undefined);
		}
		if (component) {
			component.eventEntries?.delete(this);
		}
		this.detachSignal();
		this.subscribed = false;
		return this;
	}
	detachSignal() {
		if (!this.signal) {
			return;
		}
		this.signal.removeEventListener('abort', this);
		this.signal = null;
	}
}
