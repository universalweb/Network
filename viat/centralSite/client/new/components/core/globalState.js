import {
	eachObject, isObject, isPlainObject, isPromiseLike, isSymbol,
} from './utilities.js';
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
	for (let i = 0; i < pathParts.length; i++) {
		const part = pathParts[i];
		if (!isPlainObject(currentValue[part]) && !Array.isArray(currentValue[part])) {
			currentValue[part] = {};
		}
		currentValue = currentValue[part];
	}
	currentValue[finalKey] = value;
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
		subs.forEach((subscribers, subscriptionKey) => {
			if (!subscribers.size) {
				return;
			}
			for (let i = 0; i < changedPaths.length; i++) {
				if (!pathsOverlap(subscriptionKey, changedPaths[i])) {
					continue;
				}
				notificationMap.set(subscriptionKey, changedPaths[i]);
				break;
			}
		});
		notificationMap.forEach((changedPath, subscriptionKey) => {
			const callbacks = Array.from(subs.get(subscriptionKey) ?? []);
			if (!callbacks.length) {
				return;
			}
			const value = getValueAtPath(GLOBAL_STATE, subscriptionKey);
			for (let i = 0; i < callbacks.length; i++) {
				const result = callbacks[i](value, GLOBAL_STATE, changedPath);
				if (isPromiseLike(result)) {
					result.catch(queueAsyncError);
				}
			}
		});
	});
}
function makeGlobalProxy(target, path = '') {
	if (!isPlainObject(target) && !Array.isArray(target)) {
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
			if (isPlainObject(propertyValue) || Array.isArray(propertyValue)) {
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
export function getGlobal(key) {
	return key === undefined ? GLOBAL_STATE : getValueAtPath(GLOBAL_STATE, key);
}
export function setGlobal(updates) {
	if (!isPlainObject(updates)) {
		return;
	}
	eachObject(updates, (key, value) => {
		setValueAtPath(GLOBAL_STATE, key, value);
	});
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
		return this.renderView();
	}));
	const stopWatching = () => {
		unsubscribe();
		this?.globalUnsubs?.delete(stopWatching);
	};
	this?.globalUnsubs?.add(stopWatching);
	return stopWatching;
}
