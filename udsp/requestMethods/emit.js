import { construct, isString, promise } from '@universalweb/acid';
import {
	failed,
	imported,
	info,
	msgSent,
	success
} from '#logs';
// To send a request but only receive AN ACKNOWLEDGEMENT
export async function emit(endpoint, data, parameters, headers, options) {
	info(`emit => ${endpoint}`);
	const request = await this.request('emit', endpoint, parameters, data, headers, options);
	return request.send();
}
