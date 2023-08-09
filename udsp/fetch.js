import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function fetchRequest(source, options = {}) {
	info(`FETCH => ${source}`);
	options.method = 'get';
	const request = await this.request(source, options);
	return request.send();
}
