import { isString } from '../utilities.js';
const REF_NAME_RE = /^[a-z_][a-z0-9_]*$/;
/*
 * refsMap is a Map<refName, WeakRef<Element>>. Map gives us a real `.delete()`
 * method (no `delete` keyword), stable iteration, and avoids the dictionary-
 * mode deopt that a churning plain object would hit.
 */
const FINALIZER = new FinalizationRegistry(({
	map, name: refName,
}) => {
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
/*
 * Entry object (not a per-ref closure) so full-teardown can null refsMap first
 * and skip map ops — only FINALIZER.unregister runs when the map is already gone.
 */
class RefEntry {
	constructor(component, refName, element) {
		this.component = component;
		this.refName = refName;
		this.ref = new WeakRef(element);
		this.token = {};
		const map = ensureRefsMap(component);
		map.set(refName, this.ref);
		FINALIZER.register(element, {
			map,
			name: refName,
		}, this.token);
	}
	unsubscribe() {
		FINALIZER.unregister(this.token);
		const map = this.component.refsMap;
		if (!map) {
			return;
		}
		if (map.get(this.refName) === this.ref) {
			map.delete(this.refName);
		}
	}
}
export function registerRef(component, refName, element) {
	return new RefEntry(component, refName, element);
}
export function getRef(component, refName) {
	return component.refsMap?.get(refName)?.deref();
}
export function makeRefsProxy(component) {
	return new Proxy(ensureRefsMap(component), REFS_HANDLER);
}
