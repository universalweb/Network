import {
	construct,
	hasValue,
	isTrue,
	jsonParse,
	noValue
} from '@universalweb/acid';
import { Base } from '../base.js';
import { decode } from '#utilities/serialize';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ServerResponse extends Base {
	// constructor(config) {
	// 	super(config);
	// }
	isResponse = true;
	isClientResponse = true;
	send(data) {
		this.sent = true;
		return this.source().send(data);
	}
	setHeader(headerName, headerValue) {
		return this.source().setHeader(headerName, headerValue);
	}
	setHeaders(target) {
		return this.source().setHeaders(target);
	}
}
objectGetSetMethods.attachMethods(ServerResponse);
export function serverResponseObject(source) {
	return construct(ServerResponse, [source]);
}
