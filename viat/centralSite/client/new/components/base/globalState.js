import { isObject, isPromiseLike, isSymbol } from './utilities.js';
const STATE = {};
const subs = new Map();
const pending = new Set();
const proxyCache = new WeakMap();
let flushScheduled = false;
let GLOBAL_STATE = null;
function queueAsyncError(error) {
	queueMicrotask(() => {
		throw error;
	});
}
function deepEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (Number.isNaN(a) && Number.isNaN(b)) {
		return true;
	}
	if (isObject(a) && isObject(b)) {
		if (Array.isArray(a) !== Array.isArray(b)) {
			return false;
		}
		const keys = Object.keys(a);
		if (keys.length !== Object.keys(b).length) {
			return false;
		}
		return keys.every((k) => {
			return deepEqual(a[k], b[k]);
		});
	}
	return false;
}
function pathsOverlap(currentPath, changedPath) {
	return currentPath === changedPath || currentPath.startsWith(`${changedPath}.`) || changedPath.startsWith(`${currentPath}.`);
}
function getValueAtPath(source, path) {
	if (!path) {
		return source;
	}
	return path.split('.').reduce((value, key) => {
		return value?.[key];
	}, source);
}
function setValueAtPath(source, path, value) {
	if (!path.includes('.')) {
		source[path] = value;
		return;
	}
	const pathParts = path.split('.');
	const finalKey = pathParts.pop();
	let currentValue = source;
	for (const pathPart of pathParts) {
		if (!isObject(currentValue[pathPart]) && !Array.isArray(currentValue[pathPart])) {
			currentValue[pathPart] = {};
		}
		currentValue = currentValue[pathPart];
	}
	currentValue[finalKey] = value;
}
function emitGlobalChange(path) {
	if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
		return;
	}
	const detail = {
		path,
		value: getValueAtPath(GLOBAL_STATE, path),
	};
	const init = {
		bubbles: false,
		cancelable: false,
		composed: false,
		detail,
	};
	window.dispatchEvent(new CustomEvent('global-state-change', init));
}
function notifySubscribers(path) {
	pending.add(path);
	if (flushScheduled) {
		return;
	}
	flushScheduled = true;
	queueMicrotask(() => {
		flushScheduled = false;
		const changedPaths = Array.from(pending);
		pending.clear();
		const notificationMap = new Map();
		for (const subscriptionKey of subs.keys()) {
			for (const changedPath of changedPaths) {
				if (!pathsOverlap(subscriptionKey, changedPath)) {
					continue;
				}
				notificationMap.set(subscriptionKey, changedPath);
				break;
			}
		}
		for (const [
			subscriptionKey,
			changedPath,
		] of notificationMap) {
			const callbacks = Array.from(subs.get(subscriptionKey) ?? []);
			if (!callbacks.length) {
				continue;
			}
			const value = getValueAtPath(GLOBAL_STATE, subscriptionKey);
			for (const callback of callbacks) {
				const result = callback(value, GLOBAL_STATE, changedPath);
				if (isPromiseLike(result)) {
					result.catch(queueAsyncError);
				}
			}
		}
		for (const changedPath of changedPaths) {
			emitGlobalChange(changedPath);
		}
	});
}
function makeGlobalProxy(target, path = '') {
	if (!isObject(target) && !Array.isArray(target)) {
		return target;
	}
	let pathCache = proxyCache.get(target);
	if (!pathCache) {
		pathCache = new Map();
		proxyCache.set(target, pathCache);
	}
	if (pathCache.has(path)) {
		return pathCache.get(path);
	}
	const proxy = new Proxy(target, {
		get(obj, key) {
			if (isSymbol(key)) {
				return Reflect.get(obj, key);
			}
			const propertyValue = Reflect.get(obj, key);
			const nestedPath = path ? `${path}.${String(key)}` : String(key);
			if (isObject(propertyValue) || Array.isArray(propertyValue)) {
				return makeGlobalProxy(propertyValue, nestedPath);
			}
			return propertyValue;
		},
		set(obj, key, value) {
			if (deepEqual(obj[key], value)) {
				return true;
			}
			const fullPath = path ? `${path}.${String(key)}` : String(key);
			Reflect.set(obj, key, value);
			notifySubscribers(fullPath);
			return true;
		},
		deleteProperty(obj, key) {
			const fullPath = path ? `${path}.${String(key)}` : String(key);
			const result = Reflect.deleteProperty(obj, key);
			if (result) {
				notifySubscribers(fullPath);
			}
			return result;
		},
	});
	pathCache.set(path, proxy);
	return proxy;
}
GLOBAL_STATE = makeGlobalProxy(STATE);
export { GLOBAL_STATE };
export function getGlobalState(key) {
	return key === undefined ? GLOBAL_STATE : getValueAtPath(GLOBAL_STATE, key);
}
export function setGlobalState(updates) {
	if (!isObject(updates)) {
		return;
	}
	for (const [
		key,
		value,
	] of Object.entries(updates)) {
		setValueAtPath(GLOBAL_STATE, key, value);
	}
}
export function subscribeGlobal(key, cb) {
	if (!subs.has(key)) {
		subs.set(key, new Set());
	}
	const handlers = subs.get(key);
	handlers.add(cb);
	return () => {
		handlers.delete(cb);
		if (!handlers.size) {
			subs.delete(key);
		}
	};
}
export function watchGlobal(key, cb) {
	const unsubscribe = subscribeGlobal(key, cb ?? (() => {
		return this.refresh();
	}));
	const stopWatching = () => {
		unsubscribe();
		this?.globalUnsubs?.delete(stopWatching);
	};
	this?.globalUnsubs?.add(stopWatching);
	return stopWatching;
}
export function getGlobal(key) {
	return getGlobalState(key);
}
export function setGlobal(updates) {
	setGlobalState(updates);
}
