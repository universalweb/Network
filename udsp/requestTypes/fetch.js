import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
export async function fetchRequest(path, config = {}) {
	info(`FETCH => ${path}`);
	const request = await this.request(config.method, path, config.data || config.body, config.head || config.headers, config.options);
	return request.send();
}
