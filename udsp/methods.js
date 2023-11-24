import { isString } from '@universalweb/acid';
export const methods = {
	get: 0,
	post: 1,
};
export const methodsArray = ['get', 'post'];
export function getMethod(method) {
	if (isString(method)) {
		return methods[method.toLowerCase()];
	}
	return methods[method];
}
export function getMethodId(method) {
	if (isString(method)) {
		return methods[method.toLowerCase()];
	}
	return method;
}
