import { isElement, isFunction, isPromiseLike, isString } from '../utilities.js';
export const eventsMixin = (Base) => class extends Base {
	eventHandlers = new Map();
	elementEventNames = new WeakMap();
	activeEventTypes = new Set();
	eventRoot = null;
	constructor(...args) {
		super(...args);
		this.handleBubbledEvent = this.handleBubbledEvent.bind(this);
	}
	addEvent(eventName, eventType, handlerFunction) {
		if (!isString(eventName) || !eventName.trim()) throw new TypeError('eventName must be a non-empty string');
		if (!isString(eventType) || !eventType.trim()) throw new TypeError('eventType must be a non-empty string');
		if (!isFunction(handlerFunction)) throw new TypeError('handlerFunction must be a function');
		const type = eventType.trim().toLowerCase();
		const name = eventName.trim();
		let handlers = this.eventHandlers.get(type);
		if (!handlers) {
			handlers = new Map();
			this.eventHandlers.set(type, handlers);
		}
		handlers.set(name, handlerFunction);
		this.connectDelegatedEventType(type);
		this.syncDelegatedEvents();
		return this;
	}
	setEventName(element, eventName, eventType) {
		if (!isElement(element)) return element;
		const type = this.normalizeEventType(eventType);
		const name = this.normalizeEventName(eventName, type);
		if (!name) return element;
		const map = this.elementEventNames.get(element) ?? new Map();
		map.set(type, name);
		this.elementEventNames.set(element, map);
		return element;
	}
	emit(eventName, detail) {
		const init = { bubbles: true, composed: true };
		if (detail !== undefined) init.detail = detail;
		console.log(`Emitting event: ${eventName}`, detail);
		this.dispatchEvent(new CustomEvent(eventName, init));
	}
	normalizeEventType(eventType) {
		return isString(eventType) ? eventType.trim().toLowerCase() : '';
	}
	normalizeEventName(eventName, eventType) {
		if (!isString(eventName)) return `on${eventType}`;
		const name = eventName.trim();
		return name || `on${eventType}`;
	}
	getEventAttributeName(eventType) {
		return `data-on${eventType}`;
	}
	connectDelegatedEvents() {
		const root = this.getComponentRoot();
		if (this.eventRoot !== root) {
			this.disconnectDelegatedEvents();
			this.eventRoot = root;
		}
		for (const eventType of this.eventHandlers.keys()) {
			this.connectDelegatedEventType(eventType);
		}
	}
	connectDelegatedEventType(eventType) {
		if (!this.isConnected) return;
		const type = this.normalizeEventType(eventType);
		if (!type) return;
		if (this.eventRoot !== this.getComponentRoot()) this.connectDelegatedEvents();
		if (this.activeEventTypes.has(type)) return;
		this.eventRoot?.addEventListener(type, this.handleBubbledEvent);
		this.activeEventTypes.add(type);
	}
	disconnectDelegatedEvents() {
		for (const eventType of this.activeEventTypes) {
			this.eventRoot?.removeEventListener(eventType, this.handleBubbledEvent);
		}
		this.activeEventTypes.clear();
		this.eventRoot = null;
	}
	syncDelegatedEvents() {
		const root = this.getComponentRoot();
		if (!root?.querySelectorAll) return;
		for (const eventType of this.eventHandlers.keys()) {
			const attr = this.getEventAttributeName(eventType);
			for (const el of root.querySelectorAll(`[${attr}]`)) {
				this.setEventName(el, this.normalizeEventName(el.getAttribute(attr), eventType), eventType);
			}
		}
	}
	getElementEventName(element, eventType) {
		const type = this.normalizeEventType(eventType);
		if (!type || !isElement(element)) return '';
		const map = this.elementEventNames.get(element);
		if (map?.has(type)) return map.get(type);
		const attr = this.getEventAttributeName(type);
		if (!element.hasAttribute(attr)) return '';
		const name = this.normalizeEventName(element.getAttribute(attr), type);
		this.setEventName(element, name, type);
		return name;
	}
	getMatchedEventTarget(domEvent) {
		const root = this.getComponentRoot();
		const path = isFunction(domEvent.composedPath) ? domEvent.composedPath() : [domEvent.target];
		for (const node of path) {
			if (node === root || node === this) break;
			if (!isElement(node)) continue;
			const name = this.getElementEventName(node, domEvent.type);
			if (name) return { element: node, eventName: name };
		}
		const fallback = isElement(domEvent.target) ? domEvent.target : null;
		if (!fallback) return null;
		const fallbackName = this.getElementEventName(fallback, domEvent.type);
		return fallbackName ? { element: fallback, eventName: fallbackName } : null;
	}
	handleDelegatedEventError(error, domEvent, element, eventName) {
		queueMicrotask(() => {
			throw Object.assign(error instanceof Error ? error : new Error(String(error)), { element, event: domEvent, eventName });
		});
	}
	handleBubbledEvent(domEvent) {
		const handlers = this.eventHandlers.get(this.normalizeEventType(domEvent.type));
		if (!handlers?.size) return;
		const match = this.getMatchedEventTarget(domEvent);
		if (!match) return;
		const handler = handlers.get(match.eventName);
		if (!handler) return;
		try {
			const result = handler.call(this, domEvent, match.element, match.eventName);
			if (isPromiseLike(result)) {
				result.catch((error) => this.handleDelegatedEventError(error, domEvent, match.element, match.eventName));
			}
		} catch (error) {
			this.handleDelegatedEventError(error, domEvent, match.element, match.eventName);
		}
	}
};
