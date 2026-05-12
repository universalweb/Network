export function isObject(value) {
	return value !== null && typeof value === 'object';
}
export function isPlainObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
export function isString(value) {
	return typeof value === 'string';
}
export function isFunction(value) {
	return typeof value === 'function';
}
export function isSymbol(value) {
	return typeof value === 'symbol';
}
export function isElement(value) {
	return value instanceof Element;
}
export function isShadowRoot(value) {
	return value instanceof ShadowRoot;
}
export function isPromiseLike(value) {
	return value !== null && typeof value === 'object' && isFunction(value.then);
}
export function isError(value) {
	return value instanceof Error;
}
export function isUndefined(value) {
	return value === undefined;
}
export function isTypeUndefined(type) {
	return type === 'undefined';
}
export function isNull(value) {
	return value === null;
}
export function noValue(value) {
	return Boolean(isUndefined(value) || isNull(value));
}
export function hasValue(value) {
	return !noValue(value);
}
export function isArray(value) {
	return Array.isArray(value);
}
export function assign(target, ...sources) {
	return Object.assign(target, ...sources);
}
export function hasOwn(obj, key) {
	return Object.hasOwn(obj, key);
}
export function keysOf(obj) {
	return Object.keys(obj);
}
export function getProto(value) {
	return Object.getPrototypeOf(value);
}
export function isEmpty(value) {
	if (isString(value)) {
		return value.trim() === '';
	}
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (isObject(value)) {
		return Object.keys(value).length === 0;
	}
	return false;
}
export function createElementFromHTML(htmlString) {
	const template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstElementChild;
}
export const callFn = (fn) => {
	fn();
};
export const eachArray = (arr, fn) => {
	for (let i = 0; i < arr.length; i++) {
		fn(arr[i], i);
	}
};
export const eachObject = (obj, fn) => {
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		fn(keys[i], obj[keys[i]]);
	}
};
export const eachNodeList = (list, fn) => {
	for (let i = 0; i < list.length; i++) {
		fn(list[i], i);
	}
};
export function queueAsyncError(error) {
	queueMicrotask(() => {
		throw error;
	});
}
export function plainEqual(a, b) {
	if (a === b) {
		return true;
	}
	if (a?.constructor !== b?.constructor) {
		return false;
	}
	if (isPlainObject(a) || Array.isArray(a)) {
		const keys = Object.keys(a);
		if (keys.length !== Object.keys(b).length) {
			return false;
		}
		return keys.every((key) => {
			return plainEqual(a[key], b[key]);
		});
	}
	return false;
}
const DOT_CODE = 46;
export function pathsOverlap(a, b) {
	if (a === b) {
		return true;
	}
	const aLen = a.length;
	const bLen = b.length;
	if (aLen < bLen) {
		return b.charCodeAt(aLen) === DOT_CODE && b.startsWith(a);
	}
	if (bLen < aLen) {
		return a.charCodeAt(bLen) === DOT_CODE && a.startsWith(b);
	}
	return false;
}
const PARSED_PATHS = new Map();
export function parsePath(path) {
	if (!path) {
		return null;
	}
	let parts = PARSED_PATHS.get(path);
	if (!parts) {
		parts = path.split('.');
		PARSED_PATHS.set(path, parts);
	}
	return parts;
}
export function getValueAtPath(source, path) {
	const parts = parsePath(path);
	if (!parts) {
		return source;
	}
	let value = source;
	for (let i = 0; i < parts.length; i++) {
		if (value == null) {
			return undefined;
		}
		const key = parts[i];
		if (value instanceof Set) {
			value = value.has(key);
		} else if (value instanceof Map) {
			value = value.get(key);
		} else {
			value = value[key];
		}
	}
	return value;
}
export function getOrInit(map, key, factory) {
	let entry = map.get(key);
	if (entry === undefined) {
		entry = factory();
		map.set(key, entry);
	}
	return entry;
}
export function cachedProxy(cache, target, path, build) {
	let pathMap = cache.get(target);
	if (!pathMap) {
		pathMap = new Map();
		cache.set(target, pathMap);
	}
	const existing = pathMap.get(path);
	if (existing) {
		return existing;
	}
	const proxy = build();
	pathMap.set(path, proxy);
	return proxy;
}
export function joinPath(parent, key) {
	return parent ? `${parent}.${String(key)}` : String(key);
}
const CACHED_RESOLVED_PROMISE = Promise.resolve();
export function assignPromisePair(target, name) {
	target[name] = new Promise((resolve) => {
		target[`${name}Resolver`] = resolve;
	});
}
export function fireResolver(target, name) {
	const resolverName = `${name}Resolver`;
	if (target[resolverName]) {
		target[resolverName]();
		target[resolverName] = null;
		target[name] = CACHED_RESOLVED_PROMISE;
	}
}
export function runHook(component, hookName, args, errorHandler = 'onLifecycleError') {
	const hook = component[hookName];
	if (!hook) {
		return true;
	}
	let result;
	try {
		result = args ? hook.apply(component, args) : hook.call(component);
	} catch (error) {
		component[errorHandler](error);
		return false;
	}
	if (!isPromiseLike(result)) {
		return true;
	}
	return result.then(() => {
		return true;
	}, (error) => {
		component[errorHandler](error);
		return false;
	});
}
export function clearUnsubs(set) {
	set.forEach(callFn);
	set.clear();
}
// Keep `current` (Map<key, unsub>) in sync with `nextKeys` (Set<key>) by:
//   - calling the unsub for any key dropped
//   - subscribing only for keys newly added
// Returns the same `current` map (now updated). Stable keys keep their unsub
// reference so we don't churn subscribers when state shapes are unchanged.
export function syncSubsByDiff(current, nextKeys, subscribe) {
	current.forEach((unsub, key) => {
		if (!nextKeys.has(key)) {
			unsub();
			current.delete(key);
		}
	});
	nextKeys.forEach((key) => {
		if (!current.has(key)) {
			current.set(key, subscribe(key));
		}
	});
	return current;
}
export function smartClone(value) {
	if (value === null || typeof value !== 'object') {
		return value;
	}
	if (isArray(value)) {
		const out = new Array(value.length);
		for (let i = 0; i < value.length; i++) {
			out[i] = smartClone(value[i]);
		}
		return out;
	}
	if (value instanceof Map) {
		const out = new Map();
		value.forEach((entry, key) => {
			out.set(key, smartClone(entry));
		});
		return out;
	}
	if (value instanceof Set) {
		const out = new Set();
		value.forEach((entry) => {
			out.add(smartClone(entry));
		});
		return out;
	}
	if (isPlainObject(value)) {
		const out = {};
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			out[key] = smartClone(value[key]);
		}
		return out;
	}
	return value;
}
export function setValueAtPath(source, path, value) {
	if (!path.includes('.')) {
		source[path] = value;
		return;
	}
	const parts = path.split('.');
	const finalKey = parts.pop();
	let cursor = source;
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (!isPlainObject(cursor[part]) && !Array.isArray(cursor[part])) {
			cursor[part] = {};
		}
		cursor = cursor[part];
	}
	cursor[finalKey] = value;
}
