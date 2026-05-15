import {
	isError, isFunction, isObject, isPromiseLike, isString,
} from '../utilities.js';
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
	const result = handlerFunction.call(this, domEvent, element);
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
function detachSignalCleanup(entry) {
	const cleanup = entry.signalCleanup;
	entry.signalCleanup = null;
	if (isFunction(cleanup)) {
		cleanup();
	}
}
export function off(eventName, handlerFunction, options) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	const listeners = this.customEventListeners;
	if (!listeners?.size) {
		return this;
	}
	const trimmedEventName = eventName.trim();
	const matchCapture = options === undefined ? null : getCaptureFlag(options);
	const entries = Array.from(listeners);
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		if (entry.eventName !== trimmedEventName) {
			continue;
		}
		if (handlerFunction && entry.handler !== handlerFunction) {
			continue;
		}
		if (matchCapture !== null && getCaptureFlag(entry.options) !== matchCapture) {
			continue;
		}
		this.removeEventListener(entry.eventName, entry.wrapped, entry.options);
		detachSignalCleanup(entry);
		listeners.delete(entry);
	}
	return this;
}
export function on(eventName, handlerFunction, options) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isFunction(handlerFunction)) {
		throw new TypeError('handlerFunction must be a function');
	}
	if (!this.customEventListeners) {
		this.customEventListeners = new Set();
	}
	const trimmedEventName = eventName.trim();
	const component = this;
	const signal = isObject(options) ? options.signal : null;
	if (signal?.aborted) {
		return function unsubscribeNoop() {};
	}
	const fireOnce = isObject(options) && options.once === true;
	const entry = {
		eventName: trimmedEventName,
		handler: handlerFunction,
		options,
		wrapped: null,
		signalCleanup: null,
	};
	entry.wrapped = function wrappedHandler(domEvent) {
		if (fireOnce) {
			detachSignalCleanup(entry);
			component.customEventListeners?.delete(entry);
		}
		return runEventHandler.call(component, handlerFunction, domEvent, component, trimmedEventName);
	};
	component.customEventListeners.add(entry);
	component.addEventListener(trimmedEventName, entry.wrapped, options);
	if (signal) {
		const onAbort = () => {
			entry.signalCleanup = null;
			component.customEventListeners?.delete(entry);
		};
		signal.addEventListener('abort', onAbort, {
			once: true,
		});
		entry.signalCleanup = () => {
			signal.removeEventListener('abort', onAbort);
		};
	}
	return function unsubscribe() {
		return off.call(component, trimmedEventName, handlerFunction, entry.options);
	};
}
export function once(eventName, handlerFunction, options) {
	const merged = isObject(options) ? {
		...options,
		once: true,
	} : {
		once: true,
	};
	return on.call(this, eventName, handlerFunction, merged);
}
export function clearEventListeners() {
	const listeners = this.customEventListeners;
	if (!listeners?.size) {
		return;
	}
	listeners.forEach((entry) => {
		this.removeEventListener(entry.eventName, entry.wrapped, entry.options);
		detachSignalCleanup(entry);
	});
	listeners.clear();
}
