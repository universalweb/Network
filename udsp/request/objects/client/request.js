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
export class ClientRequest extends Base {
	constructor(config) {
		super(config);
	}
	isRequest = true;
	isServerRequest = true;
}
objectGetSetMethods.attachMethods(ClientRequest);
export function clientRequestObject(source) {
	return construct(ClientRequest, [source]);
}
