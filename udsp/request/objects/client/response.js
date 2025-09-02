import {
	construct,
	hasValue,
	isTrue,
	jsonParse,
	noValue,
} from '@universalweb/utilitylib';
import { Base } from '../base.js';
import { decode } from '#utilities/serialize';
import { objectDataMethods } from '../dataMethods.js';
import { objectGetSetMethods } from '../objectGetSetMethods.js';
export class ClientResponse extends Base {
	isResponse = true;
	isServerResponse = true;
}
objectGetSetMethods.attachMethods(ClientResponse);
objectDataMethods.attachMethods(ClientResponse);
export function clientResponseObject(source) {
	return construct(ClientResponse, [source]);
}
