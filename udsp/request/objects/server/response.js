import {
	jsonParse, isTrue, construct, hasValue, noValue
} from '@universalweb/acid';
import { decode } from 'msgpackr';
import { Base } from '../base.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ServerResponse extends Base {
	construct(source, options) {
		super(source, options);
	}
	isResponse = true;
	isClientResponse = true;
}
objectGetSetMethods.attachMethods(ServerResponse);
export function clientResponse(...args) {
	return construct(ServerResponse, args);
}
