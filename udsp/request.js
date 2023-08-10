import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function request(method = 'get', endpoint, data, options = {}) {
	info(`Request Function: ${method || 'get'} ${data.path}`);
	const ask = this.ask(method, endpoint, data, options);
	console.log(data, ask);
	return ask;
}
