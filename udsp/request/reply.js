import {
	isEmpty, isBuffer, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize, isArray
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#udsp/processEvent';
import { Base } from './base.js';
/**
	* @todo
*/
export class Reply extends Base {
	constructor(request, source) {
		super(request, source);
		console.log('Setting up new reply');
		const thisReply = this;
		const { message } = request;
		if (!message.frame) {
			return this.destroy('No frame in message');
		}
		const id = (isArray(message?.frame)) ? message.frame[0] : message.frame;
		this.id = id;
		const { replyQueue, } = source;
		this.events = source.events;
		this.actions = source.actions;
		// console.log(source);
		// // console.log(message);
		this.response.streamId = id;
		replyQueue.set(id, this);
	}
	type = 'reply';
	isReply = true;
	async completeReceived() {
		this.state = 1;
		await processEvent(this);
	}
	response = {};
	request = {};
}
export function reply(packet, client) {
	// console.log(client);
	return construct(Reply, [packet, client]);
}
