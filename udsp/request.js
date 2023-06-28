import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export function request(data, options) {
	let target = data;
	if (isString(options)) {
		target = {
			method: options,
			data
		};
	}
	info(`Request Function: ${target.method}`);
	const ask = this.ask(target, options);
	console.log(target, ask);
	return ask;
}
