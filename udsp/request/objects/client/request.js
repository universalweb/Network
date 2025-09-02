import {
	UniqID,
	assign,
	construct,
	each,
	eachArray,
	get,
	hasLength,
	hasValue,
	isArray,
	isBuffer,
	isMap,
	isPlainObject,
	omit,
	promise,
	stringify
} from '@universalweb/utilitylib';
import { decode, encode } from '#utilities/serialize';
import { Base } from '../base.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ClientRequest extends Base {
	// constructor(config) {
	// 	super(config);
	// }
	isRequest = true;
	isServerRequest = true;
}
objectGetSetMethods.attachMethods(ClientRequest);
export function clientRequestObject(source) {
	return construct(ClientRequest, [source]);
}
