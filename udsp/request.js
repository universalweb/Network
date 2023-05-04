import {
	success, failed, imported, msgSent, info
} from '#logs';
import { promise, construct } from 'Acid';
import { Ask } from './ask.js';
imported('Request');
export async function request(payload, sendAsIs) {
	const thisContext = this;
	info(`Requested ${payload}`);
	const ask = await (construct(Ask, [payload, thisContext]));
	return ask;
}
