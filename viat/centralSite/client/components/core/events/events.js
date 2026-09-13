/*
 * Per-component event subscription — the per-element half of the event
 * surface (the document bus and scoped delegation live in `delegate.js`,
 * keyboard in `hotkeys.js`, environment-master arrives with Phase 7). This
 * file owns three public methods plus an escape hatch:
 *
 *   this.on(name, h, options?)        — listen on the component itself
 *   this.once(name, h, options?)      — same, but auto-detach on first fire
 *   this.addEvent(name,h,element?,opts?)   — listen on ANY element (defaults to this)
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
	isFunction, isObject, isPromiseLike, isString, sweepEntrySet, weakRefFor,
} from '../utilities.js';
import { EventEntry } from './eventEntry.js';
import { queueEventError, settleEventResult } from './settle.js';
const EMPTY_EMIT_OPTIONS = {};
// @engram em:network/code/events-e7-e8-shared-customevent-init-weakreffor-one-ref-per- — why sharing the init dict is safe and what must stay fresh
/*
 * Shared CustomEvent init, mutated per emit. Safe to reuse because the
 * CustomEvent constructor converts the dictionary synchronously and never
 * retains it — a nested emit from inside a handler only touches the init
 * AFTER the outer event captured its values. Only the `detail` wrapper (the
 * public { data, source } contract) is allocated fresh; it is nulled out
 * after construction so the shared init pins nothing between emits.
 */
const busEventInit = {
	bubbles: true,
	cancelable: false,
	composed: true,
	detail: null,
};
/**
 * Build a bus-shaped CustomEvent — the one constructor path behind `emit` and
 * `emitDelegate`. Defaults: bubbles + composed true, cancelable false.
 * @param {string} eventName - The event type.
 * @param {*} data - Payload placed on `detail.data`.
 * @param {*} source - Emitter placed on `detail.source`.
 * @param {object} [options] - `{ bubbles, cancelable, composed }` overrides.
 * @returns {CustomEvent} The constructed event.
 */
export function createBusEvent(eventName, data, source, options) {
	const resolved = isObject(options) ? options : EMPTY_EMIT_OPTIONS;
	busEventInit.bubbles = resolved.bubbles === undefined ? true : Boolean(resolved.bubbles);
	busEventInit.cancelable = Boolean(resolved.cancelable);
	busEventInit.composed = resolved.composed === undefined ? true : Boolean(resolved.composed);
	busEventInit.detail = {
		data,
		source,
	};
	const busEvent = new CustomEvent(eventName, busEventInit);
	busEventInit.detail = null;
	return busEvent;
}
export function emit(eventName, data = {}, options, source) {
	return this.dispatchEvent(createBusEvent(eventName, data, source || this, options));
}
/*
 * Default per-component async-error sink (prototype method — override to
 * route to telemetry / a UI fallback). Settle paths call it only when the
 * owner is alive; the shared queue rethrow is the owner-less fallback.
 */
export function handleEventError(error, domEvent, element, eventName) {
	queueEventError(error, domEvent, element, eventName);
}
export function runEventHandler(handlerFunction, domEvent, element, eventName = domEvent?.type) {
	if (!isFunction(handlerFunction)) {
		return undefined;
	}
	const result = handlerFunction.call(this, domEvent, element, eventName);
	if (isPromiseLike(result)) {
		settleEventResult(result, this, domEvent, element, eventName);
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
	const trimmedEventName = isString(resolvedEventName) ? resolvedEventName.trim() : '';
	if (!trimmedEventName) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(resolvedHandler)) {
		throw new TypeError('handler must be a function');
	}
	const component = this;
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
		componentRef: weakRefFor(this),
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
	const trimmedEventName = isString(eventName) ? eventName.trim() : '';
	if (!trimmedEventName) {
		throw new TypeError('eventName must be a non-empty string');
	}
	const entries = this.eventEntries;
	if (!entries?.size) {
		return this;
	}
	const component = this;
	const matchCapture = options === undefined ? null : getCaptureFlag(options);
	const snapshot = Array.from(entries);
	const snapshotLength = snapshot.length;
	for (let index = 0; index < snapshotLength; index++) {
		const entry = snapshot[index];
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
 * Lifecycle disconnect hook — tears down every `eventEntries` member. Each is
 * an `EventEntry` (Phase 2 unified the shape), so one `unsubscribe()` covers
 * detach + Set removal + abort-listener cleanup. Sweep mechanics (the
 * load-bearing snapshot) live in `sweepEntrySet`.
 */
export function clearEventListeners() {
	sweepEntrySet(this.eventEntries);
}
