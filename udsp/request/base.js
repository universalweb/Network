import { sendPacket } from './sendPacket.js';
import { destroy } from './destory.js';
import { dataPacketization } from './dataPacketization.js';
import { on } from './on.js';
import { flushOutgoing, flushIncoming, flush } from './flush.js';
import { sendPacketsById } from './sendPacketsById.js';
import { onPacket } from './onPacket.js';
import {
	isBuffer, isPlainObject, isString, promise, assign,
	objectSize, eachArray, jsonParse, construct, isArray, clear
} from '@universalweb/acid';
import { encode, decode } from 'msgpackr';
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
		source.lastActive = Date.now();
		const {
			maxPacketSize,
			maxPayloadSize,
			packetMaxPayloadSafeEstimate
		} = source;
		if (events) {
			this.on(events);
		}
		if (maxPacketSize) {
			this.maxPacketSize = maxPacketSize;
		}
		if (maxPayloadSize) {
			this.maxPayloadSize = maxPayloadSize;
		}
		if (packetMaxPayloadSafeEstimate) {
			this.packetMaxPayloadSafeEstimate = packetMaxPayloadSafeEstimate;
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
		if (this.head?.length) {
			this.head = Buffer.concat(this.head);
			this.head = decode(this.head);
		}
		this.headAssembled = true;
	}
	async assembleHead() {
		if (this.headAssembled) {
			return;
		}
		const head = this.head;
		const { missingHeadPackets } = this;
		eachArray(this.incomingHeadPackets, (item, index) => {
			if (!item) {
				if (!missingHeadPackets.has(index)) {
					missingHeadPackets.set(index, true);
				}
			}
			if (item.head && !head[index]) {
				head[index] = item.head;
			}
		});
		if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
			this.setHead();
			this.sendDataReady();
		}
	}
	async checkData() {
		const { missingDataPackets } = this;
		if (this.compiledData) {
			return;
		}
		let lastKnownEndIndex = 0;
		eachArray(this.incomingDataPackets, (item, index) => {
			if (item) {
				lastKnownEndIndex = item.endIndex;
			} else if (missingDataPackets.has(index)) {
				missingDataPackets.set(index, true);
			}
		});
		if (missingDataPackets.size !== 0) {
			console.log('Missing packets: ', missingDataPackets);
			console.log('Last known EndIndex: ', lastKnownEndIndex);
		} else if (this.head.dataSize === this.currentIncomingDataSize) {
			this.ok = true;
			this.complete();
		}
	}
	get data() {
		if (this.compiledData) {
			return this.compiledData;
		}
		const data = Buffer.concat(this.incomingDataPackets);
		if (this.head.serialization === 'struct') {
			this.data = decode(this.data);
		} else if (this.head.serialization === 'json') {
			this.data = jsonParse(this.data);
		}
		this.compiledData = data;
		return data;
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
	sendSetup() {
		if (this.state === 0) {
			this.state = 1;
		}
		const packet = this.getPacketTemplate();
		packet.setup = true;
		packet.headerSize = this.outgoingHeadSize;
		this.sendPacket(packet);
	}
	sendHeadReady() {
		if (this.state === 1) {
			this.state = 2;
		}
		const packet = this.getPacketTemplate();
		packet.headReady = true;
		this.sendPacket(packet);
	}
	sendDataReady() {
		if (this.state === 2) {
			this.state = 3;
		}
		const packet = this.getPacketTemplate();
		packet.dataReady = true;
		this.sendPacket(packet);
	}
	async sendEnd() {
		const packet = this.getPacketTemplate();
		packet.end = true;
		this.sendPacket(packet);
	}
	get headers() {
		return this.head;
	}
	get body() {
		return this.data;
	}
	buildPacket() {
		const {
			isAsk,
			isReply
		} = this;
		const message = (this.isAsk) ? this.request : this.response;
		this.outgoingHead = encode(message.head);
		this.outgoingHeadSize = this.outgoingHead.length;
	}
	async headPacketization() {
		const {
			maxHeadSize,
			id: sid,
			isAsk,
			outgoingHeadPackets
		} = this;
		const message = (this.isAsk) ? this.request : this.response;
		let currentBytePosition = 0;
		let packetId = 0;
		const headSize = this.outgoingHeadSize;
		while (currentBytePosition < this.outgoingHeadSize) {
			const packet = this.getPacketTemplate();
			packet.sid = sid;
			packet.pid = packetId;
			const endIndex = currentBytePosition + maxHeadSize;
			const safeEndIndex = endIndex > headSize ? headSize : endIndex;
			packet.head = this.outgoingHead.subarray(currentBytePosition, safeEndIndex);
			packet.headSize = packet.head.length;
			outgoingHeadPackets[packetId] = packet;
			if (safeEndIndex === headSize) {
				packet.last = true;
				break;
			}
			packetId++;
			currentBytePosition += maxHeadSize;
		}
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
				this.setHeader('serialization', 'struct');
				this.outgoingData = encode(message.data);
			}
			this.outgoingDataSize = this.outgoingData.length;
			this.setHeader('dataSize', this.outgoingData.length);
			await dataPacketization(this);
		}
	}
	async packetization() {
		const message = (this.isAsk) ? this.request : this.response;
		await this.buildPacket();
		await this.dataPacketization();
		await this.headPacketization();
	}
	async send() {
		const thisSource = this;
		const {
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
		eachArray(packetArray, (packet) => {
			thisReply.sendPacket({
				message: packet
			});
		});
	}
	toObject() {
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
	sendHeadPacketsById(id) {
		return sendPacketsById(this.outgoingHeadPackets, id);
	}
	sendDataPacketsById(id) {
		return sendPacketsById(this.outgoingDataPackets, id);
	}
	getPacketTemplate() {
		const { id, } = this;
		const packet = {
			sid: id
		};
		return packet;
	}
	destroy = destroy;
	onPacket = onPacket;
	sendPacket = sendPacket;
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
	head = [];
	dataOrdered = [];
	stream = [];
	missingHeadPackets = construct(Map);
	missingDataPackets = construct(Map);
	events = {};
	header = {};
	options = {};
	setupConfirmationPacket = {
		pid: 0,
		authorize: true,
	};
	outgoingDataPackets = [];
	outgoingHeadPackets = [];
	incomingHeadPackets = [];
	incomingDataPackets = [];
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
}
