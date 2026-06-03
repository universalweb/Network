import { isString } from '../utilities.js';
const REF_NAME_RE = /^[a-z_][a-z0-9_]*$/;
/*
 * refsMap is a Map<refName, WeakRef<Element>>. Map gives us a real `.delete()`
 * method (no `delete` keyword), stable iteration, and avoids the dictionary-
 * mode deopt that a churning plain object would hit.
 */
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
export function isValidRefName(refName) {
	return REF_NAME_RE.test(refName);
}
export function registerRef(component, refName, el) {
	const map = ensureRefsMap(component);
	const ref = new WeakRef(el);
	map.set(refName, ref);
	const token = {};
	FINALIZER.register(el, {
		map,
		name: refName,
	}, token);
	return () => {
		FINALIZER.unregister(token);
		if (map.get(refName) === ref) {
			map.delete(refName);
		}
	};
}
export function getRef(component, refName) {
	return component.refsMap?.get(refName)?.deref();
}
export function makeRefsProxy(component) {
	return new Proxy(ensureRefsMap(component), REFS_HANDLER);
}
