import {
	promise, assign, omit, eachArray,
	stringify, get, isBuffer,
	isPlainObject, isArray, isMap, construct,
	each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed,
	info,
	msgReceived,
	msgSent
} from '#logs';
import { Base } from '../base.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ServerRequest extends Base {
	constructor(path, options = {}) {
		super(path, options);
	}
	isRequest = true;
	isServerRequest = true;
}
objectGetSetMethods.attachMethods(ServerRequest);
export async function uwServerRequestObject(source) {
	return construct(ServerRequest, omit);
}
