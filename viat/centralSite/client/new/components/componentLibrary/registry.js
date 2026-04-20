const store = new Map();
const toCamel = (s) => {
	return s.replace(/-([a-z])/g, (_, c) => {
		return c.toUpperCase();
	});
};
const toKebab = (s) => {
	return s.replace(/[A-Z]/g, (c) => {
		return `-${c.toLowerCase()}`;
	});
};
export const registry = new Proxy(store, {
	get(target, prop) {
		if (typeof prop !== 'string') {
			return Reflect.get(target, prop);
		}
		return target.get(prop) ?? target.get(toKebab(prop));
	},
	set(target, prop, value) {
		target.set(prop, value);
		return true;
	},
	has(target, prop) {
		return target.has(prop) || target.has(toKebab(prop));
	},
});
export function register(component) {
	const key = component.getAttribute('name') || component.id || component.localName;
	store.set(key, component);
	store.set(toCamel(key), component);
}
export function unregister(component) {
	const key = component.getAttribute('name') || component.id || component.localName;
	if (store.get(key) === component) {
		store.delete(key);
	}
	const camel = toCamel(key);
	if (store.get(camel) === component) {
		store.delete(camel);
	}
}
