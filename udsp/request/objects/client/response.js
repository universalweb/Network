import {
	jsonParse, isTrue, construct, hasValue, noValue
} from '@universalweb/acid';
import { decode } from 'msgpackr';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
import { Base } from '../base.js';
import { objectDataMethods } from '../dataMethods.js';
export class ClientResponse extends Base {
	construct(source, options) {
		super(source, options);
	}
	isResponse = true;
	isServerResponse = true;
}
objectGetSetMethods.attachMethods(ClientResponse);
objectDataMethods.attachMethods(ClientResponse);
export function clientResponse(...args) {
	return construct(ClientResponse, args);
}
