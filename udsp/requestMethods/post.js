import { construct, isString, promise } from '@universalweb/acid';
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
export async function post(path, data, parameters, headers, options) {
	info(`POST => ${path}`);
	const request = await this.request(1, path, parameters, data, headers, options);
	return request.send();
}
