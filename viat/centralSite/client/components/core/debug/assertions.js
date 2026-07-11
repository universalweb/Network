import {
	isArray, isCSSStyleSheet, isFunction, isObject, isPromiseLike, isString,
} from '../utilities.js';
export function isComponentConfig(config) {
	return isObject(config) && !isArray(config) && !isPromiseLike(config) && !isFunction(config.replaceSync);
}
export function assertStaticStyleEntry(styleName, value, className) {
	if (value === undefined || value === null) {
		return;
	}
	if (isCSSStyleSheet(value)) {
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
	const keysLength = keys.length;
	for (let index = 0; index < keysLength; index++) {
		assertStaticStyleEntry(keys[index], styles[keys[index]], className);
	}
}
