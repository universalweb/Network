import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, isString } from '@universalweb/acid';
imported('Request');
export async function request(source, options) {
	if (options) {
		if (isString(options)) {
			source.method = options;
		}
		source.method = options.method;
	}
	info(`Request Function: ${source.method}`);
	const ask = this.ask(source, options);
	console.log(ask);
	return ask;
}
