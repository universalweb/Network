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
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import { Base } from '../base.js';
import { objectDataMethods } from '../dataMethods.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ServerRequest extends Base {
	// constructor(config) {
	// 	super(config);
	// }
	isRequest = true;
	isServerRequest = true;
}
objectGetSetMethods.attachMethods(ServerRequest);
objectDataMethods.attachMethods(ServerRequest);
export function serverRequestObject(source) {
	return new ServerRequest(source);
}
