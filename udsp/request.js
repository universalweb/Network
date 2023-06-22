import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct, omit } from '@universalweb/acid';
import { Ask } from './ask.js';
imported('Request');
export async function request(act, body, options = {}) {
	const source = this;
	const {
		headers,
		footer,
		head
	} = options;
	info(`Request Function: ${act}`);
	const message = {
		act
	};
	if (body) {
		message.body = body;
	}
	if (head) {
		message.head = head;
	}
	const ask = construct(Ask, [{
		message,
		headers,
		footer,
		options: omit(options, ['footer', 'headers']),
		source
	}]);
	return ask.fetch();
}
