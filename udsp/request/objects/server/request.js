import {
	promise, assign, omit, eachArray,
	stringify, get, isBuffer,
	isPlainObject, isArray, isMap, construct,
	each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import {
	failed,
	info,
	msgReceived,
	msgSent
} from '#logs';
import { Base } from '../base.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
import { objectDataMethods } from '../dataMethods.js';
export class ServerRequest extends Base {
	constructor(config) {
		super(config);
	}
	isRequest = true;
	isServerRequest = true;
}
objectGetSetMethods.attachMethods(ServerRequest);
objectDataMethods.attachMethods(ServerRequest);
export function serverRequestObject(source) {
	return construct(ServerRequest, [source]);
}
