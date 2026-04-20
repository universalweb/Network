export function isObject(value) {
	return value !== null && typeof value === 'object';
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
