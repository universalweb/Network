import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function fetchRequest(path, options = {}) {
	info(`FETCH => ${path}`);
	options.method = 'get';
	const request = await this.request('get', path, options);
	return request.send();
}
