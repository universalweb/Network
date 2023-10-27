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
export class Ask extends Base {
	constructor(method = 'get', path, parameters, data, head, options = {}, source) {
		super(source);
		const {
			requestQueue,
			streamIdGenerator,
			destination
		} = source;
		console.log('Ask', path);
		const id = streamIdGenerator.get();
		const methodSanitized = method.toLowerCase();
		this.id = id;
		this.method = method;
		if (parameters) {
			this.parameters = parameters;
		}
		if (path) {
			this.path = path;
		}
		this.maxFrameSize = destination.maxFrameSize;
		this.request = clientRequestObject({
			data,
			head,
			source: this,
		});
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
