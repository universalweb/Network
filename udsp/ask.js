import {
	promise, assign, omit,
	eachArray, stringify,
	get,
	isBuffer, isPlainObject,
	isArray, isMap, construct,
	each, hasLength,
	hasValue
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	failed, info, msgReceived, msgSent
} from '#logs';
import { Base } from './request/base.js';
import { request } from '#udsp/request';
export class Ask extends Base {
	constructor(requestObject, options = {}, source) {
		super(options, source);
		const {
			queue,
			packetIdGenerator,
		} = source;
		const {
			data,
			method = 'get'
		} = requestObject;
		const head = requestObject.head || requestObject.headers || options.head || options.headers || {};
		console.log('Ask', requestObject);
		const streamId = packetIdGenerator.get();
		this.request.sid = streamId;
		this.packetTemplate.sid = streamId;
		this.request.method = method;
		this.method = method;
		this.id = streamId;
		if (data) {
			this.request.data = data;
		}
		if (head) {
			this.request.head = head;
		}
		queue.set(streamId, this);
	}
	complete() {
		console.log('Ask complete', this);
		if (this.state === 3) {
			this.state = 4;
		}
		this.accept(this);
	}
	isAsk = true;
	type = 'ask';
}
export async function ask(source) {
	return construct(Ask, omit);
}
