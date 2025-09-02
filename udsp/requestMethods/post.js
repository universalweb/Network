import { construct, isString, promise } from '@universalweb/utilitylib';
export async function post(path, data, parameters, headers, options) {
	this.logInfo(`POST => ${path}`);
	const request = await this.request(1, path, parameters, data, headers, options);
	return request.send();
}
