import {
	isFunction,
	isObject,
	isSymbol,
} from './utilities.js';
export let currentTracking = null;
export function setCurrentTracking(value) {
	currentTracking = value;
}
export class Binding {
	static isBinding(source) {
		return source instanceof Binding;
	}
	constructor(key, value) {
		this.key = key;
		this.value = value;
	}
	toString() {
		return String(this.value ?? '');
	}
	valueOf() {
		return this.value;
	}
}
function makePath(path, key) {
	return path ? `${path}.${String(key)}` : String(key);
}
function makeDependencyKey(prefix, path) {
	if (!prefix) {
		return path;
	}
	return path ? `${prefix}.${path}` : prefix;
}
function setValueAtPath(source, path, value) {
	const pathParts = path.split('.');
	const finalKey = pathParts.pop();
	let currentValue = source;
	for (let i = 0; i < pathParts.length; i++) {
		const part = pathParts[i];
		if (!isObject(currentValue[part])) {
			currentValue[part] = {};
		}
		currentValue = currentValue[part];
	}
	currentValue[finalKey] = value;
}
function makeSetter(source) {
	if (!source) {
		return null;
	}
	return (path, value) => {
		setValueAtPath(source, path, value);
	};
}
function makeBindingFactory(setValue, prefix = '') {
	const cache = new WeakMap();
	function makeBindingValue(value, path = '') {
		const binding = new Binding(makeDependencyKey(prefix, path), value);
		const proxy = new Proxy(binding, {
			get(target, key) {
				if (isSymbol(key) || key in target) {
					return Reflect.get(target, key);
				}
				const propertyValue = target.value?.[key];
				const nestedPath = makePath(path, key);
				if (isFunction(propertyValue)) {
					return propertyValue.bind(target.value);
				}
				return makeBindingValue(propertyValue, nestedPath);
			},
			set(target, key, nextValue) {
				if (isSymbol(key) || key in target) {
					return Reflect.set(target, key, nextValue);
				}
				if (setValue) {
					setValue(makePath(path, key), nextValue);
					return true;
				}
				return false;
			},
		});
		if (!isObject(value)) {
			return proxy;
		}
		let pathCache = cache.get(value);
		if (!pathCache) {
			pathCache = new Map();
			cache.set(value, pathCache);
		}
		if (pathCache.has(path)) {
			return pathCache.get(path);
		}
		pathCache.set(path, proxy);
		return proxy;
	}
	return makeBindingValue;
}
function makeTrackingFactory(setValue, prefix = '') {
	const cache = new WeakMap();
	function makeTrackingValue(value, path = '') {
		if (!isObject(value)) {
			return value;
		}
		let pathCache = cache.get(value);
		if (!pathCache) {
			pathCache = new Map();
			cache.set(value, pathCache);
		}
		if (pathCache.has(path)) {
			return pathCache.get(path);
		}
		const proxy = new Proxy(value, {
			get(target, key) {
				if (isSymbol(key)) {
					return Reflect.get(target, key);
				}
				const propertyValue = Reflect.get(target, key);
				const nestedPath = makePath(path, key);
				if (!isFunction(propertyValue) && currentTracking) {
					currentTracking.add(makeDependencyKey(prefix, nestedPath));
				}
				if (isObject(propertyValue)) {
					return makeTrackingValue(propertyValue, nestedPath);
				}
				return propertyValue;
			},
			set(target, key, nextValue) {
				const nestedPath = makePath(path, key);
				if (setValue) {
					setValue(nestedPath, nextValue);
					return true;
				}
				return Reflect.set(target, key, nextValue);
			},
		});
		pathCache.set(path, proxy);
		return proxy;
	}
	return makeTrackingValue;
}
export function makeRenderProxy(state, component) {
	const setValue = makeSetter(component?.stateProxy ?? state);
	return makeTrackingFactory(setValue)(state ?? {}, '');
}
export function makeGlobalRenderProxy(globalState) {
	const setValue = makeSetter(globalState);
	return makeTrackingFactory(setValue, 'global')(globalState ?? {}, '');
}
// Explicit Binding factory for two-way input bindings and other places that
// need a reactive reference to a state key rather than its current value.
export function bind(stateKey, currentValue) {
	return new Binding(String(stateKey ?? ''), currentValue);
}
// Used when evaluating arrow-function expressions — returns actual values so
// conditional logic works correctly, while recording accessed keys.
export function makeTrackingProxy(state, component) {
	const setValue = makeSetter(component?.stateProxy ?? state);
	return makeTrackingFactory(setValue)(state ?? {}, '');
}
export function makeGlobalTrackingProxy(globalState) {
	const setValue = makeSetter(globalState);
	return makeTrackingFactory(setValue, 'global')(globalState ?? {}, '');
}
export function track(fn) {
	const deps = new Set();
	const previousTracking = currentTracking;
	currentTracking = deps;
	let value;
	try {
		value = fn();
	} finally {
		currentTracking = previousTracking;
	}
	return {
		value,
		deps,
	};
}
