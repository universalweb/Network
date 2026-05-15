import {
	cachedProxy,
	eachObject,
	getValueAtPath,
	isArray,
	isPlainObject,
	isSymbol,
	joinPath,
	plainEqual,
	setValueAtPath,
} from '../utilities.js';
import { Logger } from '../debug/logger.js';
import { makePathBus } from './pathBus.js';
const STATE = {};
const proxyCache = new WeakMap();
let GLOBAL_STATE = null;
const bus = makePathBus({
	getValue: (path) => {
		return getValueAtPath(GLOBAL_STATE, path);
	},
});
function reportWastedGlobalSet(obj, key, value, fullPath) {
	if (!plainEqual(obj[key], value)) {
		return null;
	}
	return `wasted set on "${fullPath}" — new value is structurally equal to current but a different reference; reuse the existing reference to avoid re-render.`;
}
// Same monomorphization rationale as StateProxyHandler: prototype-shared traps,
// one tiny handler instance per proxy, no per-instance closures.
class GlobalProxyHandler {
	constructor(path) {
		this.path = path;
	}
	static create(target, path = '') {
		if (!isPlainObject(target) && !isArray(target)) {
			return target;
		}
		return cachedProxy(proxyCache, target, path, () => {
			return new Proxy(target, new GlobalProxyHandler(path));
		});
	}
	get(obj, key) {
		if (isSymbol(key)) {
			return Reflect.get(obj, key);
		}
		const propertyValue = Reflect.get(obj, key);
		const nestedPath = joinPath(this.path, key);
		if (isPlainObject(propertyValue) || isArray(propertyValue)) {
			return GlobalProxyHandler.create(propertyValue, nestedPath);
		}
		return propertyValue;
	}
	set(obj, key, value) {
		if (obj[key] === value) {
			return true;
		}
		const fullPath = joinPath(this.path, key);
		Logger.perf('globalState', reportWastedGlobalSet, obj, key, value, fullPath);
		Reflect.set(obj, key, value);
		bus.notify(fullPath);
		return true;
	}
	deleteProperty(obj, key) {
		const fullPath = joinPath(this.path, key);
		const result = Reflect.deleteProperty(obj, key);
		if (result) {
			bus.notify(fullPath);
		}
		return result;
	}
}
GLOBAL_STATE = GlobalProxyHandler.create(STATE);
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
	return bus.subscribe(key, (value, changedPath) => {
		return cb(value, GLOBAL_STATE, changedPath);
	});
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
