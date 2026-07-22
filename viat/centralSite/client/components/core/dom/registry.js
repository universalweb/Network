import { defaultLogger } from '../debug/logger.js';
import { isString } from '../utilities.js';
const store = new Map();
function getRegistryKey(component) {
	return component.id || null;
}
export const registry = new Proxy(store, {
	get(target, prop) {
		if (!isString(prop)) {
			return Reflect.get(target, prop);
		}
		return target.get(prop);
	},
	set(target, prop, value) {
		target.set(prop, value);
		return true;
	},
	has(target, prop) {
		return target.has(prop);
	},
});
export function register(component) {
	const key = getRegistryKey(component);
	if (!key) {
		return;
	}
	// Pin the key used at register time — id may change before unregister.
	component.registryKey = key;
	if (defaultLogger.debugOn) {
		defaultLogger.debug('registry', `${component.constructor.name}<${component.localName}>`, key);
	}
	store.set(key, component);
}
export function unregister(component) {
	const key = component.registryKey;
	if (!key) {
		return;
	}
	if (store.get(key) === component) {
		store.delete(key);
	}
	component.registryKey = null;
}
