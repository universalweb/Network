import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct } from 'Acid';
import { Ask } from './ask.js';
imported('Request');
export async function request(payload, sendAsIs) {
	const thisClient = this;
	info(`Requested ${payload}`);
	const ask = await (construct(Ask, [payload, thisClient]));
	return ask;
}
