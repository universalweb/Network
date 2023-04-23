import {
	isPlainObject,
	each,
	isArray,
	assign
} from 'Acid';
import { imported } from '#logs';
imported('SERVER APP API');
async function add(api, methodName, method) {
	api.set(methodName, method);
	console.log('Extended App API', methodName);
}
export async function addApi(methodName, method) {
	const { app: { api } } = this;
	if (isPlainObject(methodName)) {
		return each(methodName, (childMethod, childMethodName) => {
			add(api, childMethodName, childMethod);
		});
	}
	return add(api, methodName, method);
}
async function remove(api, method, methodName) {
	api.delete(methodName);
}
export async function removeApi(methods) {
	const { app: { api } } = this;
	if (isPlainObject(methods)) {
		return each(methods, (method, methodName) => {
			remove(api, methodName);
		});
	}
	if (isArray(methods)) {
		return each(methods, (methodName) => {
			remove(api, methodName);
		});
	}
	return remove(api, methods);
}
