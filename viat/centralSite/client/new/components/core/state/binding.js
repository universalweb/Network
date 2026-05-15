import {
	cachedProxy,
	isFunction,
	isMap,
	isObject,
	isSet,
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
// One TrackingFactory per (setValue, prefix) pair holds the per-factory cache;
// each TrackingProxyHandler is a thin per-proxy instance that points back at
// the factory. Trap methods live on the prototype for JIT monomorphization.
class TrackingFactory {
	constructor(setValue, prefix) {
		this.setValue = setValue;
		this.prefix = prefix;
		this.cache = new WeakMap();
	}
	create(value, path = '') {
		if (!isObject(value)) {
			return value;
		}
		return cachedProxy(this.cache, value, path, () => {
			const collection = isSet(value) || isMap(value);
			return new Proxy(value, new TrackingProxyHandler(this, path, collection));
		});
	}
}
class TrackingProxyHandler {
	constructor(factory, path, isCollection) {
		this.factory = factory;
		this.path = path;
		this.isCollection = isCollection;
	}
	get(target, key) {
		const factory = this.factory;
		if (key === STATE_PATH) {
			return makeDependencyKey(factory.prefix, this.path);
		}
		const propertyValue = Reflect.get(target, key);
		if (this.isCollection && isFunction(propertyValue) && key !== 'constructor') {
			return propertyValue.bind(target);
		}
		if (isSymbol(key)) {
			return propertyValue;
		}
		const nestedPath = joinPath(this.path, key);
		if (!isFunction(propertyValue) && currentTracking) {
			currentTracking.add(makeDependencyKey(factory.prefix, nestedPath));
		}
		if (isObject(propertyValue) && !this.isCollection) {
			return factory.create(propertyValue, nestedPath);
		}
		return propertyValue;
	}
	set(target, key, nextValue) {
		const nestedPath = joinPath(this.path, key);
		const setValue = this.factory.setValue;
		if (setValue) {
			setValue(nestedPath, nextValue);
			return true;
		}
		return Reflect.set(target, key, nextValue);
	}
}
export function makeProxy(state, component) {
	const setValue = makeSetter(component?.stateProxy ?? state);
	return new TrackingFactory(setValue, '').create(state ?? {}, '');
}
export function makeGlobalProxy(globalState) {
	const setValue = makeSetter(globalState);
	return new TrackingFactory(setValue, 'global').create(globalState ?? {}, '');
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
