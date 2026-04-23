import {
	isError, isFunction, isPromiseLike, isString,
} from './utilities.js';
export function emit(eventName, data = {}) {
	const init = {
		bubbles: true,
		composed: true,
		currentTarget: this,
		detail: {
			data,
			source: this,
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
	try {
		const result = handlerFunction.call(this, domEvent, element);
		if (isPromiseLike(result)) {
			result.catch((error) => {
				return this.handleEventError(error, domEvent, element, eventName);
			});
		}
		return result;
	} catch (error) {
		this.handleEventError(error, domEvent, element, eventName);
		return undefined;
	}
}
export function createEventHandler(handlerFunction, ...args) {
	if (!isFunction(handlerFunction)) {
		throw new TypeError('handlerFunction must be a function');
	}
	const component = this;
	return function eventHandler(domEvent, element) {
		return handlerFunction.call(component, domEvent, element, ...args);
	};
}
export function createEmitHandler(eventName, detailSource) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	const trimmedEventName = eventName.trim();
	const component = this;
	return function emitHandler(domEvent, element) {
		const detail = isFunction(detailSource) ? detailSource.call(component, domEvent, element) : detailSource;
		detail.element = element;
		return component.emit(trimmedEventName, detail);
	};
}
