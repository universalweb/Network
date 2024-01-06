import {
	construct,
	isPlainObject,
	isString,
	promise
} from '@universalweb/acid';
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import { getMethodId } from '../methods.js';
// If path arg has params in it then paramArg becomes dataArg
// params support both Complex Data Binary Supported Params and simple traditional URL percent encoded params
export async function uwRequest(methodArg, pathArg, paramArg, dataArg, headersArg, optionsArg) {
	let method = getMethodId(methodArg);
	let path = pathArg;
	let params = paramArg;
	let data = dataArg;
	let options = optionsArg;
	let head = headersArg;
	if (isPlainObject(methodArg)) {
		options = methodArg.options;
		data = methodArg.data || methodArg.body;
		path = methodArg.path;
		method = methodArg.method;
		head = methodArg.head || methodArg.headers;
		params = methodArg.param || methodArg.params;
	}
	info(`Request Function: ${method} ${path}`);
	const ask = await this.ask(method, path, params, data, head, options);
	console.log(data, ask);
	return ask;
}
