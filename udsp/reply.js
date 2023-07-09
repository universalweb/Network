import {
	isEmpty, isBuffer, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize
} from '@universalweb/acid';
import { decode, encode } from 'msgpackr';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#udsp/processEvent';
import { Base } from './request/base.js';
/**
	* @todo Add promise to send use the method that Ask uses assign the accept, return it, and when completed execute.
*/
export class Reply extends Base {
	constructor(request, source) {
		super(request, source);
		const thisReply = this;
		const { message } = request;
		const { sid } = message;
		// console.log(source);
		// // console.log(message);
		const {
			queue,
			packetIdGenerator
		} = source;
		const server = source.server();
		this.server = function() {
			return server;
		};
		this.sid = sid;
		this.id = sid;
		this.packetTemplate.sid = sid;
		this.response.sid = sid;
		source.lastActive = Date.now();
		queue.set(sid, this);
		this.onPacket(message);
	}
	isReply = true;
	async complete() {
		this.state = 1;
		await processEvent(this);
	}
}
export function reply(packet, client) {
	console.log(client);
	return construct(Reply, [packet, client]);
}
