import { construct, isString, promise } from '@universalweb/acid';
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
import getMethod from '../methods/get.js';
export async function get(path, parameters, data, headers, options) {
	info(`POST => ${path}`);
	const request = await this.request(getMethod.id, path, parameters, data, headers, options);
	return request.send();
}
