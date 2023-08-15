import {
	promise, assign, omit, eachArray, stringify, get, isBuffer, isPlainObject, isArray, isMap, construct, each, hasLength, hasValue, UniqID
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed, info, msgReceived, msgSent
} from '#logs';
import { Base } from './base.js';
import { request } from '#udsp/requestTypes/request';
export class Ask extends Base {
	constructor(method = 'get', path, params, data, head, options = {}, source) {
		super(options, source);
		const {
			requestQueue,
			streamIdGenerator,
		} = source;
		console.log('Ask', data);
		const streamId = streamIdGenerator.get();
		const methodSanitized = method.toLowerCase();
		this.request.streamId = streamId;
		this.request.method = methodSanitized;
		this.method = methodSanitized;
		this.id = streamId;
		if (path) {
			this.request.path = path;
			this.path = path;
			this.pathSize = path.length;
		}
		if (params) {
			this.request.params = params;
			this.params = params;
		}
		if (data) {
			this.request.data = data;
		}
		if (head) {
			this.request.head = head;
		}
		requestQueue.set(streamId, this);
	}
	completeReceived() {
		console.log('Ask complete', this);
		if (this.state === 3) {
			this.state = 4;
		}
		this.readyState = 4;
		this.accept(this);
	}
	isAsk = true;
	type = 'ask';
	request = {};
}
export async function ask(source) {
	return construct(Ask, omit);
}
