/*
 * Per-component event subscription — the per-element half of the event
 * surface (the document bus and scoped delegation live in `delegate.js`,
 * keyboard in `hotkeys.js`, environment-master arrives with Phase 7). This
 * file owns three public methods plus an escape hatch:
 *
 *   this.on(name, h, options?)        — listen on the component itself
 *   this.once(name, h, options?)      — same, but auto-detach on first fire
 *   this.addEvent(name,h,el?,opts?)   — listen on ANY element (defaults to this)
 *   this.listener(handler)            — cached EventListener-object for raw
 *                                       addEventListener wiring when you do
 *                                       NOT want auto-tracking
 *
 * All four routes land in `component.eventEntries: Set<EventEntry>`. The
 * lifecycle disconnect sweep iterates the set, calling `entry.unsubscribe()`
 * on each. Every entry IS the EventListener (DOM spec — any object with a
 * `handleEvent` method qualifies), so the browser calls
 * `entry.handleEvent(domEvent)` directly with `this = entry`. The handler
 * itself runs via `handler.call(component, domEvent, element, name)` inside
 * `EventEntry.handleEvent` — proper `this`-binding with no arrow fields and
 * no `.bind`. `componentRef` and `elementRef` are WeakRefs so a held entry
 * never pins either; stale derefs short-circuit dispatch.
 *
 * `on()` is a thin wrapper over `addEvent(name, h, this, options)`. `off()`
 * matches name + handler + capture (and constrains the entry's element to
 * the component itself, so off() can never reach beyond the `on()` contract)
 * and routes through `entry.unsubscribe()`.
 */
import {
	isError, isFunction, isObject, isPromiseLike, isString,
} from '../utilities.js';
import { EventEntry } from './eventEntry.js';
export function emit(eventName, data = {}, options, source) {
	const {
		bubbles = true,
		cancelable = false,
		composed = true,
	} = isObject(options) ? options : {};
	const init = {
		bubbles,
		cancelable,
		composed,
		detail: {
			data,
			source: source || this,
		},
	};
	return this.dispatchEvent(new CustomEvent(eventName, init));
}
export function handleEventError(error, domEvent, element, eventName) {
	queueMicrotask(() => {
		throw Object.assign(isError(error) ? error : new Error(String(error)), {
			element,
			event: domEvent,
			eventName,
		});
	});
}
export function runEventHandler(handlerFunction, domEvent, element, eventName = domEvent?.type) {
	if (!isFunction(handlerFunction)) {
		return undefined;
	}
	const result = handlerFunction.call(this, domEvent, element, eventName);
	if (isPromiseLike(result)) {
		result.catch((error) => {
			return this.handleEventError(error, domEvent, element, eventName);
		});
	}
	return result;
}
function getCaptureFlag(options) {
	if (options === true) {
		return true;
	}
	if (isObject(options)) {
		return options.capture === true;
	}
	return false;
}
/**
 * Shared dispatcher for `this.listener(handler)` — the cached EventListener
 * object. The wrapper IS the listener (its `handleEvent` is this function), so
 * the browser calls `wrapper.handleEvent(domEvent)` with `this = wrapper`.
 * Routes through the component's `runEventHandler` so async errors land in the
 * standard `handleEventError` path.
 * @this {{componentRef: WeakRef, handler: Function}}
 * @param {Event} domEvent - The dispatched DOM event.
 * @returns {*} The handler's result, or undefined when the component is gone.
 */
function dispatchCachedListener(domEvent) {
	const wrapper = this;
	const component = wrapper.componentRef.deref();
	if (!component) {
		return undefined;
	}
	return component.runEventHandler(wrapper.handler, domEvent, domEvent.currentTarget, domEvent.type);
}
/**
 * The unified event primitive. Element defaults to the component itself.
 * Returns an `EventEntry` with `.unsubscribe()`, auto-tracked in
 * `component.eventEntries` and swept on disconnect via `clearEventListeners`.
 * Accepts positional or single-object-bag invocation.
 * @param {string|object} eventName - Event name, or a `{ eventName, handler, element, options }` bag.
 * @param {Function} [handler] - The event handler (positional form).
 * @param {EventTarget} [element] - Target element (defaults to the component).
 * @param {AddEventListenerOptions} [options] - Native listener options.
 * @returns {EventEntry} The subscription entry.
 */
