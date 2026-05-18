import { isString } from '../utilities.js';
const REF_NAME_RE = /^[a-z_][a-z0-9_]*$/;
// refsMap is a Map<refName, WeakRef<Element>>. Map gives us a real `.delete()`
// method (no `delete` keyword), stable iteration, and avoids the dictionary-
// mode deopt that a churning plain object would hit.
const FINALIZER = new FinalizationRegistry(({ map, name: refName }) => {
	if (map.get(refName)?.deref() === undefined) {
		map.delete(refName);
	}
});
const REFS_HANDLER = {
	get(map, prop) {
		if (!isString(prop)) {
			return undefined;
		}
		return map.get(prop)?.deref();
	},
	has(map, prop) {
		if (!isString(prop)) {
			return false;
		}
		return map.get(prop)?.deref() !== undefined;
	},
};
function ensureRefsMap(component) {
	let map = component.refsMap;
	if (!map) {
		map = new Map();
		component.refsMap = map;
	}
	return map;
}
export function isValidRefName(name) {
	return REF_NAME_RE.test(name);
}
export function registerRef(component, name, el) {
	const map = ensureRefsMap(component);
	const ref = new WeakRef(el);
	map.set(name, ref);
	const token = {};
	FINALIZER.register(el, {
		map,
		name,
	}, token);
	return () => {
		FINALIZER.unregister(token);
		if (map.get(name) === ref) {
			map.delete(name);
		}
	};
}
export function getRef(component, name) {
	return component.refsMap?.get(name)?.deref();
}
export function makeRefsProxy(component) {
	return new Proxy(ensureRefsMap(component), REFS_HANDLER);
}
