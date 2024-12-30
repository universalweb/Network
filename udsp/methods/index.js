import getObject from './get.js';
import { isString } from '@universalweb/acid';
import postObject from './post.js';
export const methods = {};
export const methodNamesArray = [];
function addMethod(...sources) {
	if (sources.length > 1) {
		sources.forEach((item) => {
			addMethod(item);
		});
		return;
	}
	const source = sources[0];
	methods[source.name] = source.id;
	methodNamesArray[source.id] = source.name;
}
addMethod(getObject, postObject);
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
