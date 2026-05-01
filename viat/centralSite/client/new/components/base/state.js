import {
	isObject, isPlainObject, isPromiseLike, isSymbol,
} from './utilities.js';
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
function flushPending() {
	if (!this.pendingFlush) {
		this.pendingFlush = new Promise((resolve) => {
			queueMicrotask(() => {
				this.pendingFlush = null;
				resolve(this.updateView());
			});
		});
	}
	return this.pendingFlush;
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
function ensureSignalRegistry(component) {
	if (!component.stateSignals) {
		component.stateSignals = {
			subs: new Map(),
			pending: new Set(),
			flushScheduled: false,
		};
	}
	return component.stateSignals;
}
function flushStateSignals(component) {
	const registry = component.stateSignals;
	if (!registry) {
		return;
	}
	registry.flushScheduled = false;
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
function notifyStateChange(component, changedPath) {
	const registry = ensureSignalRegistry(component);
	registry.pending.add(changedPath);
	if (registry.flushScheduled) {
		return;
	}
	registry.flushScheduled = true;
	queueMicrotask(() => {
		flushStateSignals(component);
	});
}
function makeStateProxy(obj, component, path = '') {
	let pathCache = component.proxyCache.get(obj);
	if (!pathCache) {
		pathCache = new Map();
		component.proxyCache.set(obj, pathCache);
	}
	const cached = pathCache.get(path);
	if (cached) {
		return cached;
	}
	const proxy = new Proxy(obj, {
		get(target, key) {
			if (isSymbol(key)) {
				return Reflect.get(target, key);
			}
			const propertyValue = Reflect.get(target, key);
			const nestedPath = path ? `${path}.${String(key)}` : String(key);
			if (isPlainObject(propertyValue) || Array.isArray(propertyValue)) {
				return makeStateProxy(propertyValue, component, nestedPath);
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
			flushPending.call(component);
			return true;
		},
	});
	pathCache.set(path, proxy);
	return proxy;
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
