import { destroy } from './destory.js';
import { dataPacketization } from './dataPacketization.js';
import { on } from './on.js';
import { flushOutgoing, flushIncoming, flush } from './flush.js';
import { onPacket } from './onPacket.js';
import {
	isBuffer, isPlainObject, isString, promise, assign,
	objectSize, eachArray, jsonParse, construct, isArray, clear, isFalse, isTrue, clearBuffer, hasValue
} from '@universalweb/acid';
import { encode, decode } from 'msgpackr';
import { request } from '#udsp/requestMethods/request';
import { toBase64 } from '#crypto';
/**
	* @todo Adjust packet size to account for other packet data.
*/
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
			maxPacketDataSize,
			maxPacketHeadSize,
			maxPacketPathSize,
			maxPacketParametersSize,
			packetMaxPayloadSafeEstimate
		} = source;
		if (events) {
			this.on(events);
		}
		if (maxPacketSize) {
			this.maxPacketSize = maxPacketSize;
		}
		if (maxPacketDataSize) {
			this.maxPacketDataSize = maxPacketDataSize;
		}
		if (maxPacketHeadSize) {
			this.maxPacketHeadSize = maxPacketHeadSize;
		}
		if (maxPacketPathSize) {
			this.maxPacketPathSize = maxPacketPathSize;
		}
		if (maxPacketParametersSize) {
			this.maxPacketParametersSize = maxPacketParametersSize;
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
	setRequestHeader(headerName, headerValue) {
		return this.setHeader(headerName, headerValue);
	}
	setHeaderDetails() {
		const { head: { dataSize } } = this;
		if (dataSize) {
			this.totalIncomingDataSize = dataSize;
		}
	}
	setHead() {
		clear(this.incomingHeadPackets);
		if (this.incomingHead?.length) {
			const headCompiled = Buffer.concat(this.incomingHead);
			clearBuffer(this.incomingHead);
			this.head = decode(headCompiled);
			headCompiled.fill(0);
			if (isPlainObject(this.head)) {
				this.setHeaderDetails();
			}
			console.log('HEAD SET', this.head);
		} else {
			this.head = {};
		}
		this.readyState = 2;
		this.headAssembled = true;
	}
	setParameters() {
		clear(this.incomingParametersPackets);
		if (this.incomingParameters?.length) {
			const parametersCompiled = Buffer.concat(this.incomingParameters);
			clearBuffer(this.incomingParameters);
			this.parameters = decode(parametersCompiled);
			parametersCompiled.fill(0);
			console.log('Parameters SET', this.parameters);
		} else {
			this.parameters = null;
		}
		this.readyState = 2;
		this.parametersAssembled = true;
	}
	setPath() {
		clear(this.incomingPathPackets);
		if (this.incomingPath?.length) {
			const pathCompiled = Buffer.concat(this.incomingPath);
			clearBuffer(this.incomingPath);
			this.path = decode(pathCompiled);
			pathCompiled.fill(0);
			console.log('Path SET', this.path);
		} else {
			this.path = '';
		}
		this.readyState = 2;
		this.pathAssembled = true;
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
	async assemblePath() {
		if (this.pathAssembled) {
			return console.log('Path already assembled');
		}
		const {
			missingPathPackets,
			incomingPath
		} = this;
		console.log('incomingPathPackets', this.incomingPathPackets);
		if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
			this.setPath();
			if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
				this.sendHeadReady();
			} else {
				this.sendParametersReady();
			}
		} else {
			eachArray(this.incomingPathPackets, (item, index) => {
				if (!item) {
					if (!missingPathPackets.has(index)) {
						missingPathPackets.set(index, true);
					}
				}
			});
		}
		console.log('incomingPath', incomingPath);
	}
	async assembleParameters() {
		if (this.parametersAssembled) {
			return console.log('Parameters already assembled');
		}
		const {
			missingParametersPackets,
			incomingParameters
		} = this;
		console.log('incomingParametersPackets', this.incomingParametersPackets);
		if (this.totalIncomingParametersSize === this.currentIncomingParametersSize) {
			this.setParameters();
			this.sendHeadReady();
		} else {
			eachArray(this.incomingParametersPackets, (item, index) => {
				if (!item) {
					if (!missingParametersPackets.has(index)) {
						missingParametersPackets.set(index, true);
					}
				}
			});
		}
		console.log('incomingParameters', incomingParameters);
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
	sendSetup() {
		const { isAsk } = this;
		if (this.state === 0) {
			this.state = 1;
		}
		const message = this.getPacketTemplate();
		if (isAsk) {
			message.setup = [this.method, this.outgoingPathSize, this.outgoingParametersSize,
				this.outgoingHeadSize];
		} else {
			message.setup = [this.outgoingHeadSize];
		}
		if (hasValue(this.outgoingDataSize)) {
			message.setup.push(this.outgoingDataSize);
		}
		this.sendPacket(message);
	}
	sendPathReady() {
		if (this.state === 1) {
			this.state = 2;
		}
		const message = this.getPacketTemplate();
		message.pathReady = true;
		this.sendPacket(message);
	}
	sendParametersReady() {
		if (this.state === 2) {
			this.state = 3;
		}
		const message = this.getPacketTemplate();
		message.parametersReady = true;
		this.sendPacket(message);
	}
	sendHeadReady() {
		if (this.state === 3) {
			this.state = 4;
		}
		const message = this.getPacketTemplate();
		message.headReady = true;
		this.sendPacket(message);
	}
	sendDataReady() {
		if (this.state === 4) {
			this.state = 5;
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
	async pathPacketization() {
		const {
			maxPacketPathSize,
			isAsk,
			outgoingPathPackets
		} = this;
		const source = (this.isAsk) ? this.request : this.response;
		console.log('pathPacketization', source.path);
		if (!source.path || !objectSize(source.path)) {
			this.emptyPath = true;
			return;
		}
		this.outgoingPath = encode(source.path);
		this.outgoingPathSize = this.outgoingPath.length;
		console.log('outgoingPathSize', source.outgoingPathSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const outgoingPathSize = this.outgoingPathSize;
		console.log('maxPacketPathSize', maxPacketPathSize);
		while (currentBytePosition < outgoingPathSize) {
			const message = this.getPacketTemplate();
			message.frame.push(packetId);
			const endIndex = currentBytePosition + maxPacketPathSize;
			const safeEndIndex = endIndex > outgoingPathSize ? outgoingPathSize : endIndex;
			message.path = this.outgoingPath.subarray(currentBytePosition, safeEndIndex);
			outgoingPathPackets[packetId] = message;
			// message.offset = safeEndIndex;
			if (safeEndIndex === outgoingPathSize) {
				message.last = true;
				break;
			}
			packetId++;
			currentBytePosition = safeEndIndex;
		}
		console.log('outgoingPathSize', source.outgoingPathSize);
	}
	async parametersPacketization() {
		const {
			maxPacketParametersSize,
			isAsk,
			outgoingParametersPackets
		} = this;
		const source = (this.isAsk) ? this.request : this.response;
		console.log('parametersPacketization', source.parameters);
		if (!source.parameters || !objectSize(source.parameters)) {
			this.emptyParameters = true;
			return;
		}
		this.outgoingParameters = encode(source.parameters);
		this.outgoingParametersSize = this.outgoingParameters.length;
		console.log('outgoingParameterSize', source.outgoingParametersSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const outgoingParametersSize = this.outgoingParametersSize;
		console.log('maxPacketParametersSize', maxPacketParametersSize);
		while (currentBytePosition < outgoingParametersSize) {
			const message = this.getPacketTemplate();
			message.frame.push(packetId);
			const endIndex = currentBytePosition + maxPacketParametersSize;
			const safeEndIndex = endIndex > outgoingParametersSize ? outgoingParametersSize : endIndex;
			message.params = this.outgoingParameter.subarray(currentBytePosition, safeEndIndex);
			outgoingParametersPackets[packetId] = message;
			// message.offset = safeEndIndex;
			if (safeEndIndex === outgoingParametersSize) {
				message.last = true;
				break;
			}
			packetId++;
			currentBytePosition = safeEndIndex;
		}
		console.log('outgoingParameterSize', source.outgoingParameterSize);
	}
	async headPacketization() {
		const {
			maxPacketHeadSize,
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
		console.log('maxPacketHeadSize', maxPacketHeadSize);
		while (currentBytePosition < headSize) {
			const message = this.getPacketTemplate();
			message.frame.push(packetId);
			const endIndex = currentBytePosition + maxPacketHeadSize;
			const safeEndIndex = endIndex > headSize ? headSize : endIndex;
			message.head = this.outgoingHead.subarray(currentBytePosition, safeEndIndex);
			outgoingHeadPackets[packetId] = message;
			// message.offset = safeEndIndex;
			if (safeEndIndex === headSize) {
				message.last = true;
				break;
			}
			packetId++;
			currentBytePosition = safeEndIndex;
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
		const { isAsk } = this;
		const message = (isAsk) ? this.request : this.response;
		await this.dataPacketization();
		await this.headPacketization();
		if (isAsk) {
			await this.pathPacketization();
			await this.parametersPacketization();
		}
	}
	async send(data) {
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
			this.readyState = 1;
		}
		this.sent = true;
		const message = (isAsk) ? this.request : this.response;
		if (data) {
			message.data = data;
		}
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
	async sendPath() {
		const thisReply = this;
		console.log('outgoingPathPackets', this.outgoingPathPackets);
		this.sendPackets(this.outgoingPathPackets);
	}
	async sendParameters() {
		const thisReply = this;
		console.log('outgoingParametersPackets', this.outgoingParametersPackets);
		this.sendPackets(this.outgoingParametersPackets);
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
			frame: [id]
		};
		return message;
	}
	toString(cache) {
		if (cache) {
			if (this.toStringCached) {
				return this.toStringCached;
			}
		}
		const target = this.data.toString();
		if (cache) {
			this.toStringCached = target;
		}
		return target;
	}
	toJSON(cache) {
		if (cache) {
			if (this.toJSONCached) {
				return this.toJSONCached;
			}
		}
		const target = jsonParse(this.data);
		if (cache) {
			this.toJSONCached = target;
		}
		return jsonParse(this.data);
	}
	serialize(cache) {
		if (cache) {
			if (this.serializeCached) {
				return this.serializeCached;
			}
		}
		const target = decode(this.data);
		if (cache) {
			this.serializeCached = target;
		}
		return target;
	}
	toObject(cache) {
		if (cache) {
			if (this.toObjectRawCached) {
				return this.toObjectRawCached;
			}
		}
		const {
			head,
			data,
			id,
			method,
		} = this;
		const target = {
			head,
			data,
			method
		};
		if (cache) {
			this.toObjectRawCached = target;
		}
		return target;
	}
	get headers() {
		return this.head;
	}
	get body() {
		return this.data;
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
	currentIncomingParametersSize = 0;
	currentIncomingPathSize = 0;
	totalReceivedUniquePackets = 0;
	totalIncomingUniquePackets = 0;
	progress = 0;
	progressHead = 0;
	progressData = 0;
	dataOrdered = [];
	stream = [];
	missingPathPackets = construct(Map);
	missingParametersPackets = construct(Map);
	missingHeadPackets = construct(Map);
	missingDataPackets = construct(Map);
	events = {};
	header = {};
	options = {};
	head = {};
	outgoingDataPackets = [];
	outgoingHeadPackets = [];
	outgoingPathPackets = [];
	outgoingParametersPackets = [];
	incomingHeadPackets = [];
	incomingHead = [];
	incomingPathPackets = [];
	incomingPath = [];
	incomingParametersPackets = [];
	incomingParameters = [];
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
	totalReceivedUniquePathPackets = 0;
	totalReceivedUniqueParametersPackets = 0;
	totalIncomingParametersSize = 0;
	// Request Specific UDSP State
	state = 0;
	handshake = false;
	inRequestQueue = false;
	status = 0;
	readyState = 0;
	parametersSize = 0;
	outgoingPathSize = 0;
	outgoingParametersSize = 0;
	outgoingHeadSize = 0;
	outgoingDataSize = 0;
	bg = 0;
}
