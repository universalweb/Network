/*
	* Client side request
	* Client sends a request to the server & awaits a response if there is one
*/
import {
	promise, assign, omit, eachArray, stringify, get, isBuffer, isPlainObject, isArray, isMap, construct, each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import {
	failed, info, msgReceived, msgSent
} from '#logs';
import { Base } from './base.js';
import { clientResponseObject } from './objects/client/response.js';
import { clientRequestObject } from './objects/client/request.js';
import { objectGetSetMethods } from './objects/objectGetSetMethods.js';
import { getMethodId } from '../methods.js';
export class Ask extends Base {
	constructor(method = 0, path, parameters, data, head, options = {}, source) {
		super(source);
		const {
			requestQueue,
			streamIdGenerator,
			destination
		} = source;
		console.log('Ask', path);
		const id = streamIdGenerator.get();
		this.id = id;
		this.method = getMethodId(method);
		if (parameters) {
			this.parameters = parameters;
		}
		if (path) {
			this.path = path;
		}
		this.maxFrameSize = destination.maxFrameSize;
		const requestObject = {
			source: this
		};
		if (data) {
			requestObject.data = data;
		}
		if (head) {
			requestObject.head = head;
		}
		this.request = clientRequestObject(requestObject);
		this.response = clientResponseObject({
			source: this,
		});
		requestQueue.set(id, this);
	}
	completeReceived() {
		console.log('Ask complete', this);
		if (this.state === 3) {
			this.state = 4;
		}
		this.readyState = 4;
		this.flush();
		this.accept(this.response);
	}
	isAsk = true;
	type = 'ask';
}
export async function ask(source) {
	return construct(Ask, source);
}
