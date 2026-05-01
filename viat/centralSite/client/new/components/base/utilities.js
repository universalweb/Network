export function isObject(value) {
	return value !== null && typeof value === 'object';
}
export function isPlainObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
export function isString(value) {
	return typeof value === 'string';
}
export function isFunction(value) {
	return typeof value === 'function';
}
export function isSymbol(value) {
	return typeof value === 'symbol';
}
export function isElement(value) {
	return value instanceof Element;
}
export function isShadowRoot(value) {
	return value instanceof ShadowRoot;
}
export function isPromiseLike(value) {
	return value !== null && typeof value === 'object' && isFunction(value.then);
}
export function isError(value) {
	return value instanceof Error;
}
export function isUndefined(value) {
	return value === undefined;
}
export function isNull(value) {
	return value === null;
}
export function noValue(value) {
	return Boolean(isUndefined(value) || isNull(value));
}
export function hasValue(value) {
	return !noValue(value);
}
export function isArray(value) {
	return Array.isArray(value);
}
export function isEmpty(value) {
	if (isString(value)) {
		return value.trim() === '';
	}
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (isObject(value)) {
		return Object.keys(value).length === 0;
	}
	return false;
}
export function createElementFromHTML(htmlString) {
	const template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstElementChild;
}
export const callFn = (fn) => {
	fn();
};
export const eachArray = (arr, fn) => {
	for (let i = 0; i < arr.length; i++) {
		fn(arr[i], i);
	}
};
export const eachObject = (obj, fn) => {
	const keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		fn(keys[i], obj[keys[i]]);
	}
};
export const eachNodeList = (list, fn) => {
	for (let i = 0; i < list.length; i++) {
		fn(list[i], i);
	}
};
