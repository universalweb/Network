import {
	isArray, isFunction, isObject, isPromiseLike,
} from './utilities.js';
export function isComponentConfig(config) {
	return isObject(config) && !isArray(config) && !isPromiseLike(config) && !isFunction(config.replaceSync);
}
export function assertComponentConfig(config) {
	if (isComponentConfig(config)) {
		return;
	}
	throw new TypeError('WebComponent constructor expects a config object.');
}
export function assertComponentStyle(style, index) {
	if (style === undefined) {
		throw new TypeError(`WebComponent styles[${index}] is undefined.`);
	}
	if (style === null) {
		throw new TypeError(`WebComponent styles[${index}] is null.`);
	}
	if (!(style instanceof CSSStyleSheet)) {
		throw new TypeError(`WebComponent styles[${index}] must be a CSSStyleSheet.`);
	}
}
export function assertComponentStyles(styles) {
	if (styles === undefined) {
		return;
	}
	if (!isArray(styles)) {
		throw new TypeError('WebComponent config.styles must be an array of CSSStyleSheet instances.');
	}
	styles.forEach((style, index) => {
		assertComponentStyle(style, index);
	});
}
