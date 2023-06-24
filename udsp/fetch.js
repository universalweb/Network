import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function fetchRequest(source, options) {
	const method = options?.method || (isString(options) && options) || 'get';
	const payload = (isString(source)) ? {
		path: source
	} : source;
	info(`Request then Fetch Function ${method}`);
	const requestObject = {
		method,
		data: payload
	};
	const request = await this.request(requestObject, options);
	return request.send();
}
