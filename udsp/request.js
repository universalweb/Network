import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function request(dataArg, optionsArg = {}) {
	const data = (isString(dataArg)) ? {
		path: dataArg
	} : dataArg;
	const options = isString(optionsArg) ? {
		method: optionsArg
	} : optionsArg;
	if (!options.method) {
		options.method = 'get';
	}
	info(`Request Function: ${options.method || 'get'} ${data.path}`);
	const ask = this.ask(data, options);
	console.log(data, ask);
	return ask;
}
