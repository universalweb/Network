import { Logger } from '../debug/logger.js';
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
	Logger.debug('registry', 'register', key);
	store.set(key, component);
}
export function unregister(component) {
	const key = getRegistryKey(component);
	if (!key) {
		return;
	}
	if (store.get(key) === component) {
		store.delete(key);
	}
}
