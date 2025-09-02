import { construct, isString, promise } from '@universalweb/utilitylib';
// To send a request but only receive AN ACKNOWLEDGEMENT
export async function emit(endpoint, data, parameters, headers, options) {
	this.logInfo(`emit => ${endpoint}`);
	const request = await this.request('emit', endpoint, parameters, data, headers, options);
	return request.send();
}
