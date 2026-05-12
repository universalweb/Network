import { Logger, isDev } from '../debug/logger.js';
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
import { makePathBus } from './pathBus.js';
const STATE = {};
const proxyCache = new WeakMap();
let GLOBAL_STATE = null;
const bus = makePathBus({
	getValue: (path) => {
		return getValueAtPath(GLOBAL_STATE, path);
	},
});
function makeGlobalProxy(target, path = '') {
	if (!isPlainObject(target) && !isArray(target)) {
		return target;
	}
	return cachedProxy(proxyCache, target, path, () => {
		return new Proxy(target, {
			get(obj, key) {
				if (isSymbol(key)) {
					return Reflect.get(obj, key);
				}
				const propertyValue = Reflect.get(obj, key);
				const nestedPath = joinPath(path, key);
				if (isPlainObject(propertyValue) || isArray(propertyValue)) {
					return makeGlobalProxy(propertyValue, nestedPath);
				}
				return propertyValue;
			},
			set(obj, key, value) {
				const fullPath = joinPath(path, key);
				if (isDev() && plainEqual(obj[key], value)) {
					Logger.debug('globalState', () => {
						return `wasted set on "${fullPath}" — value is structurally equal to current; consider guarding the assignment.`;
					});
				}
				Reflect.set(obj, key, value);
				bus.notify(fullPath);
				return true;
			},
			deleteProperty(obj, key) {
				const fullPath = joinPath(path, key);
				const result = Reflect.deleteProperty(obj, key);
				if (result) {
					bus.notify(fullPath);
				}
				return result;
			},
		});
	});
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
