import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct } from 'Acid';
import { Ask } from './ask.js';
imported('Request');
export async function request(message, sendAsIs) {
	const thisClient = this;
	info(`Requested Body`, message);
	const ask = await (construct(Ask, [message, thisClient]));
	return ask;
}
