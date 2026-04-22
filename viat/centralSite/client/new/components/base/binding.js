import {
	isFunction,
	isObject,
	isSymbol,
} from '../utilities.js';
export let currentTracking = null;
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
	for (const pathPart of pathParts) {
		if (!isObject(currentValue[pathPart])) {
			currentValue[pathPart] = {};
		}
		currentValue = currentValue[pathPart];
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
		if (!isObject(value)) {
			return binding;
		}
		let pathCache = cache.get(value);
		if (!pathCache) {
			pathCache = new Map();
			cache.set(value, pathCache);
		}
		if (pathCache.has(path)) {
			return pathCache.get(path);
		}
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
// Used during template expression evaluation — returns Binding objects so the
// html tag can identify which state key each expression slot belongs to.
export function makeRenderProxy(state, component) {
	const setValue = makeSetter(component?.stateProxy ?? state);
	return makeBindingFactory(setValue)(state ?? {}, '');
}
export function makeGlobalRenderProxy(globalState) {
	const setValue = makeSetter(globalState);
	return makeBindingFactory(setValue, 'global')(globalState ?? {}, '');
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
	currentTracking = deps;
	let value;
	try {
		value = fn();
	} finally {
		currentTracking = null;
	}
	return {
		value,
		deps,
	};
}
