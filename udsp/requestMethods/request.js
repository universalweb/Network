import {
	construct,
	isPlainObject,
	isString,
	promise,
} from '@universalweb/utilitylib';
import { getMethodId } from '../methods/index.js';
// If path arg has params in it then paramArg becomes dataArg
// params support both Complex Data Binary Supported Params and simple traditional URL percent encoded params
export async function uwRequest(methodArg, pathArg, paramArg, dataArg, headersArg, optionsArg) {
	console.trace();
	if (!this.destination.ip) {
		this.logInfo(`Can't send request - No Destination IP`);
		return this;
	}
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
	this.logInfo(`Request Function: ${method || 'UNDEFINED DEFAULT'} ${path}`);
	const ask = await this.ask(method, path, params, data, head, options);
	this.logInfo(data, ask);
	return ask;
}
