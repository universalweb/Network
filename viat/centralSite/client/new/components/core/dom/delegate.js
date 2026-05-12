import {
	getOrInit, isFunction, isObject, isPromiseLike, isString, queueAsyncError,
} from '../utilities.js';
const subevents = new WeakMap();
const channels = new Map();
const rootListeners = new Map();
function runHandler(handler, domEvent, target, data) {
	const result = handler(domEvent, target, data);
	if (isPromiseLike(result)) {
		result.catch(queueAsyncError);
	}
}
function dispatchChannel(domEvent) {
	const subMap = channels.get(domEvent.type);
	if (!subMap) {
		return;
	}
	const path = domEvent.composedPath();
	subMap.forEach((handlers, subeventName) => {
		if (!handlers.size) {
			return;
		}
		if (subeventName === null) {
			const target = path[0];
			handlers.forEach((entry) => {
				runHandler(entry.wrapped, domEvent, target, undefined);
			});
			return;
		}
		for (let i = 0; i < path.length; i++) {
			const tags = subevents.get(path[i]);
			if (!tags) {
				continue;
			}
			const data = tags.get(subeventName);
			if (data === undefined) {
				continue;
			}
			handlers.forEach((entry) => {
				runHandler(entry.wrapped, domEvent, path[i], data);
			});
			return;
		}
	});
}
function ensureRootListener(eventName) {
	if (rootListeners.has(eventName)) {
		return;
	}
	document.addEventListener(eventName, dispatchChannel, {
		capture: true,
	});
	rootListeners.set(eventName, document);
}
function detachRootListener(eventName) {
	if (!rootListeners.has(eventName)) {
		return;
	}
	document.removeEventListener(eventName, dispatchChannel, {
		capture: true,
	});
	rootListeners.delete(eventName);
}
function parseChannel(channel) {
	if (!isString(channel) || !channel.length) {
		throw new TypeError('delegate: channel must be a non-empty string');
	}
	const dot = channel.indexOf('.');
	if (dot === -1) {
		return {
			eventName: channel,
			subeventName: null,
		};
	}
	return {
		eventName: channel.slice(0, dot),
		subeventName: channel.slice(dot + 1),
	};
}
function removeEntry(eventName, subeventName, entry) {
	const subMap = channels.get(eventName);
	if (!subMap) {
		return;
	}
	const handlers = subMap.get(subeventName);
	if (!handlers) {
		return;
	}
	if (!handlers.delete(entry)) {
		return;
	}
	if (entry.signalCleanup) {
		entry.signalCleanup();
		entry.signalCleanup = null;
	}
	if (handlers.size === 0) {
		subMap.delete(subeventName);
		if (subMap.size === 0) {
			channels.delete(eventName);
			detachRootListener(eventName);
		}
	}
}
export function delegate(channel, handler, options) {
	if (!isFunction(handler)) {
		throw new TypeError('delegate: handler must be a function');
	}
	const {
		eventName,
		subeventName,
	} = parseChannel(channel);
	const fireOnce = isObject(options) && options.once === true;
	const signal = isObject(options) ? options.signal : null;
	if (signal?.aborted) {
		return function unsubscribeNoop() {};
	}
	const subMap = getOrInit(channels, eventName, () => new Map());
	const handlers = getOrInit(subMap, subeventName, () => new Set());
	const entry = {
		handler,
		wrapped: null,
		signalCleanup: null,
	};
	entry.wrapped = fireOnce ? function onceHandler(domEvent, target, data) {
		removeEntry(eventName, subeventName, entry);
		return handler(domEvent, target, data);
	} : handler;
	handlers.add(entry);
	ensureRootListener(eventName);
	if (signal) {
		const onAbort = () => {
			removeEntry(eventName, subeventName, entry);
		};
		signal.addEventListener('abort', onAbort, {
			once: true,
		});
		entry.signalCleanup = () => {
			signal.removeEventListener('abort', onAbort);
		};
	}
	return function unsubscribe() {
		removeEntry(eventName, subeventName, entry);
	};
}
export function removeDelegate(channel, handler) {
	const {
		eventName,
		subeventName,
	} = parseChannel(channel);
	const subMap = channels.get(eventName);
	if (!subMap) {
		return;
	}
	const handlers = subMap.get(subeventName);
	if (!handlers) {
		return;
	}
	const targets = [];
	handlers.forEach((entry) => {
		if (entry.handler === handler) {
			targets.push(entry);
		}
	});
	for (let i = 0; i < targets.length; i++) {
		removeEntry(eventName, subeventName, targets[i]);
	}
}
export function registerSubevent(element, subeventName, data) {
	getOrInit(subevents, element, () => new Map()).set(subeventName, data);
}
export function unregisterSubevent(element, subeventName) {
	const map = subevents.get(element);
	if (!map) {
		return;
	}
	map.delete(subeventName);
	if (map.size === 0) {
		subevents.delete(element);
	}
}
export function unregisterAllSubevents(element) {
	subevents.delete(element);
}
export function getSubeventData(element, subeventName) {
	return subevents.get(element)?.get(subeventName);
}
