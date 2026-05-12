import {
	cachedProxy,
	isFunction,
	isObject,
	isSymbol,
	joinPath,
	setValueAtPath,
} from '../utilities.js';
import { STATE_PATH } from './state.js';
export let currentTracking = null;
export function setCurrentTracking(value) {
	currentTracking = value;
}
export class Binding {
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
function makeDependencyKey(prefix, path) {
	if (!prefix) {
		return path;
	}
	return path ? `${prefix}.${path}` : prefix;
}
function makeSetter(source) {
	if (!source) {
		return null;
	}
	return (path, value) => {
		setValueAtPath(source, path, value);
	};
}
function makeTrackingFactory(setValue, prefix = '') {
	const cache = new WeakMap();
	function makeTrackingValue(value, path = '') {
		if (!isObject(value)) {
			return value;
		}
		return cachedProxy(cache, value, path, () => {
			const isCollection = value instanceof Set || value instanceof Map;
			return new Proxy(value, {
				get(target, key) {
					if (key === STATE_PATH) {
						return makeDependencyKey(prefix, path);
					}
					const propertyValue = Reflect.get(target, key);
					if (isCollection && isFunction(propertyValue) && key !== 'constructor') {
						return propertyValue.bind(target);
					}
					if (isSymbol(key)) {
						return propertyValue;
					}
					const nestedPath = joinPath(path, key);
					if (!isFunction(propertyValue) && currentTracking) {
						currentTracking.add(makeDependencyKey(prefix, nestedPath));
					}
					if (isObject(propertyValue) && !isCollection) {
						return makeTrackingValue(propertyValue, nestedPath);
					}
					return propertyValue;
				},
				set(target, key, nextValue) {
					const nestedPath = joinPath(path, key);
					if (setValue) {
						setValue(nestedPath, nextValue);
						return true;
					}
					return Reflect.set(target, key, nextValue);
				},
			});
		});
	}
	return makeTrackingValue;
}
export function makeProxy(state, component) {
	const setValue = makeSetter(component?.stateProxy ?? state);
	return makeTrackingFactory(setValue)(state ?? {}, '');
}
export function makeGlobalProxy(globalState) {
	const setValue = makeSetter(globalState);
	return makeTrackingFactory(setValue, 'global')(globalState ?? {}, '');
}
// Explicit Binding factory for two-way input bindings and other places that
// need a reactive reference to a state key rather than its current value.
export function bind(stateKey, currentValue) {
	return new Binding(String(stateKey ?? ''), currentValue);
}
export function track(fn) {
	const deps = new Set();
	const previousTracking = currentTracking;
	currentTracking = deps;
	const value = fn();
	currentTracking = previousTracking;
	return {
		value,
		deps,
	};
}
