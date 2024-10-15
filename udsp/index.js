import { client } from './client/index.js';
import { isString } from '@universalweb/acid';
import { logSystemInfo } from '../utilities/systemInfo.js';
import { uwrl } from './UWRL/index.js';
await logSystemInfo();
export async function request(method = 0, url, params, data) {
	const uwrlObject = isString(url) ? uwrl(url) : url;
	const uwClient = await client({
		url: uwrlObject,
		autoConnect: true
	});
	// console.log('uwClient', uwClient);
	const uwRequest = await uwClient.request(method, uwrlObject, params, data);
	// console.log('uwRequest', uwRequest);
	return uwRequest.send();
}
export async function get(url, params) {
	return request(0, url, params);
}
export async function uwfetch(url, config) {
	const uwrlObject = isString(url) ? uwrl(url) : url;
	const uwClient = await client({
		url: uwrlObject,
		autoConnect: true
	});
	return uwClient.fetch(uwrlObject, config).send();
}
export * from './client/index.js';
export * from './server/index.js';
export * from './app/index.js';
