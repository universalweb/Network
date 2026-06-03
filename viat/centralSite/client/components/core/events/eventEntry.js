/*
 * EventEntry — the unified subscription object for `this.addEvent(...)` and,
 * after Phase 2, for `this.on/.off` as well. The entry IS the EventListener
 * (DOM spec — any object with a `handleEvent` method qualifies), so the browser
 * invokes `entry.handleEvent(domEvent)` with `this = entry`. No per-registration
 * wrapper closure, no `.bind`, no arrow field. Handler `this` is bound via
 * `handler.call(component, …)` inside `handleEvent`.
 *
 * The same entry doubles as the abort-signal listener — `domEvent.type === 'abort'`
 * is the in-method branch for that role. One object, two callsite roles.
 *
 * `componentRef` and `elementRef` are WeakRefs so the entry never pins either —
 * stale derefs short-circuit the dispatch and self-detach.
 */
import {
	isError, isFunction, isObject, isPromiseLike,
} from '../utilities.js';
function queueEntryError(error, domEvent, component, eventName) {
	queueMicrotask(() => {
		throw Object.assign(isError(error) ? error : new Error(String(error)), {
			element: component,
			event: domEvent,
			eventName,
		});
	});
}
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
		entry.componentRef = new WeakRef(component);
		entry.elementRef = new WeakRef(element || component);
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
		if (domEvent.type === 'abort') {
			/*
			 * Signal aborted. The browser already detached this entry from the
			 * element's listener list (that is how `{ signal }` works on
			 * addEventListener). Clear our bookkeeping; the abort registration
			 * was `{ once: true }` so it self-detaches.
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
			result.catch((error) => {
				queueEntryError(error, domEvent, component, this.eventName);
			});
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
			 * `handleEvent`, branched by `domEvent.type === 'abort'`.
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
