import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
// If path arg has params in it then paramArg becomes dataArg
// params support both Complex Data Binary Supported Params and simple traditional URL percent encoded params
export async function fetchRequest(path, config = {}) {
	info(`FETCH => ${path}`);
	const request = await this.request(config.method, path, config.params || config.param,
		config.data || config.body, config.head || config.headers, config.options);
	return request.send();
}
