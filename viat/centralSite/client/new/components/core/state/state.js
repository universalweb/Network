import { Logger, isDev } from '../debug/logger.js';
import {
	cachedProxy,
	getValueAtPath,
	hasOwn,
	isArray,
	isPlainObject,
	isPromiseLike,
	isSymbol,
	joinPath,
	plainEqual,
	queueAsyncError,
} from '../utilities.js';
import { makePathBus } from './pathBus.js';
export const STATE_PATH = Symbol('statePath');
function ensureBus(component) {
	if (component.stateBus) {
		return component.stateBus;
	}
	const bus = makePathBus({
		getValue: (path) => {
			return getValueAtPath(component.STATE, path);
		},
		onFlush: () => {
			const result = component.updateView();
			if (isPromiseLike(result)) {
				result.catch(queueAsyncError);
			}
		},
	});
	component.stateBus = bus;
	return bus;
}
function notifyStateChange(component, changedPath) {
	ensureBus(component).notify(changedPath);
}
function buildCollectionMethods(target, component, path, isMap) {
	function notify(key) {
		notifyStateChange(component, joinPath(path, key));
	}
	function mutateAdd(item) {
		if (target.has(item)) {
			return target;
		}
		target.add(item);
		notify(item);
		return target;
	}
	function mutateSet(mapKey, mapValue) {
		if (target.has(mapKey) && target.get(mapKey) === mapValue) {
			return target;
		}
		target.set(mapKey, mapValue);
		notify(mapKey);
		return target;
	}
	function mutateDelete(key) {
		if (!target.has(key)) {
			return false;
		}
		target.delete(key);
		notify(key);
		return true;
	}
	function mutateClear() {
		if (!target.size) {
			return;
		}
		const keys = isMap ? [...target.keys()] : [...target];
		target.clear();
		for (let i = 0; i < keys.length; i++) {
			notify(keys[i]);
		}
	}
	const shared = {
		delete: mutateDelete,
		clear: mutateClear,
		has: target.has.bind(target),
		forEach: target.forEach.bind(target),
		keys: target.keys.bind(target),
		values: target.values.bind(target),
		entries: target.entries.bind(target),
		[Symbol.iterator]: target[Symbol.iterator].bind(target),
	};
	if (isMap) {
		shared.set = mutateSet;
		shared.get = target.get.bind(target);
		return shared;
	}
	shared.add = mutateAdd;
	return shared;
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
			if (typeof value !== 'function' || key === 'constructor') {
				return value;
			}
			return value.bind(t);
		},
		set() {
			throw new Error('Do not mutate Map/Set proxy properties directly. Use .set() or .add() instead.');
		},
		deleteProperty() {
			throw new Error('Do not delete Map/Set proxy properties directly. Use .delete() instead.');
		},
	};
}
function makeCollectionProxy(target, component, path, isMap) {
	return cachedProxy(component.proxyCache, target, path, () => {
		const methods = buildCollectionMethods(target, component, path, isMap);
		return new Proxy(target, makeCollectionTrap(methods, path));
	});
}
function makeStateProxy(obj, component, path = '') {
	return cachedProxy(component.proxyCache, obj, path, () => {
		return new Proxy(obj, {
			get(target, key) {
				if (isSymbol(key)) {
					return Reflect.get(target, key);
				}
				const propertyValue = Reflect.get(target, key);
				const nestedPath = joinPath(path, key);
				if (isPlainObject(propertyValue) || isArray(propertyValue)) {
					return makeStateProxy(propertyValue, component, nestedPath);
				}
				if (propertyValue instanceof Set) {
					return makeCollectionProxy(propertyValue, component, nestedPath, false);
				}
				if (propertyValue instanceof Map) {
					return makeCollectionProxy(propertyValue, component, nestedPath, true);
				}
				return propertyValue;
			},
			set(target, key, value) {
				const fullPath = joinPath(path, key);
				if (isDev() && plainEqual(target[key], value)) {
					Logger.debug('state', () => {
						return `[${component.tagName}] wasted set on "${fullPath}" — value is structurally equal to current; consider guarding the assignment.`;
					});
				}
				Reflect.set(target, key, value);
				notifyStateChange(component, fullPath);
				return true;
			},
			deleteProperty(target, key) {
				if (!hasOwn(target, key)) {
					return true;
				}
				const fullPath = joinPath(path, key);
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
	if (plainEqual(this.STATE, state)) {
		return Promise.resolve();
	}
	this.STATE = isPlainObject(state) ? {
		...state,
	} : {};
	this.proxyCache = new WeakMap();
	this.stateBus = null;
	this.stateProxy = makeStateProxy(this.STATE, this);
	this.templateBuilt = false;
	notifyStateChange(this, '');
	return this.updateView();
}
export function watchState(key, handler) {
	const statePath = String(key ?? '');
	const bus = ensureBus(this);
	let previousValue = getValueAtPath(this.STATE, statePath);
	return bus.subscribe(statePath, (nextValue, changedPath) => {
		const result = handler(nextValue, previousValue, changedPath);
		previousValue = nextValue;
		return result;
	});
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
