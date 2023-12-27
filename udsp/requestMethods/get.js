import { construct, isString, promise } from '@universalweb/acid';
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
export async function get(path, parameters, data, headers, options) {
	info(`POST => ${path}`);
	const request = await this.request(0, path, parameters, data, headers, options);
	return request.send();
}
