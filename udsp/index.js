import { isString } from '@universalweb/acid';
import { client } from './client/index.js';
import { uwrl } from './UWRL/index.js';
export async function request(method = 'get', url, params, data) {
	const uwrlObject = isString(url) ? uwrl(url) : url;
	const uwClient = await client({
		url: uwrlObject
	});
	return uwClient.request(method, uwrlObject, params, data).send();
}
export async function get(url, params) {
	return request('get', url, params);
}
export * from './client/index.js';
export * from './server/index.js';
