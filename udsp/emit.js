import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
// To send a request but only receive AN ACKNOWLEDGEMENT
export async function emit(endpoint, data, options = {}) {
	info(`emit => ${endpoint}`);
	options.method = 'post';
	options.method = 'post';
	const source = data;
	const request = await this.request(source, options);
	return request.send();
}
