import {
	success, failed, imported, msgSent, info
} from '#logs';
import {
	promise, construct, isString, isPlainObject
} from '@universalweb/acid';
export async function request(methodArg, pathArg, dataArg, headersArg, optionsArg) {
	let method = methodArg;
	let path = pathArg;
	let data = dataArg;
	let options = optionsArg;
	let head = headersArg;
	if (isPlainObject(methodArg)) {
		options = methodArg.options;
		data = methodArg.data || methodArg.body;
		path = methodArg.path;
		method = methodArg.method;
		head = methodArg.head || methodArg.headers;
	}
	info(`Request Function: ${method || 'get'} ${path}`);
	const ask = this.ask(method, path, data, head, options);
	console.log(data, ask);
	return ask;
}
