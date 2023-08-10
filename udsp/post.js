import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function post(url, data, options = {}) {
	info(`POST => ${url}`);
	options.method = 'post';
	const source = {
		url,
		data,
	};
	const request = await this.request(source, options);
	return request.send();
}
