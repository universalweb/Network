import { askRPC, replyRPC } from './rpc/rpcCodes.js';
import {
	assign,
	clear,
	clearBuffer,
	construct,
	eachArray,
	extendClass,
	hasValue,
	isBuffer,
	isPlainObject,
	isUndefined,
	objectSize,
	promise,
} from '@universalweb/utilitylib';
import { callOnDataSyncEvent, onDataSync } from './on/onDataSync.js';
import { checkSendDataReady, clearSendDataReadyTimeout, sendDataReady } from './sendReady/sendDataReady.js';
import { checkSendHeadReady, clearSendHeadReadyTimeout, sendHeadReady } from './sendReady/sendHeadReady.js';
import { checkSendParametersReady, clearSendParametersReadyTimeout, sendParametersReady } from './sendReady/sendParametersReady.js';
import { checkSendPathReady, clearSendPathReadyTimeout, sendPathReady } from './sendReady/sendPathReady.js';
import { checkSetupSent, clearSetupTimeout, sendSetup } from './send/sendSetup.js';
import { decode, encode } from '#utilities/serialize';
import { flush, flushIncoming, flushOutgoing } from './flush.js';
import { dataPacketization } from './dataPacketization.js';
import { destroy } from './destroy.js';
import eventMethods from '#udsp/events';
import logMethods from '#utilities/logs/classLogMethods';
import { onData } from './on/onData.js';
import { onDataProgress } from './onProgress/onDateProgress.js';
import { onFrame } from './on/onFrame.js';
import { onHead } from './on/onHead.js';
import { onHeadProgress } from './onProgress/onHeadProgress.js';
import { onParamatersProgress } from './onProgress/onParamatersProgress.js';
import { onParameters } from './on/onParameters.js';
import { onPath } from './on/onPath.js';
import { onPathProgress } from './onProgress/onPathProgress.js';
import { processData } from './process/processData.js';
import { processHead } from './process/processHead.js';
import { processParameters } from './process/processParameters.js';
import { processPath } from './process/processPath.js';
import { sendData } from './send/sendData.js';
import { sendEnd } from './send/sendEnd.js';
import { sendHead } from './send/sendHead.js';
import { sendParameters } from './send/sendParameters.js';
import { sendPath } from './send/sendPath.js';
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
		this.source = source;
		if (hasValue(source.latency)) {
			this.connectionLatency = source.latency;
			this.latency = this.connectionLatency + 10;
			this.latencyTimeout = this.connectionLatency;
		}
		source.lastActive = Date.now();
		this.noData = noPayloadMethods.test(this.method);
		this.setupEventEmitter();
	}
	setState(value) {
		this.state = value;
		this.logInfo(`State Set: ${value}`);
	}
	// TODO: Headers need to be an array key and value pairs which enables header keys to be any type of data consider maybe a Map or Set or WeakMap
	async setHeaders(target) {
		const source = this.isAsk ? this.request : this.response;
		if (!source.head) {
			source.head = {};
		}
		assign(source.head, target);
	}
	async setHeader(headerName, headerValue) {
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
	// TODO: Consider headers to be multiple data types pain object, array, string, buffer?
	async setHead() {
		clear(this.incomingHeadPackets);
		let head;
		if (this.incomingHead?.length) {
			const headCompiled = Buffer.concat(this.incomingHead);
			clearBuffer(this.incomingHead);
			head = await decode(headCompiled);
			headCompiled.fill(0);
			if (isUndefined(head)) {
				console.trace('Header decode failed');
				return this.destroy('Header decode failed');
			}
			if (isPlainObject(head)) {
				await this.setHeaderDetails(head);
			}
			this.logInfo('HEAD SET', head);
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
	// TODO: ADD EVENT FOR WHEN Parameters ARE COMPLETED TO RUN LOGIC BEFORE DATA ARRIVES
	async setParameters() {
		clear(this.incomingParametersPackets);
		if (this.incomingParameters?.length) {
			const parametersCompiled = Buffer.concat(this.incomingParameters);
			clearBuffer(this.incomingParameters);
			this.parameters = await decode(parametersCompiled);
			parametersCompiled.fill(0);
			if (isUndefined(this.parameters)) {
				console.trace('parameters decode failed');
				return this.destroy('parameters decode failed');
			}
			this.logInfo('Parameters SET', this.parameters);
		} else {
			this.parameters = null;
		}
		this.readyState = 2;
		this.parametersAssembled = true;
		this.sendHeadReady();
	}
	// TODO: ADD EVENT FOR WHEN PATH IS COMPLETED TO RUN LOGIC BEFORE DATA ARRIVES
	async setPath() {
		clear(this.incomingPathPackets);
		if (this.incomingPath?.length) {
			this.logInfo('Assemble Path', this.incomingPath);
			const pathCompiled = Buffer.concat(this.incomingPath);
			clearBuffer(this.incomingPath);
			this.path = await decode(pathCompiled);
			pathCompiled.fill(0);
			if (isUndefined(this.path)) {
				console.trace('path decode failed');
				return this.destroy('path decode failed');
			}
			this.logInfo('Path SET', this.path);
		} else {
			this.path = '';
		}
		this.readyState = 2;
		this.pathAssembled = true;
	}
	processState = 0;
	async pathPacketization() {
		const {
			maxFrameSize,
			isAsk,
			outgoingPathPackets,
		} = this;
		const source = this.isAsk ? this.request : this.response;
		if (!source.path || !objectSize(source.path)) {
			this.emptyPath = true;
			return;
		}
		this.logInfo('pathPacketization', source.path);
		this.outgoingPath = await encode(source.path);
		this.outgoingPathSize = this.outgoingPath.length;
		this.logInfo('outgoingPathSize', this.outgoingPathSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const outgoingPathSize = this.outgoingPathSize;
		this.logInfo('maxFrameSize', maxFrameSize);
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
		this.logInfo('outgoingPathSize', this.outgoingPathSize);
	}
	async parametersPacketization() {
		const {
			maxFrameSize,
			isAsk,
			outgoingParametersPackets,
		} = this;
		const source = this.isAsk ? this.request : this.response;
		if (!source.parameters || !objectSize(source.parameters)) {
			this.emptyParameters = true;
			return;
		}
		this.logInfo('parametersPacketization', source.parameters);
		this.outgoingParameters = await encode(source.parameters);
		this.outgoingParametersSize = this.outgoingParameters.length;
		this.logInfo('outgoingParameterSize', this.outgoingParametersSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const outgoingParametersSize = this.outgoingParametersSize;
		this.logInfo('maxFrameSize', maxFrameSize);
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
		this.logInfo('outgoingParameterSize', this.outgoingParameterSize);
	}
	async headPacketization() {
		const {
			maxFrameSize,
			isAsk,
			outgoingHeadPackets,
		} = this;
		const source = this.isAsk ? this.request : this.response;
		if (!source.head || !objectSize(source.head)) {
			this.emptyHead = true;
			this.logInfo('Empty Head');
			return;
		}
		this.logInfo('headPacketization', source.head);
		this.outgoingHead = await encode(source.head);
		this.outgoingHeadSize = this.outgoingHead.length;
		this.logInfo('outgoingHeadSize', this.outgoingHeadSize);
		let currentBytePosition = 0;
		let packetId = 0;
		const headSize = this.outgoingHeadSize;
		this.logInfo('maxFrameSize', maxFrameSize);
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
		this.logInfo('outgoingHeadSize', this.outgoingHeadSize);
	}
	async dataPacketization() {
		const {
			isAsk,
			isReply,
		} = this;
		const source = isAsk ? this.request : this.response;
		if (source.data) {
			this.outgoingData = source.data;
			if (!isBuffer(source.data)) {
				await this.setHeader('serialize');
				this.outgoingData = await encode(source.data);
			}
			this.outgoingDataSize = this.outgoingData.length;
			await this.setHeader('dataSize', this.outgoingData.length);
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
			this.logInfo('CHECKING CONNECTION');
			const connect = await this.source.connect();
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
		this.logInfo(`${this.constructor.name}.send`, message);
		const awaitingResult = promise((accept) => {
			thisSource.accept = accept;
		});
		await this.packetization();
		this.logInfo(`SENDING FROM A ${this.constructor.name}`);
		this.sendSetup();
		return awaitingResult;
	}
	async end(statusCode) {
		const {
			isAsk,
			isReply,
		} = this;
		if (isAsk) {
			this.setState(askRPC.end);
		} else {
			this.setState(replyRPC.end);
			if (statusCode) {
				await this.sendEnd();
			}
		}
		this.destroy();
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
		const { id } = this;
		const message = [
			id,
			rpc,
		];
		if (items) {
			message.push(...items);
		}
		return message;
	}
	destroy = destroy;
	onFrame = onFrame;
	async sendPacket(message, headers, footer) {
		// this.logInfo('sendPacket this.source', this.source));
		this.source.send(message, headers, footer);
	}
	flushOutgoing = flushOutgoing;
	flushIncoming = flushIncoming;
	flush = flush;
	onDataSync = onDataSync;
	callOnDataSyncEvent = callOnDataSyncEvent;
	onData = onData;
	onDataProgress = onDataProgress;
	processData = processData;
	onPath = onPath;
	onPathProgress = onPathProgress;
	processPath = processPath;
	onParameters = onParameters;
	onParamatersProgress = onParamatersProgress;
	processParameters = processParameters;
	onHead = onHead;
	onHeadProgress = onHeadProgress;
	processHead = processHead;
	sendData = sendData;
	sendHead = sendHead;
	sendParameters = sendParameters;
	sendPath = sendPath;
	sendEnd = sendEnd;
	sendDataReady = sendDataReady;
	checkSendDataReady = checkSendDataReady;
	clearSendDataReadyTimeout = clearSendDataReadyTimeout;
	sendHeadReady = sendHeadReady;
	checkSendHeadReady	= checkSendHeadReady;
	clearSendHeadReadyTimeout = clearSendHeadReadyTimeout;
	checkSendParametersReady = checkSendParametersReady;
	clearSendParametersReadyTimeout = clearSendParametersReadyTimeout;
	sendParametersReady = sendParametersReady;
	checkSendPathReady = checkSendPathReady;
	clearSendPathReadyTimeout = clearSendPathReadyTimeout;
	sendPathReady = sendPathReady;
	checkSetupSent = checkSetupSent;
	clearSetupTimeout = clearSetupTimeout;
	sendSetup = sendSetup;
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
	sentHeadCount = 0;
	dataOrdered = [];
	stream = [];
	missingPathPackets = construct(Map);
	missingParametersPackets = construct(Map);
	missingHeadPackets = construct(Map);
	missingDataPackets = construct(Map);
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
	inRequestQueue = false;
	status = 0;
	readyState = 0;
	state = 0;
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
	latency = 100;
	connectionLatency = 100;
	latencyTimeout	= 100;
	setupAttempts = 0;
	logLevel = 3;
}
extendClass(Base, logMethods);
extendClass(Base, eventMethods);
