import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export function request(data, options) {
	const target = {
		data
	};
	if (options) {
		if (isString(options)) {
			target.method = options;
		} else {
			if (options.method) {
				target.method = options.method;
			}
			if (options.head) {
				target.head = options.head;
			}
		}
	}
	info(`Request Function: ${target.method}`);
	const ask = this.ask(target, options);
	console.log(target, ask);
	return ask;
}
