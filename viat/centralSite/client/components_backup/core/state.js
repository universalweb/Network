import {
	isObject, isPlainObject, isPromiseLike, isSymbol,
} from './utilities.js';
export const STATE_PATH = Symbol('statePath');
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
		if (value instanceof Set) {
			return value.has(key);
		}
		if (value instanceof Map) {
			return value.get(key);
		}
		return value?.[key];
	}, source);
}
function ensureSignalRegistry(component) {
	if (!component.stateSignals) {
		component.stateSignals = {
			subs: new Map(),
			pending: new Set(),
		};
	}
	return component.stateSignals;
}
function flushStateSignals(component) {
	const registry = component.stateSignals;
	if (!registry || !registry.pending.size) {
		return;
	}
	const changedPaths = [...registry.pending];
	registry.pending.clear();
	const subs = registry.subs;
	if (!subs.size) {
		return;
	}
	subs.forEach((callbacks, subscriptionPath) => {
		if (!callbacks.size) {
			return;
		}
		for (let i = 0; i < changedPaths.length; i++) {
			if (!pathsOverlap(subscriptionPath, changedPaths[i])) {
				continue;
			}
			const value = getValueAtPath(component.STATE, subscriptionPath);
			const list = [...callbacks];
			for (let j = 0; j < list.length; j++) {
				const result = list[j](value, changedPaths[i]);
				if (isPromiseLike(result)) {
					result.catch(queueAsyncError);
				}
			}
			break;
		}
	});
}
function runStateFlush(component) {
	component.pendingFlush = false;
	flushStateSignals(component);
	const result = component.updateView();
	if (isPromiseLike(result)) {
		result.catch(queueAsyncError);
	}
}
function scheduleStateFlush(component) {
	if (component.pendingFlush) {
		return;
	}
	component.pendingFlush = true;
	queueMicrotask(() => {
		runStateFlush(component);
	});
}
function notifyStateChange(component, changedPath) {
	const registry = ensureSignalRegistry(component);
	registry.pending.add(changedPath);
	scheduleStateFlush(component);
}
function cached(target, component, path, build) {
	let pathCache = component.proxyCache.get(target);
	if (!pathCache) {
		pathCache = new Map();
		component.proxyCache.set(target, pathCache);
	}
	const existing = pathCache.get(path);
	if (existing) {
		return existing;
	}
	const proxy = build();
	pathCache.set(path, proxy);
	return proxy;
}
function buildSetMethods(target, component, path) {
	function setAdd(item) {
		if (target.has(item)) {
			return target;
		}
		target.add(item);
		notifyStateChange(component, `${path}.${item}`);
		return target;
	}
	function setDelete(item) {
		if (!target.has(item)) {
			return false;
		}
		target.delete(item);
		notifyStateChange(component, `${path}.${item}`);
		return true;
	}
	function setClear() {
		if (!target.size) {
			return;
		}
		const items = [...target];
		target.clear();
		for (let i = 0; i < items.length; i++) {
			notifyStateChange(component, `${path}.${items[i]}`);
		}
	}
	return {
		add: setAdd,
		delete: setDelete,
		clear: setClear,
		has: target.has.bind(target),
		forEach: target.forEach.bind(target),
		keys: target.keys.bind(target),
		values: target.values.bind(target),
		entries: target.entries.bind(target),
		[Symbol.iterator]: target[Symbol.iterator].bind(target),
	};
}
function buildMapMethods(target, component, path) {
	function mapSet(mapKey, mapValue) {
		if (target.has(mapKey) && target.get(mapKey) === mapValue) {
			return target;
		}
		target.set(mapKey, mapValue);
		notifyStateChange(component, `${path}.${mapKey}`);
		return target;
	}
	function mapDelete(mapKey) {
		if (!target.has(mapKey)) {
			return false;
		}
		target.delete(mapKey);
		notifyStateChange(component, `${path}.${mapKey}`);
		return true;
	}
	function mapClear() {
		if (!target.size) {
			return;
		}
		const keys = [...target.keys()];
		target.clear();
		for (let i = 0; i < keys.length; i++) {
			notifyStateChange(component, `${path}.${keys[i]}`);
		}
	}
	return {
		set: mapSet,
		delete: mapDelete,
		clear: mapClear,
		get: target.get.bind(target),
		has: target.has.bind(target),
		forEach: target.forEach.bind(target),
		keys: target.keys.bind(target),
		values: target.values.bind(target),
		entries: target.entries.bind(target),
		[Symbol.iterator]: target[Symbol.iterator].bind(target),
	};
}
function makeCollectionTrap(methods, path) {
	return {
		get(t, key) {
			if (key === STATE_PATH) {
				return path;
			}
			const method = methods[key];
			if (method !== undefined) {
				return method;
			}
			const value = Reflect.get(t, key);
			if (typeof value !== 'function') {
				return value;
			}
			return value.bind(t);
		},
	};
}
function makeSetProxy(target, component, path) {
	return cached(target, component, path, () => {
		const methods = buildSetMethods(target, component, path);
		return new Proxy(target, makeCollectionTrap(methods, path));
	});
}
function makeMapProxy(target, component, path) {
	return cached(target, component, path, () => {
		const methods = buildMapMethods(target, component, path);
		return new Proxy(target, makeCollectionTrap(methods, path));
	});
}
function makeStateProxy(obj, component, path = '') {
	return cached(obj, component, path, () => {
		return new Proxy(obj, {
			get(target, key) {
				if (isSymbol(key)) {
					return Reflect.get(target, key);
				}
				const propertyValue = Reflect.get(target, key);
				const nestedPath = path ? `${path}.${String(key)}` : String(key);
				if (isPlainObject(propertyValue) || Array.isArray(propertyValue)) {
					return makeStateProxy(propertyValue, component, nestedPath);
				}
				if (propertyValue instanceof Set) {
					return makeSetProxy(propertyValue, component, nestedPath);
				}
				if (propertyValue instanceof Map) {
					return makeMapProxy(propertyValue, component, nestedPath);
				}
				return propertyValue;
			},
			set(target, key, value) {
				if (deepEqual(target[key], value)) {
					return true;
				}
				const fullPath = path ? `${path}.${String(key)}` : String(key);
				Reflect.set(target, key, value);
				notifyStateChange(component, fullPath);
				return true;
			},
			deleteProperty(target, key) {
				if (!Object.hasOwn(target, key)) {
					return true;
				}
				const fullPath = path ? `${path}.${String(key)}` : String(key);
				Reflect.deleteProperty(target, key);
				notifyStateChange(component, fullPath);
				return true;
			},
		});
	});
}
export function initState() {
	this.proxyCache = new WeakMap();
	this.stateProxy = makeStateProxy(this.STATE, this);
}
export function replaceState(state = {}) {
	if (deepEqual(this.STATE, state)) {
		return Promise.resolve();
	}
	this.STATE = isPlainObject(state) ? {
		...state,
	} : {};
	this.proxyCache = new WeakMap();
	this.stateProxy = makeStateProxy(this.STATE, this);
	this.templateBuilt = false;
	notifyStateChange(this, '');
	return this.updateView();
}
export function watchState(key, handler) {
	const statePath = String(key ?? '');
	const component = this;
	const registry = ensureSignalRegistry(component);
	let callbacks = registry.subs.get(statePath);
	if (!callbacks) {
		callbacks = new Set();
		registry.subs.set(statePath, callbacks);
	}
	let previousValue = getValueAtPath(component.STATE, statePath);
	const wrappedHandler = (nextValue, changedPath) => {
		const result = handler(nextValue, previousValue, changedPath);
		previousValue = nextValue;
		return result;
	};
	callbacks.add(wrappedHandler);
	return () => {
		callbacks.delete(wrappedHandler);
		if (!callbacks.size) {
			registry.subs.delete(statePath);
		}
	};
}
export function onStateChange() {}
export async function updateView() {
	const pendingTasks = [];
	const stateChangeResult = this.onStateChange();
	if (isPromiseLike(stateChangeResult)) {
		pendingTasks.push(stateChangeResult);
	}
	if (this.isConnected && !this.templateBuilt) {
		pendingTasks.push(this.renderView());
	}
	if (!pendingTasks.length) {
		return Promise.resolve();
	}
	await Promise.all(pendingTasks);
}
