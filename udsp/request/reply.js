/*
	* Server side client request
	* Server receives a request from a client & creates a request and response object to pass along to the endpoint
*/
import {
	isEmpty, isBuffer, promise, eachArray, assign, construct, stringify, hasValue, get, objectSize, isArray
} from '@universalweb/acid';
import { decode, encode } from '#utilities/serialize';
import {
	success, failed, info, msgReceived, msgSent
} from '#logs';
import { processEvent } from '#server/processEvent';
import { Base } from './base.js';
import { numberEncodedSize } from './numberEncodedSize.js';
import { flushOutgoing } from './flush.js';
import { serverRequestObject } from './objects/server/request.js';
import { serverResponseObject } from './objects/server/response.js';
/**
	* @todo
*/
export class Reply extends Base {
	constructor(frame, header, source) {
		super(source);
		console.log('Setting up new reply', frame);
		const thisReply = this;
		const id = frame[0];
		if (!hasValue(id)) {
			console.trace('Catastrophic error no stream id in frame');
			this.destroy('No stream id in frame');
			return false;
		}
		this.id = id;
		const { requestQueue, } = source;
		this.events = source.events;
		this.requestMethods = source.requestMethods;
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
	type = 'reply';
	isReply = true;
	async completeReceived() {
		this.state = 1;
		await processEvent(this.request, this.response, this);
	}
}
export function reply(...args) {
	// console.log(client);
	return construct(Reply, args);
}
