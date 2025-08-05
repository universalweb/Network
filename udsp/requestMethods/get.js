import { construct, isString, promise } from '@universalweb/utilitylib';
import getMethod from '../methods/get.js';
export async function get(path, parameters, data, headers, options) {
	this.logInfo(`POST => ${path}`);
	const request = await this.request(getMethod.id, path, parameters, data, headers, options);
	return request.send();
}
