import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
// To send a request but only receive AN ACKNOWLEDGEMENT
export async function emit(endpoint, data, parameters, headers, options) {
	info(`emit => ${endpoint}`);
	const request = await this.request('emit', endpoint, parameters, data, headers, options);
	return request.send();
}
