import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
export async function post(path, data, headers, options) {
	info(`POST => ${path}`);
	const request = await this.request('post', path, data, headers, options);
	return request.send();
}
