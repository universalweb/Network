import {
	assign,
	calcProgress,
	clear,
	clearBuffer,
	construct,
	eachArray,
	hasValue,
	isArray,
	isBuffer,
	isFalse,
	isPlainObject,
	isString,
	isTrue,
	isUndefined,
	jsonParse,
	objectSize,
	promise
} from '@universalweb/acid';
import { callOnDataSyncEvent, onDataSync } from './onDataSync.js';
import { createEvent, removeEvent, triggerEvent } from '../events.js';
import { decode, encode } from '#utilities/serialize';
import { flush, flushIncoming, flushOutgoing } from './flush.js';
import { dataPacketization } from './dataPacketization.js';
import { destroy } from './destory.js';
import { onData } from './onData.js';
import { onFrame } from './onFrame.js';
import { onHead } from './onHead.js';
import { onParameters } from './onParameters.js';
import { onPath } from './onPath.js';
import { success } from '#logs';
import { toBase64 } from '#crypto';
const noPayloadMethods = /0/;
/**
 * @todo
 * Add support for headers which indicate the headers content encoding?
 * Add convertor for serialize header so to convert their normal string names to their numerical ids.
 */
export class Base {
	constructor(source) {
		const timeStamp = Date.now();
		this.created = timeStamp;
		this.source = function() {
			return source;
		};
		source.lastActive = Date.now();
		if (this.isAsk) {
			this.handshake = source.handshake;
		}
		this.noData = noPayloadMethods.test(this.method);
	}
	setHeaders(target) {
		const source = this.isAsk ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		assign(source.head, target);
	}
	setHeader(headerName, headerValue) {
		const source = this.isAsk ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		source.head[headerName] = hasValue(headerValue) ? headerValue : 0;
	}
	setHeaderDetails(head) {
		const { dataSize } = head;
		if (dataSize) {
			this.totalIncomingDataSize = dataSize;
		}
	}
	setHead() {
		clear(this.incomingHeadPackets);
		let head;
		if (this.incomingHead?.length) {
			const headCompiled = Buffer.concat(this.incomingHead);
			clearBuffer(this.incomingHead);
			head = decode(headCompiled);
			headCompiled.fill(0);
			if (isUndefined(head)) {
				console.trace('Header decode failed');
				return this.destroy('Header decode failed');
			}
			if (isPlainObject(head)) {
				this.setHeaderDetails(head);
			}
			console.log('HEAD SET', head);
		} else {
			head = {};
		}
		if (this.isAsk) {
			this.response.head = head;
		} else {
			this.request.head = head;
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
			if (isUndefined(this.parameters)) {
				console.trace('parameters decode failed');
				return this.destroy('parameters decode failed');
			}
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
			console.log('Assemble Path', this.incomingPath);
			const pathCompiled = Buffer.concat(this.incomingPath);
			clearBuffer(this.incomingPath);
			this.path = decode(pathCompiled);
			pathCompiled.fill(0);
			if (isUndefined(this.path)) {
				console.trace('path decode failed');
				return this.destroy('path decode failed');
			}
			console.log('Path SET', this.path);
		} else {
			this.path = '';
		}
		this.readyState = 2;
		this.pathAssembled = true;
	}
	processState = 0;
	async processHead() {
		if (this.headAssembled) {
			return console.log('Head already processed');
		}
		const {
			missingHeadPackets,
			incomingHead
		} = this;
		console.log('incomingHeadPackets', this.incomingHeadPackets);
		if (this.totalIncomingHeadSize === this.currentIncomingHeadSize) {
			this.setHead();
			this.sendDataReady();
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
	async processPath() {
		if (this.pathAssembled) {
			return console.log('Path already processed');
		}
		const {
			missingPathPackets,
			incomingPath
		} = this;
		console.log('incomingPathPackets', this.incomingPathPackets);
		console.log('incomingPath', incomingPath);
		if (this.totalIncomingPathSize === this.currentIncomingPathSize) {
			this.setPath();
			this.sendParametersReady();
		} else {
			eachArray(this.incomingPathPackets, (item, index) => {
				if (!item) {
					if (!missingPathPackets.has(index)) {
						missingPathPackets.set(index, true);
					}
				}
			});
		}
	}
	async processParameters() {
		if (this.parametersAssembled) {
			return console.log('Parameters already processed');
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
	async processData() {
		console.log('Checking Data');
		const { missingDataPackets } = this;
		if (this.compiledDataAlready) {
			return true;
		}
		if (this.totalIncomingDataSize === this.currentIncomingDataSize) {
			clear(this.incomingDataPackets);
			if (this.isAsk) {
				if (this.incomingData.length) {
					this.response.dataBuffer = Buffer.concat(this.incomingData);
				}
			} else if (this.incomingData.length) {
				this.request.dataBuffer = Buffer.concat(this.incomingData);
			}
			return this.completeReceived();
		}
		eachArray(this.incomingDataPackets, (item, index) => {
			if (missingDataPackets.has(index)) {
				missingDataPackets.set(index, true);
			}
		});
		if (missingDataPackets.size !== 0) {
			console.log('Missing packets: ', missingDataPackets);
		}
	}
	sendSetup() {
		const { isAsk } = this;
		if (this.state === 0) {
			this.state = 1;
		}
		const message = this.getPacketTemplate(0);
		if (isAsk) {
			message.push(this.method, this.outgoingPathSize, this.outgoingParametersSize, this.outgoingHeadSize);
		} else {
			message.push(this.outgoingHeadSize);
		}
		if (hasValue(this.outgoingDataSize)) {
			message.push(this.outgoingDataSize);
		}
		return this.sendPacket(message);
	}
	async sendPathReady() {
		if (this.state === 1) {
			this.state = 2;
		}
		const message = this.getPacketTemplate(1);
		return this.sendPacket(message);
	}
	async sendParametersReady() {
		if (this.state === 2) {
			this.state = 3;
		}
		if (this.totalIncomingParametersSize === 0) {
			return this.sendHeadReady();
		}
		const message = this.getPacketTemplate(3);
		return this.sendPacket(message);
	}
	async sendHeadReady() {
		if (this.state === 3) {
			this.state = 4;
		}
		if (this.totalIncomingHeadSize === 0) {
			return this.sendDataReady();
		}
		const message = this.getPacketTemplate(5);
		return this.sendPacket(message);
	}
	sendDataReady() {
		if (this.state === 4) {
			this.state = 5;
		}
		if (this.isReply && this.noData) {
			return this.completeReceived();
		}
		if (this.totalIncomingDataSize === 0) {
			return this.completeReceived();
		}
		const message = this.getPacketTemplate(7);
		return this.sendPacket(message);
	}
	async sendEnd() {
		const message = this.getPacketTemplate(9);
		return this.sendPacket(message);
	}
	async pathPacketization() {
		const {
			maxFrameSize,
			isAsk,
			outgoingPathPackets
		} = this;
		const source = this.isAsk ? this.request : this.response;
		if (!source.path || !objectSize(source.path)) {
			this.emptyPath = true;
			return;
		}
		console.log('pathPacketization', source.path);
		this.outgoingPath = encode(source.path);
		this.outgoingPathSize = this.outgoingPath.length;
		console.log('outgoingPathSize', this.outgoingPathSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const outgoingPathSize = this.outgoingPathSize;
		console.log('maxFrameSize', maxFrameSize);
		while (currentBytePosition < outgoingPathSize) {
			const message = this.getPacketTemplate(2);
			message.push(packetId);
			const endIndex = currentBytePosition + maxFrameSize;
			const safeEndIndex = endIndex > outgoingPathSize ? outgoingPathSize : endIndex;
			message.push(this.outgoingPath.subarray(currentBytePosition, safeEndIndex));
			outgoingPathPackets[packetId] = message;
			// message.offset = safeEndIndex;
			if (safeEndIndex === outgoingPathSize) {
				message.push(true);
				break;
			}
			packetId++;
			currentBytePosition = safeEndIndex;
		}
		console.log('outgoingPathSize', this.outgoingPathSize);
	}
	async parametersPacketization() {
		const {
			maxFrameSize,
			isAsk,
			outgoingParametersPackets
		} = this;
		const source = this.isAsk ? this.request : this.response;
		if (!source.parameters || !objectSize(source.parameters)) {
			this.emptyParameters = true;
			return;
		}
		console.log('parametersPacketization', source.parameters);
		this.outgoingParameters = encode(source.parameters);
		this.outgoingParametersSize = this.outgoingParameters.length;
		console.log('outgoingParameterSize', this.outgoingParametersSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const outgoingParametersSize = this.outgoingParametersSize;
		console.log('maxFrameSize', maxFrameSize);
		while (currentBytePosition < outgoingParametersSize) {
			const message = this.getPacketTemplate(4);
			message.push(packetId);
			const endIndex = currentBytePosition + maxFrameSize;
			const safeEndIndex = endIndex > outgoingParametersSize ? outgoingParametersSize : endIndex;
			message.push(this.outgoingParameter.subarray(currentBytePosition, safeEndIndex));
			outgoingParametersPackets[packetId] = message;
			if (safeEndIndex === outgoingParametersSize) {
				message.push(true);
				break;
			}
			packetId++;
			currentBytePosition = safeEndIndex;
		}
		console.log('outgoingParameterSize', this.outgoingParameterSize);
	}
	async headPacketization() {
		const {
			maxFrameSize,
			isAsk,
			outgoingHeadPackets
		} = this;
		const source = this.isAsk ? this.request : this.response;
		if (!source.head || !objectSize(source.head)) {
			this.emptyHead = true;
			console.log('Empty Head');
			return;
		}
		console.log('headPacketization', source.head);
		this.outgoingHead = encode(source.head);
		this.outgoingHeadSize = this.outgoingHead.length;
		console.log('outgoingHeadSize', this.outgoingHeadSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const headSize = this.outgoingHeadSize;
		console.log('maxFrameSize', maxFrameSize);
		while (currentBytePosition < headSize) {
			const message = this.getPacketTemplate(6);
			message.push(packetId);
			const endIndex = currentBytePosition + maxFrameSize;
			const safeEndIndex = endIndex > headSize ? headSize : endIndex;
			message.push(this.outgoingHead.subarray(currentBytePosition, safeEndIndex));
			outgoingHeadPackets[packetId] = message;
			if (safeEndIndex === headSize) {
				message.push(true);
				break;
			}
			packetId++;
			currentBytePosition = safeEndIndex;
		}
		console.log('outgoingHeadSize', this.outgoingHeadSize);
	}
	async dataPacketization() {
		const {
			isAsk,
			isReply
		} = this;
		const source = isAsk ? this.request : this.response;
		if (source.data) {
			this.outgoingData = source.data;
			if (!isBuffer(source.data)) {
				this.setHeader('serialize');
				this.outgoingData = encode(source.data);
			}
			this.outgoingDataSize = this.outgoingData.length;
			this.setHeader('dataSize', this.outgoingData.length);
			await dataPacketization(this);
		}
	}
	async packetization() {
		const { isAsk } = this;
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
			console.log('CHECKING CONNECTION');
			const connect = await this.source().connect();
			if (this.sent) {
				return this.accept;
			}
			this.readyState = 1;
		}
		this.sent = true;
		const message = isAsk ? this.request : this.response;
		if (data) {
			message.data = data;
		}
		console.log(`${this.constructor.name}.send`, message);
		const awaitingResult = promise((accept) => {
			thisSource.accept = accept;
		});
		await this.packetization();
		console.log(`SENDING FROM A ${this.constructor.name}`);
		this.sendSetup();
		return awaitingResult;
	}
	async end(statusCode) {
		const {
			isAsk, isReply
		} = this;
		if (isReply) {
			if (statusCode) {
				await this.sendEnd();
				this.destroy();
			}
		}
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
	sendHeadPacketById(id) {
		const message = this.outgoingHeadPackets[id];
		return this.sendPacket(message);
	}
	sendDataPacketById(id) {
		const message = this.outgoingDataPackets[id];
		return this.sendPacket(message);
	}
	getPacketTemplate(rpc, ...items) {
		const { id, } = this;
		const message = [
			id,
			rpc
		];
		if (items) {
			message.push(...items);
		}
		return message;
	}
	on(eventName, eventMethod) {
		return createEvent(this.events, eventName, eventMethod);
	}
	off(eventName, eventMethod) {
		return removeEvent(this.events, eventName, eventMethod);
	}
	fire(eventName, ...args) {
		success(`SERVER EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, ...args);
	}
	destroy = destroy;
	onFrame = onFrame;
	async sendPacket(message, headers, footer) {
		// console.log('sendPacket this.source()', this.source());
		this.source().send(message, headers, footer);
	}
	flushOutgoing = flushOutgoing;
	flushIncoming = flushIncoming;
	flush = flush;
	onDataSync = onDataSync;
	callOnDataSyncEvent = callOnDataSyncEvent;
	onData = onData;
	onPath = onPath;
	onParameters = onParameters;
	onHead = onHead;
	onDataProgress() {
		if (this.totalIncomingDataSize) {
			if (this.currentIncomingDataSize > 0) {
				this.incomingDataProgress = calcProgress(this.totalIncomingDataSize, this.currentIncomingDataSize);
			}
			console.log(`DATA PROGRESS current:${this.currentIncomingDataSize}`, this.totalIncomingDataSize);
			console.log('Incoming Progress', this.incomingDataProgress);
		}
	}
	onHeadProgress() {
		if (this.totalIncomingHeadSize) {
			if (this.currentIncomingHeadSize > 0) {
				this.incomingHeadProgress = calcProgress(this.currentIncomingHeadSize, this.currentIncomingHeadSize);
			}
			console.log(`Head PROGRESS current:${this.currentIncomingHeadSize}`, this.currentIncomingHeadSize);
			console.log('Incoming Progress', this.incomingHeadProgress);
		}
	}
	onPathProgress() {
		if (this.totalIncomingPathSize) {
			if (this.currentIncomingPathSize > 0) {
				this.incomingPathProgress = calcProgress(this.currentIncomingPathSize, this.currentIncomingPathSize);
			}
			console.log(`Path PROGRESS current:${this.currentIncomingPathSize}`, this.currentIncomingPathSize);
			console.log('Incoming Progress', this.incomingPathProgress);
		}
	}
	onParamatersProgress() {
		if (this.totalIncomingParamatersSize) {
			if (this.currentIncomingParamatersSize > 0) {
				this.incomingParamatersProgress = calcProgress(this.currentIncomingParamatersSize, this.currentIncomingParamatersSize);
			}
			console.log(`Paramaters PROGRESS current:${this.currentIncomingParamatersSize}`, this.currentIncomingParamatersSize);
			console.log('Incoming Progress', this.incomingParamatersProgress);
		}
	}
	outgoingHead;
	outgoingData;
	incomingHeadState = false;
	incomingDataState = false;
	currentIncomingDataSize = 0;
	currentIncomingHeadSize = 0;
	currentIncomingParametersSize = 0;
	currentIncomingPathSize = 0;
	totalReceivedUniquePackets = 0;
	calcProgress = 0;
	progressHead = 0;
	progressData = 0;
	dataOrdered = [];
	stream = [];
	missingPathPackets = construct(Map);
	missingParametersPackets = construct(Map);
	missingHeadPackets = construct(Map);
	missingDataPackets = construct(Map);
	events = new Map();
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
	totalIncomingDataSize = 0;
	totalIncomingHeadSize = 0;
	totalIncomingPathSize = 0;
	totalReceivedUniqueDataPackets = 0;
	onPathCurrentId = 0;
	onParametersCurrentId = 0;
	onHeadCurrentId = 0;
	onDataCurrentId = 0;
}
