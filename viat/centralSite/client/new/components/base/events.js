import {
	isElement, isError, isFunction, isPromiseLike, isString,
} from '../utilities.js';
export function addEvent(eventName, eventType, handlerFunction) {
	if (!isString(eventName) || !eventName.trim()) {
		throw new TypeError('eventName must be a non-empty string');
	}
	if (!isString(eventType) || !eventType.trim()) {
		throw new TypeError('eventType must be a non-empty string');
	}
	if (!isFunction(handlerFunction)) {
		throw new TypeError('handlerFunction must be a function');
	}
	const evtType = eventType.trim().toLowerCase();
	const evtName = eventName.trim();
	if (!this.eventHandlers) {
		this.eventHandlers = new Map();
	}
	let handlers = this.eventHandlers.get(evtType);
	if (!handlers) {
		handlers = new Map();
		this.eventHandlers.set(evtType, handlers);
	}
	handlers.set(evtName, handlerFunction);
	this.connectDelegatedEventType(evtType);
	this.syncDelegatedEvents();
	return this;
}
export function setEventName(element, eventName, eventType) {
	if (!isElement(element)) {
		return element;
	}
	const evtType = this.normalizeEventType(eventType);
	const evtName = this.normalizeEventName(eventName, evtType);
	if (!evtName) {
		return element;
	}
	if (!this.elementEventNames) {
		this.elementEventNames = new WeakMap();
	}
	const map = this.elementEventNames.get(element) ?? new Map();
	map.set(evtType, evtName);
	this.elementEventNames.set(element, map);
	return element;
}
export function emit(eventName, detail) {
	const init = {
		bubbles: true,
		composed: true,
	};
	if (detail !== undefined) {
		init.detail = detail;
	}
	console.log(`Emitting event: ${eventName}`, detail);
	this.dispatchEvent(new CustomEvent(eventName, init));
}
export function normalizeEventType(eventType) {
	return isString(eventType) ? eventType.trim().toLowerCase() : '';
}
export function normalizeEventName(eventName, eventType) {
	if (!isString(eventName)) {
		return `on${eventType}`;
	}
	const evtName = eventName.trim();
	return evtName || `on${eventType}`;
}
export function getEventAttributeName(eventType) {
	return `data-on${eventType}`;
}
export function connectDelegatedEvents() {
	if (!this.eventHandlers) {
		return;
	}
	const root = this.getComponentRoot();
	if (this.eventRoot !== root) {
		this.disconnectDelegatedEvents();
		this.eventRoot = root;
	}
	for (const eventType of this.eventHandlers.keys()) {
		this.connectDelegatedEventType(eventType);
	}
}
export function connectDelegatedEventType(eventType) {
	if (!this.isConnected) {
		return;
	}
	const evtType = this.normalizeEventType(eventType);
	if (!evtType) {
		return;
	}
	if (this.eventRoot !== this.getComponentRoot()) {
		this.connectDelegatedEvents();
	}
	if (!this.activeEventTypes) {
		this.activeEventTypes = new Set();
	}
	if (this.activeEventTypes.has(evtType)) {
		return;
	}
	this.eventRoot?.addEventListener(evtType, this);
	this.activeEventTypes.add(evtType);
}
export function disconnectDelegatedEvents() {
	if (this.activeEventTypes) {
		for (const eventType of this.activeEventTypes) {
			this.eventRoot?.removeEventListener(eventType, this);
		}
		this.activeEventTypes.clear();
	}
	this.eventRoot = null;
}
export function syncDelegatedEvents() {
	if (!this.eventHandlers) {
		return;
	}
	const root = this.getComponentRoot();
	if (!root?.querySelectorAll) {
		return;
	}
	for (const eventType of this.eventHandlers.keys()) {
		const attr = this.getEventAttributeName(eventType);
		for (const el of root.querySelectorAll(`[${attr}]`)) {
			this.setEventName(el, this.normalizeEventName(el.getAttribute(attr), eventType), eventType);
		}
	}
}
export function getElementEventName(element, eventType) {
	const evtType = this.normalizeEventType(eventType);
	if (!evtType || !isElement(element)) {
		return '';
	}
	const map = this.elementEventNames?.get(element);
	if (map?.has(evtType)) {
		return map.get(evtType);
	}
	const attr = this.getEventAttributeName(evtType);
	if (!element.hasAttribute(attr)) {
		return '';
	}
	const evtName = this.normalizeEventName(element.getAttribute(attr), evtType);
	this.setEventName(element, evtName, evtType);
	return evtName;
}
export function getMatchedEventTarget(domEvent) {
	const root = this.getComponentRoot();
	const path = isFunction(domEvent.composedPath) ? domEvent.composedPath() : [domEvent.target];
	for (const node of path) {
		if (node === root || node === this) {
			break;
		}
		if (!isElement(node)) {
			continue;
		}
		const evtName = this.getElementEventName(node, domEvent.type);
		if (evtName) {
			return {
				element: node,
				eventName: evtName,
			};
		}
	}
	const fallback = isElement(domEvent.target) ? domEvent.target : null;
	if (!fallback) {
		return null;
	}
	const fallbackName = this.getElementEventName(fallback, domEvent.type);
	return fallbackName ? {
		element: fallback,
		eventName: fallbackName,
	} : null;
}
export function handleEvent(domEvent) {
	this.handleBubbledEvent(domEvent);
}
export function handleDelegatedEventError(error, domEvent, element, eventName) {
	queueMicrotask(() => {
		throw Object.assign(isError(error) ? error : new Error(String(error)), {
			element,
			event: domEvent,
			eventName,
		});
	});
}
export function handleBubbledEvent(domEvent) {
	if (!this.eventHandlers) {
		return;
	}
	const handlers = this.eventHandlers.get(this.normalizeEventType(domEvent.type));
	if (!handlers?.size) {
		return;
	}
	const match = this.getMatchedEventTarget(domEvent);
	if (!match) {
		return;
	}
	const handler = handlers.get(match.eventName);
	if (!handler) {
		return;
	}
	try {
		const result = handler.call(this, domEvent, match.element, match.eventName);
		if (isPromiseLike(result)) {
			result.catch((error) => {
				return this.handleDelegatedEventError(error, domEvent, match.element, match.eventName);
			});
		}
	} catch (error) {
		this.handleDelegatedEventError(error, domEvent, match.element, match.eventName);
	}
}
