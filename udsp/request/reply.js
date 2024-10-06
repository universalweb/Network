import { askRPC, replyRPC } from './rpc/rpcCodes.js';
/*
	* Server side client request
	* Server receives a request from a client & creates a request and response object to pass along to the endpoint
*/
import {
	assign,
	construct,
	eachArray,
	get,
	hasValue,
	isArray,
	isBuffer,
	isEmpty,
	objectSize,
	promise,
	stringify
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import {
	failed,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { Base } from './base.js';
import { flushOutgoing } from './flush.js';
import { numberEncodedSize } from './numberEncodedSize.js';
import { processEvent } from '#server/processEvent';
import { serverRequestObject } from './objects/server/request.js';
import { serverResponseObject } from './objects/server/response.js';
/**
 * @todo
 */
export class Reply extends Base {
	constructor(frame, header, source) {
		super(source);
		console.log('Setting up new reply', frame);
		const id = frame[0];
		if (!hasValue(id)) {
			console.trace('Catastrophic error no stream id in frame');
			this.destroy('No stream id in frame');
			return false;
		}
		this.id = id;
		const { requestQueue, } = source;
		this.streamIdSize = numberEncodedSize(id);
		this.maxFrameSize = source.destination.maxFrameSize;
		this.request = serverRequestObject({
			source: this,
		});
		this.response = serverResponseObject({
			source: this,
		});
		requestQueue.set(id, this);
	}
	isReply = true;
	async completeReceived() {
		this.setState(replyRPC.received);
		this.clearSendDataReadyTimeout();
		await processEvent(this.request, this.response, this.source().server());
	}
	static type = 'reply';
}
export function reply(...args) {
	// console.log(client);
	return construct(Reply, args);
}
