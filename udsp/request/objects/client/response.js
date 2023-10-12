import {
	jsonParse, isTrue, construct, hasValue, noValue
} from '@universalweb/acid';
import { decode } from '#utilities/serialize';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
import { Base } from '../base.js';
import { objectDataMethods } from '../dataMethods.js';
export class ClientResponse extends Base {
	constructor(config) {
		super(config);
	}
	isResponse = true;
	isServerResponse = true;
}
objectGetSetMethods.attachMethods(ClientResponse);
objectDataMethods.attachMethods(ClientResponse);
export function clientResponseObject(source) {
	return construct(ClientResponse, [source]);
}
