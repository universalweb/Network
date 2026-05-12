import { isString } from '../utilities.js';
const REF_NAME_RE = /^[a-z_][a-z0-9_]*$/;
const FINALIZER = new FinalizationRegistry(({ map, name }) => {
	if (map[name]?.deref() === undefined) {
		delete map[name];
	}
});
const REFS_HANDLER = {
	get(map, prop) {
		if (!isString(prop)) {
			return undefined;
		}
		return map[prop]?.deref();
	},
	has(map, prop) {
		if (!isString(prop)) {
			return false;
		}
		return map[prop]?.deref() !== undefined;
	},
};
export function isValidRefName(name) {
	return REF_NAME_RE.test(name);
}
export function registerRef(component, name, el) {
	const map = (component.refsMap ??= Object.create(null));
	const ref = new WeakRef(el);
	map[name] = ref;
	const token = {};
	FINALIZER.register(el, {
		map,
		name,
	}, token);
	return () => {
		FINALIZER.unregister(token);
		if (map[name] === ref) {
			delete map[name];
		}
	};
}
export function getRef(component, name) {
	return component.refsMap?.[name]?.deref();
}
export function makeRefsProxy(component) {
	return new Proxy((component.refsMap ??= Object.create(null)), REFS_HANDLER);
}
