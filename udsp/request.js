import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct } from 'Acid';
import { Ask } from './ask.js';
imported('Request');
export async function request(message, options = {}) {
	const client = this;
	options.client = client;
	info(`Requested Body`, message);
	const ask = await (construct(Ask, [message, options]));
	return ask;
}
