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
import { flushOutgoing, flushIncoming, flush } from './request/flush.js';
import { sendPacket } from './request/sendPacket';
import { destroy } from './request/destory';
import { bufferToOutgoingPackets } from './request/bufferToOutgoingPackets';
import { sendCompleted } from './request/sendCompleted';
import { on } from './request/on';
import { initiate } from './request/fetch';
const dataEncodingTypesChunked = /stream|file|image|string/;
const dataEncodingTypesStructured = /json|Packetpack|struct|/;
/**
 * @todo Prepare Request into singular object.
 * @todo Chunk body data while adding packit number to it.
 * @todo Send all chunks (consider sending pkt1 twice).
 * @todo
 */
export class Ask {
	constructor(config) {
		const {
			message,
			head,
			body,
			options,
			source,
			headers,
			footer,
			sourceContext,
		} = config;
		const thisAsk = this;
		const {
			queue,
			packetIdGenerator,
			maxPacketSize,
			isClient
		} = source;
		let request;
		if (message) {
			console.log('Message Ask', message);
			request = message;
		} else {
			request = {};
			if (head) {
				request.head = head;
			}
			if (body) {
				request.body = body;
			}
		}
		if (headers) {
			thisAsk.headers = headers;
		}
		if (footer) {
			thisAsk.footer = footer;
		}
		const timeStamp = Date.now();
		thisAsk.created = timeStamp;
		// sid is a Stream ID
		const streamId = packetIdGenerator.get();
		request.sid = streamId;
		this.request = request;
		this.id = streamId;
		if (options.dataEncoding) {
			this.dataEncoding = options.dataEncoding;
		}
		this.source = function() {
			return source;
		};
		const { onData, } = options;
		this.on({
			onData,
		});
		this.maxPacketSize = maxPacketSize;
		queue.set(streamId, thisAsk);
		return thisAsk;
	}
	destroy = destroy;
	sendCompleted = sendCompleted;
	sendPacket = sendPacket;
	bufferToOutgoingPackets = bufferToOutgoingPackets;
	on = on;
	fetch = initiate;
	currentPayloadSize = 0;
	progress = 0;
	isAsk = true;
	type = 'ask';
	request = {};
	response = {};
	// this is the data in order may have missing packets at times but will remain in order
	data = [];
	// This is as the data came in over the wire out of order
	stream = [];
	events = {};
	headers = {};
	options = {};
	outgoingPackets = [];
	incomingPackets = [];
	incomingAks = [];
	incomingNacks = [];
	outgoingAcks = [];
	outgoingNacks = [];
	totalReceivedUniquePackets = 0;
	totalOutgoingPackets = 0;
	totalOutgoingPayloadSize = 0;
	// Must be checked for uniqueness
	totalSentConfirmedPackets = 0;
	totalIncomingPayloadSize = 0;
	// Must be checked for uniqueness
	totalReceivedPackets = 0;
	/* `state = 0;` is initializing the `state` property of the `Ask` class to `0`. This property is used
	to keep track of the state of the request, where `0` represents an unsent request, `1` represents a
	request that is currently being sent, and `2` represents a completed request. */
	state = 0;
}
export async function ask(source) {
	return construct(Ask, omit);
}
