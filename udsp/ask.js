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
export class Ask extends Base {
	constructor(requestObject, options = {}, source) {
		super(options, source);
		const {
			queue,
			packetIdGenerator,
			maxPacketSize,
		} = source;
		const {
			data,
			head,
			method
		} = requestObject;
		console.log('Ask', requestObject);
		const streamId = packetIdGenerator.get();
		this.request.sid = streamId;
		this.packetTemplate.sid = streamId;
		this.id = streamId;
		if (data) {
			this.request.data = data;
		}
		if (head) {
			this.request.head = head;
		}
		if (method) {
			this.request.method = method;
		}
		queue.set(streamId, this);
	}
	isAsk = true;
	type = 'ask';
}
export async function ask(source) {
	return construct(Ask, omit);
}
