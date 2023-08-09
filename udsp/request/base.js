import { destroy } from './destory.js';
import { dataPacketization } from './dataPacketization.js';
import { on } from './on.js';
import { flushOutgoing, flushIncoming, flush } from './flush.js';
import { onPacket } from './onPacket.js';
import {
	isBuffer, isPlainObject, isString, promise, assign,
	objectSize, eachArray, jsonParse, construct, isArray, clear, isFalse, isTrue, clearBuffer
} from '@universalweb/acid';
import { encode, decode } from 'msgpackr';
import { request } from '#udsp/request';
import { toBase64 } from '#crypto';
export class Base {
	constructor(options = {}, source) {
		const { events, } = options;
		const timeStamp = Date.now();
		this.created = timeStamp;
		this.source = function() {
			return source;
		};
		source.lastActive = Date.now();
		const {
			maxPacketSize,
			maxDataSize,
			maxHeadSize,
			packetMaxPayloadSafeEstimate
		} = source;
		if (events) {
			this.on(events);
		}
		if (maxPacketSize) {
			this.maxPacketSize = maxPacketSize;
		}
		if (maxDataSize) {
			this.maxDataSize = maxDataSize;
		}
		if (maxHeadSize) {
			this.maxHeadSize = maxHeadSize;
		}
		if (packetMaxPayloadSafeEstimate) {
			this.packetMaxPayloadSafeEstimate = packetMaxPayloadSafeEstimate;
		}
		if (this.isAsk) {
			this.handshake = source.handshake;
		}
	}
	setHeaders(target) {
		const source = (this.isAsk) ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		assign(source.head, target);
	}
	setHeader(headerName, headerValue) {
		const source = (this.isAsk) ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		source.head[headerName] = headerValue;
	}
	setHead() {
		clear(this.incomingHeadPackets);
		if (this.incomingHead?.length) {
			const headCompiled = Buffer.concat(this.incomingHead);
			clearBuffer(this.incomingHead);
			this.head = decode(headCompiled);
			headCompiled.fill(0);
			console.log('HEAD SET', this.head);
		} else {
			this.head = {};
		}
		this.headAssembled = true;
	}
	async assembleHead() {
		if (this.headAssembled) {
			return console.log('Head already assembled');
		}
		const {
			missingHeadPackets,
			incomingHead
		} = this;
		console.log('incomingHeadPackets', this.incomingHeadPackets);
		if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
			this.setHead();
			if (this.head.dataSize === this.currentIncomingDataSize) {
				this.completeReceived();
			} else {
				this.sendDataReady();
			}
		} else {
			eachArray(this.incomingHeadPackets, (item, index) => {
				if (!item) {
					if (!missingHeadPackets.has(index)) {
						missingHeadPackets.set(index, true);
					}
				}
			});
		}
		console.log('incomingHead', incomingHead);
	}
	async checkData() {
		const { missingDataPackets } = this;
		if (this.compiledDataAlready) {
			return true;
		}
		eachArray(this.incomingDataPackets, (item, index) => {
			if (missingDataPackets.has(index)) {
				missingDataPackets.set(index, true);
			}
		});
		if (missingDataPackets.size !== 0) {
			console.log('Missing packets: ', missingDataPackets);
		} else if (this.head.dataSize === this.currentIncomingDataSize) {
			this.completeReceived();
		}
	}
	get data() {
		if (this.compiledDataAlready) {
			return this.compiledData;
		}
		this.incomingDataPackets = null;
		const { head: { serialize } } = this;
		const dataConcatinated = Buffer.concat(this.incomingData);
		this.incomingData.fill(0);
		this.incomingData = null;
		if (serialize) {
			if (isTrue(serialize)) {
				this.compiledData = decode(dataConcatinated);
			} else if (serialize === 1) {
				this.compiledData = jsonParse(dataConcatinated);
			}
			dataConcatinated.fill(0);
		} else {
			this.compiledData = dataConcatinated;
		}
		this.compiledDataAlready = true;
		return this.compiledData;
	}
	toString(cache) {
		if (cache) {
			if (this.toStringCached) {
				return this.toStringCached;
			}
			this.toStringCached = this.data.toString();
			return this.toStringCached;
		}
		return this.data.toString();
	}
	toJSON(cache) {
		if (cache) {
			if (this.toJSONCached) {
				return this.toJSONCached;
			}
			this.toJSONCached = jsonParse(this.data);
			return this.toJSONCached;
		}
		return jsonParse(this.data);
	}
	serialize(cache) {
		if (cache) {
			if (this.serializeCached) {
				return this.serializeCached;
			}
			this.serializeCached = decode(this.data);
			return this.serializeCached;
		}
		return decode(this.data);
	}
	toObjectRaw() {
		const {
			head,
			data,
			sid,
			method,
		} = this;
		const target = {
			head: this.head,
			data: this.data,
			sid: this.id,
			method: this.method
		};
		return target;
	}
	toObject(cache) {
		if (cache) {
			if (this.toObjectCached) {
				return this.toObjectCached;
			}
			this.toObjectCached = this.toObjectRaw();
			return this.toObjectCached;
		}
		return this.toObjectRaw();
	}
	get headers() {
		return this.head;
	}
	get body() {
		return this.data;
	}
	sendSetup() {
		if (this.state === 0) {
			this.state = 1;
		}
		const message = this.getPacketTemplate();
		message.setup = true;
		message.headerSize = this.outgoingHeadSize;
		message.method = this.method;
		this.sendPacket(message);
	}
	sendHeadReady() {
		if (this.state === 1) {
			this.state = 2;
		}
		const message = this.getPacketTemplate();
		message.headReady = true;
		this.sendPacket(message);
	}
	sendDataReady() {
		if (this.state === 2) {
			this.state = 3;
		}
		const message = this.getPacketTemplate();
		message.dataReady = true;
		this.sendPacket(message);
	}
	async sendEnd() {
		const message = this.getPacketTemplate();
		message.end = true;
		this.sendPacket(message);
	}
	async headPacketization() {
		const {
			maxHeadSize,
			id: sid,
			isAsk,
			outgoingHeadPackets
		} = this;
		const source = (this.isAsk) ? this.request : this.response;
		console.log('headPacketization', source.head);
		this.outgoingHead = encode(source.head);
		this.outgoingHeadSize = this.outgoingHead.length;
		console.log('outgoingHeadSize', source.outgoingHeadSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const headSize = this.outgoingHeadSize;
		console.log('maxHeadSize', maxHeadSize);
		while (currentBytePosition < headSize) {
			const message = this.getPacketTemplate();
			message.pid = packetId;
			const endIndex = currentBytePosition + maxHeadSize;
			const safeEndIndex = endIndex > headSize ? headSize : endIndex;
			message.head = this.outgoingHead.subarray(currentBytePosition, safeEndIndex);
			outgoingHeadPackets[packetId] = message;
			message.index = safeEndIndex;
			if (safeEndIndex === headSize) {
				message.last = true;
				break;
			}
			packetId++;
			currentBytePosition += maxHeadSize;
		}
		console.log('outgoingHeadSize', source.outgoingHeadSize);
	}
	async dataPacketization() {
		const {
			isAsk,
			isReply
		} = this;
		const message = (isAsk) ? this.request : this.response;
		if (message.data) {
			this.outgoingData = message.data;
			if (!isBuffer(message.data)) {
				this.setHeader('serialize', true);
				this.outgoingData = encode(message.data);
			}
			this.outgoingDataSize = this.outgoingData.length;
			this.setHeader('dataSize', this.outgoingData.length);
			await dataPacketization(this);
		} else {
			this.setHeader('dataSize', 0);
		}
	}
	async packetization() {
		const message = (this.isAsk) ? this.request : this.response;
		await this.dataPacketization();
		await this.headPacketization();
	}
	async send() {
		const thisSource = this;
		if (this.compiledData) {
			if (isBuffer(this.compiledData)) {
				this.compiledData.fill(0);
			}
			this.compiledData = null;
		}
		const {
			isAsk,
			isReply,
		} = this;
		if (isAsk) {
			const handshake = await this.source().ensureHandshake();
			if (this.sent) {
				return this.accept;
			}
		}
		this.sent = true;
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
	async sendHead() {
		const thisReply = this;
		console.log('outgoingHeadPackets', this.outgoingHeadPackets);
		this.sendPackets(this.outgoingHeadPackets);
	}
	async sendData() {
		const thisReply = this;
		console.log('outgoingDataPackets', this.outgoingDataPackets);
		this.sendPackets(this.outgoingDataPackets);
	}
	sendPackets(packetArray) {
		const thisReply = this;
		eachArray(packetArray, (message) => {
			thisReply.sendPacket(message);
		});
	}
	sendHeadPacketsById(indexes) {
		const source = this.outgoingHeadPackets;
		const thisContext = this;
		eachArray(indexes, (id) => {
			thisContext.sendHeadPacketById(id, source);
		});
	}
	sendDataPacketsById(indexes) {
		const source = this.outgoingDataPackets;
		const thisContext = this;
		eachArray(indexes, (id) => {
			thisContext.sendDataPacketById(id, source);
		});
	}
	sendHeadPacketById(id, source = this.outgoingHeadPackets) {
		const message = source[id];
		this.sendPacket(message);
	}
	sendDataPacketById(id, source = this.outgoingDataPackets) {
		const message = source[id];
		this.sendPacket(message);
	}
	getPacketTemplate() {
		const { id, } = this;
		const message = {
			sid: id
		};
		return message;
	}
	destroy = destroy;
	onPacket = onPacket;
	sendPacket(message, headers, footer) {
		this.source().send(message, headers, footer);
	}
	flushOutgoing = flushOutgoing;
	flushIncoming = flushIncoming;
	flush = flush;
	on = on;
	outgoingHead;
	outgoingData;
	incomingHeadState = false;
	incomingDataState = false;
	currentIncomingDataSize = 0;
	currentIncomingHeadSize = 0;
	currentOutgoingDataSize = 0;
	totalReceivedUniquePackets = 0;
	totalIncomingUniquePackets = 0;
	progress = 0;
	dataOrdered = [];
	stream = [];
	missingHeadPackets = construct(Map);
	missingDataPackets = construct(Map);
	events = {};
	header = {};
	options = {};
	head = {};
	setupConfirmationPacket = {
		pid: 0,
		authorize: true,
	};
	outgoingDataPackets = [];
	outgoingHeadPackets = [];
	incomingHeadPackets = [];
	incomingHead = [];
	incomingDataPackets = [];
	incomingData = [];
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
	totalReceivedUniqueHeadPackets = 0;
	/* `state = 0;` is initializing the `state` property of the `Ask` class to `0`. This property is used
	to keep track of the state of the request, where `0` represents an unsent request, `1` represents a
	request that is currently being sent, and `2` represents a completed request. */
	state = 0;
	handshake = false;
	inRequestQueue = false;
	statusCode = 0;
}
