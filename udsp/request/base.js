import { sendPacket } from './sendPacket.js';
import { destroy } from './destory.js';
import { bufferPacketization } from './bufferPacketization.js';
import { sendEnd } from './sendEnd.js';
import { on } from './on.js';
import { flushOutgoing, flushIncoming, flush } from './flush.js';
import { sendPacketsById } from './sendPacketsById.js';
import { sendAll } from './sendAll.js';
import { onPacket } from './onPacket.js';
import {
	isBuffer, isPlainObject, isString, promise, assign
} from '@universalweb/acid';
import { encode } from 'msgpackr';
import { request } from '#udsp/request';
import { assembleData } from './assembleData.js';
export class Base {
	constructor(options = {}, source) {
		const { events, } = options;
		const timeStamp = Date.now();
		this.created = timeStamp;
		this.source = function() {
			return source;
		};
		const { maxPacketSize } = source;
		if (events) {
			this.on(events);
		}
		if (maxPacketSize) {
			this.maxPacketSize = maxPacketSize;
		}
	}
	code(codeNumber) {
		const source = (this.isAsk) ? this.request : this.response;
		if (this.isAsk) {
			source.head.code = codeNumber;
		} else {
			source.head.code = codeNumber;
		}
	}
	setHeader(target) {
		const source = (this.isAsk) ? this.request : this.response;
		assign(source.head, target);
	}
	writeHeader(headerName, headerValue) {
		const source = (this.isAsk) ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		source.head[headerName] = headerValue;
	}
	dataToBuffer(data) {
		if (isBuffer(data)) {
			return data;
		}
		if (isPlainObject(data)) {
			this.contentType = 1;
			return encode(data);
		}
		return Buffer.from(data);
	}
	async assemble() {
		const { contentType } = this;
		if (this.data) {
			this.data = await assembleData(this.data, this.response, contentType);
			console.log('Assembled', this.data);
		}
		this.destroy();
		await this.accept(this);
	}
	async send() {
		const thisSource = this;
		const {
			packetTemplate,
			contentType,
			maxPacketSize,
			sid,
			isAsk,
			isReply
		} = this;
		const message = (isAsk) ? this.request : this.response;
		console.log(`${this.type}.send`, message);
		if (message.data) {
			if (!isBuffer(message.data)) {
				message.data = this.dataToBuffer(message.data);
			}
			this.totalReplyDataSize = request.data?.length;
		}
		if (this.contentType) {
			message.head.contentType = this.contentType;
		}
		// await bufferPacketization(this);
		const awaitingResult = promise((accept) => {
			thisSource.accept = accept;
		});
		console.log(`BASE ${this.type}`, this);
		this.sendAll();
		return awaitingResult;
	}
	destroy = destroy;
	sendEnd = sendEnd;
	sendPacketsById = sendPacketsById;
	sendAll = sendAll;
	onPacket = onPacket;
	sendPacket = sendPacket;
	bufferPacketization = bufferPacketization;
	on = on;
	currentPayloadSize = 0;
	totalReceivedUniquePackets = 0;
	totalIncomingUniquePackets = 0;
	progress = 0;
	request = {
		head: {},
		body: {}
	};
	response = {
		head: {},
		body: {}
	};
	// this is the data in order may have missing packets at times but will remain in order
	data = [];
	// This is as the data came in over the wire out of order
	stream = [];
	events = {};
	header = {};
	options = {};
	outgoingPackets = [];
	incomingPackets = [];
	incomingAks = [];
	incomingNacks = [];
	outgoingAcks = [];
	outgoingNacks = [];
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
	packetTemplate = {};
}
