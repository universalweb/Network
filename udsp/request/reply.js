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
	stringify,
} from '@universalweb/utilitylib';
import { decode, encode } from '#utilities/serialize';
import { Base } from './base.js';
import { flushOutgoing } from './flush.js';
import { numberEncodedSize } from './numberEncodedSize.js';
import { serverRequestObject } from './objects/server/request.js';
import { serverResponseObject } from './objects/server/response.js';
/**
 * @todo
 */
export class Reply extends Base {
	constructor(frame, header, source) {
		super(source);
		this.logInfo('Setting up new reply', frame);
		const id = frame[0];
		if (!hasValue(id)) {
			source.logError('Error no stream id in frame', frame);
			this.destroy('No stream id in frame');
			return false;
		}
		this.id = id;
		const { requestQueue } = source;
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
	async completeReceived() {
		await this.setState(replyRPC.received);
		await this.clearSendDataReadyTimeout();
		this.source.onRequest(this.request, this.response);
	}
	isReply = true;
	static type = 'reply';
}
export function reply(frame, header, source) {
	// this.logInfo(client);
	return new Reply(frame, header, source);
}
