import { onMessage } from './onMessage.js';
import {
	isPlainObject,
	eachObjectAsync,
	isArray,
	eachAsync,
	assign
} from 'Acid';
import { imported } from 'utilities/logs.js';
imported('SERVER APP API');
async function add(app, methodName, method) {
	app.set(methodName, method);
	console.log('Extended App API', methodName);
}
export async function addApi(methodName, method) {
	const { app } = this;
	if (isPlainObject(methodName)) {
		return eachObjectAsync(methodName, (childMethod, childMethodName) => {
			add(app, childMethodName, childMethod);
		});
	}
	return add(app, methodName, method);
}
async function remove(app, method, methodName) {
	app.delete(methodName);
}
export async function removeApi(methods) {
	const { app } = this;
	if (isPlainObject(methods)) {
		return eachObjectAsync(methods, (method, methodName) => {
			remove(app, methodName);
		});
	}
	if (isArray(methods)) {
		return eachAsync(methods, (methodName) => {
			remove(app, methodName);
		});
	}
	return remove(app, methods);
}
