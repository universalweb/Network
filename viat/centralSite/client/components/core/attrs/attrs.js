export function writeHostAttr(host, key, value) {
	if (value == null || value === false) {
		host.removeAttribute(key);
		return;
	}
	if (value === true) {
		host.setAttribute(key, '');
		return;
	}
	host.setAttribute(key, String(value));
}
export function readHostAttr(host, key, defaultValue) {
	if (typeof defaultValue === 'boolean') {
		return host.hasAttribute(key);
	}
	const rawValue = host.getAttribute(key);
	if (rawValue == null) {
		return defaultValue;
	}
	if (typeof defaultValue === 'number') {
		return Number(rawValue);
	}
	return rawValue;
}
export function makeAttrsProxy(host, schema) {
	return new Proxy({}, {
		get(target, key) {
			if (typeof key === 'symbol' || !(key in schema)) {
				return undefined;
			}
			return readHostAttr(host, key, schema[key]);
		},
		set(target, key, value) {
			if (typeof key === 'symbol' || !(key in schema)) {
				return true;
			}
			writeHostAttr(host, key, value);
			return true;
		},
		has(target, key) {
			return key in schema;
		},
		ownKeys() {
			return Object.keys(schema);
		},
		getOwnPropertyDescriptor(target, key) {
			if (key in schema) {
				return {
					configurable: true,
					enumerable: true,
				};
			}
			return undefined;
		},
	});
}
