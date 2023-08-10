import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
// To send a request but only receive AN ACKNOWLEDGEMENT
export async function emit(url, data, options = {}) {
	info(`emit => ${url}`);
	options.method = 'post';
	const source = {
		url,
		data
	};
	const request = await this.request(source, options);
	return request.send();
}
