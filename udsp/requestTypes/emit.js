import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
// To send a request but only receive AN ACKNOWLEDGEMENT
export async function emit(endpoint, data, headers, options) {
	info(`emit => ${endpoint}`);
	const request = await this.request('post', endpoint, data, headers, options);
	return request.send();
}
