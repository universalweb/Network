import {
	isArray, isFunction, isObject, isPromiseLike, isString,
} from '../utilities.js';
export function isComponentConfig(config) {
	return isObject(config) && !isArray(config) && !isPromiseLike(config) && !isFunction(config.replaceSync);
}
export function assertComponentConfig(config) {
	if (isComponentConfig(config)) {
		return;
	}
	throw new TypeError('WebComponent constructor expects a config object.');
}
export function assertStaticStyleEntry(styleName, value, className) {
	if (value === undefined || value === null) {
		return;
	}
	if (value instanceof CSSStyleSheet) {
		return;
	}
	if (isString(value)) {
		return;
	}
	throw new TypeError(`${className}.styles.${styleName} must be CSSStyleSheet | string | null | undefined.`);
}
export function assertStaticStyles(styles, className) {
	if (styles === undefined) {
		return;
	}
	if (!isObject(styles) || isArray(styles)) {
		throw new TypeError(`${className}.styles must be an object map of { name: CSSStyleSheet | string | null }.`);
	}
	const keys = Object.keys(styles);
	for (let i = 0; i < keys.length; i++) {
		assertStaticStyleEntry(keys[i], styles[keys[i]], className);
	}
}
