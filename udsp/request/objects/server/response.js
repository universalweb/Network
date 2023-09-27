import {
	jsonParse, isTrue, construct, hasValue, noValue
} from '@universalweb/acid';
import { decode } from 'msgpackr';
import { Base } from '../base.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ServerResponse extends Base {
	constructor(config) {
		super(config);
	}
	isResponse = true;
	isClientResponse = true;
	send(data) {
		console.log(this.source());
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
