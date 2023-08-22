import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
export async function get(path, parameters, data, headers, options) {
	info(`POST => ${path}`);
	const request = await this.request('get', path, parameters, data, headers, options);
	return request.send();
}