export function addEvent(eventName, handler, element, options) {
	let resolvedEventName = eventName;
	let resolvedHandler = handler;
	let resolvedElement = element;
	let resolvedOptions = options;
	if (isObject(eventName)) {
		resolvedEventName = eventName.eventName;
		resolvedHandler = eventName.handler;
		resolvedElement = eventName.element;
		resolvedOptions = eventName.options;
	}
	if (!isString(resolvedEventName) || !resolvedEventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(resolvedHandler)) {
		throw new TypeError('handler must be a function');
	}
	const component = this;
	const trimmedEventName = resolvedEventName.trim();
	const target = resolvedElement || component;
	const entry = EventEntry.create(component, trimmedEventName, resolvedHandler, target, resolvedOptions);
	entry.subscribe();
	return entry;
}
/**
 * Escape hatch for raw `addEventListener` wiring on an element you do NOT want
 * auto-tracked. Returns a cached EventListener object (one per
 * `(component, handler)` pair) the browser invokes via its `handleEvent`. A
 * WeakRef on the component means a forgotten registration can't pin it alive.
 * @param {Function} handlerFunction - The handler to wrap.
 * @returns {{handleEvent: Function}} The cached EventListener object.
 */
export function listener(handlerFunction) {
	if (!isFunction(handlerFunction)) {
		throw new TypeError('handlerFunction must be a function');
	}
	if (!this.listenerCache) {
		this.listenerCache = new WeakMap();
	}
	const cached = this.listenerCache.get(handlerFunction);
	if (cached) {
		return cached;
	}
	const wrapper = {
		componentRef: new WeakRef(this),
		handler: handlerFunction,
		handleEvent: dispatchCachedListener,
	};
	this.listenerCache.set(handlerFunction, wrapper);
	return wrapper;
}
/**
 * Thin wrapper over `addEvent` that pins the element to the component itself.
 * Returns the same `EventEntry` addEvent returns, so callers can hold it and
 * call `entry.unsubscribe()`. Validation lives in `addEvent`.
 * @param {string} eventName - The event name.
 * @param {Function} handlerFunction - The event handler.
 * @param {AddEventListenerOptions} [options] - Native listener options.
 * @returns {EventEntry} The subscription entry.
 */
export function on(eventName, handlerFunction, options) {
	return this.addEvent(eventName, handlerFunction, this, options);
}
/**
 * Like `on`, but merges `once: true` into options so the listener fires a
 * single time (`EventEntry.handleEvent` honors `fireOnce`).
 * @param {string} eventName - The event name.
 * @param {Function} handlerFunction - The event handler.
 * @param {AddEventListenerOptions} [options] - Native listener options.
 * @returns {EventEntry} The subscription entry.
 */
export function once(eventName, handlerFunction, options) {
	const merged = isObject(options) ? {
		...options,
		once: true,
	} : {
		once: true,
	};
	return this.on(eventName, handlerFunction, merged);
}
/**
 * Criteria-match `eventEntries` and unsubscribe each match. Constrained to
 * entries whose element IS the component, so `off()` cannot reach beyond the
 * `on()` contract — entries from `addEvent(..., someOtherElement)` are removed
 * by holding the entry and calling `entry.unsubscribe()` directly.
 * @param {string} eventName - The event name to match.
 * @param {Function} [handlerFunction] - Narrow to this handler.
 * @param {object} [options] - Narrow by capture flag.
 * @returns {WebComponent} The component, for chaining.
 */
export function off(eventName, handlerFunction, options) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	const entries = this.eventEntries;
	if (!entries?.size) {
		return this;
	}
	const component = this;
	const trimmedEventName = eventName.trim();
	const matchCapture = options === undefined ? null : getCaptureFlag(options);
	const snapshot = Array.from(entries);
	for (let i = 0; i < snapshot.length; i++) {
		const entry = snapshot[i];
		if (entry.eventName !== trimmedEventName) {
			continue;
		}
		if (entry.elementRef?.deref() !== component) {
			continue;
		}
		if (handlerFunction && entry.handler !== handlerFunction) {
			continue;
		}
		if (matchCapture !== null && getCaptureFlag(entry.options) !== matchCapture) {
			continue;
		}
		entry.unsubscribe();
	}
	return this;
}
/**
 * Lifecycle disconnect hook — walks the component's `eventEntries` and
 * unsubscribes each. Every entry is an `EventEntry` instance (Phase 2 unified
 * the shape), so `entry.unsubscribe()` covers detach + Set removal + abort-
 * listener cleanup in one call. Snapshot first because `unsubscribe()`
 * mutates `eventEntries` during the walk; `entries.clear()` at the end is
 * defensive — by then the Set is already empty.
 */
export function clearEventListeners() {
	const entries = this.eventEntries;
	if (!entries?.size) {
		return;
	}
	const snapshot = Array.from(entries);
	for (let i = 0; i < snapshot.length; i++) {
		snapshot[i].unsubscribe();
	}
	entries.clear();
}
