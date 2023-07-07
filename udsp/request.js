import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export function request(dataArg, options) {
	const data = (isString(dataArg)) ? {
		path: dataArg
	} : dataArg;
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
