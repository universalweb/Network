import { sendPacket } from './sendPacket.js';
import { destroy } from './destory.js';
import { dataPacketization } from './dataPacketization.js';
import { sendEnd } from './sendEnd.js';
import { on } from './on.js';
import { flushOutgoing, flushIncoming, flush } from './flush.js';
import { sendPacketsById } from './sendPacketsById.js';
import { sendAll } from './sendAll.js';
import { onPacket } from './onPacket.js';
import {
	isBuffer, isPlainObject, isString, promise, assign,
	objectSize, eachArray, jsonParse
} from '@universalweb/acid';
import { encode, decode } from 'msgpackr';
import { request } from '#udsp/request';
import { assembleData } from './assembleData.js';
const singlePacketMethods = /^(connect|open)$/i;
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
	setHeaders(target) {
		const source = (this.isAsk) ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		assign(source.head, target);
	}
	writeHeader(headerName, headerValue) {
		const source = (this.isAsk) ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		source.head[headerName] = headerValue;
	}
	async assembleData() {
		const incomingPackets = this.incomingPackets;
		const data = [];
		eachArray(incomingPackets, (item) => {
			if (item.data) {
				data.push(item.data);
			}
		});
		this.data = Buffer.concat(data);
		if (this.head.serialization === 'struct') {
			this.data = decode(this.data);
		} else if (this.head.serialization === 'json') {
			this.data = jsonParse(this.data);
		}
	}
	async assembleHead() {
		const incomingPackets = this.incomingPackets;
		const head = [];
		eachArray(incomingPackets, (item) => {
			if (item.head) {
				head.push(item.head);
			}
		});
		this.head = decode(Buffer.concat(head));
	}
	toString() {
		return this.data.toString();
	}
	toJSON() {
		return jsonParse(this.data);
	}
	serialize() {
		return decode(this.data);
	}
	headers() {
		return this.head;
	}
	sendSetup() {
		this.send(this.outgoingSetupPacket);
	}
	buildSetupPacket() {
		const {
			packetTemplate,
			maxPacketSize,
			sid,
			isAsk,
			isReply
		} = this;
		this.outgoingSetupPacket.headerSize = this.outgoingHead.length;
	}
	async headPacketization() {
		const {
			maxPacketSize,
			id: sid,
			isAsk,
			outgoingPackets
		} = this;
		const message = (this.isAsk) ? this.request : this.response;
		this.outgoingHead = encode(message.head);
	}
	async dataPacketization() {
		const {
			packetTemplate,
			maxPacketSize,
			sid,
			isAsk,
			isReply
		} = this;
		const message = (isAsk) ? this.request : this.response;
		if (message.data) {
			this.outgoingBody = message.data;
			if (!isBuffer(message.data)) {
				this.writeHeader('serialization', 'struct');
				this.outgoingBody = encode(message.data);
			}
			this.writeHeader('dataSize', this.outgoingBody.length);
			await dataPacketization(this);
		}
	}
	async packetization() {
		const message = (this.isAsk) ? this.request : this.response;
		if (singlePacketMethods.test(message.method)) {
			message.end = true;
			message.pid = 0;
			this.outgoingPackets[0] = message;
		} else {
			await this.headPacketization();
			await this.dataPacketization();
			await this.buildSetupPacket();
		}
	}
	async send() {
		const thisSource = this;
		const {
			packetTemplate,
			maxPacketSize,
			sid,
			isAsk,
			isReply,
		} = this;
		const message = (isAsk) ? this.request : this.response;
		console.log(`${this.type}.send`, message);
		const awaitingResult = promise((accept) => {
			thisSource.accept = accept;
		});
		await this.packetization();
		console.log(`BASE ${this.type}`, this);
		this.sendSetup();
		return awaitingResult;
	}
	destroy = destroy;
	sendEnd = sendEnd;
	sendPacketsById = sendPacketsById;
	sendAll = sendAll;
	onPacket = onPacket;
	sendPacket = sendPacket;
	on = on;
	currentPayloadSize = 0;
	totalReceivedUniquePackets = 0;
	totalIncomingUniquePackets = 0;
	progress = 0;
	request = {};
	response = {};
	// this is the data in order may have missing packets at times but will remain in order
	data = [];
	// This is as the data came in over the wire out of order
	stream = [];
	events = {};
	header = {};
	options = {};
	outgoingSetupPacket = {
		pid: 0,
		setup: true,
	};
	outgoingDataPackets = [];
	outgoingHeadPackets = [];
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
