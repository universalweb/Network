// GENERAL RULES
// DEFER COMPUTE TASKS
// DEFER MEMORY TASKS
// CLEAR MEMORY AS SOON AS POSSIBLE
// PRE COMPUTE WHAT YOU CAN
import {
	UniqID,
	assign,
	construct,
	eachArray,
	hasValue,
	isArray,
	isFalse,
	isFalsy,
	isNull,
	isPromise,
	isTrue,
	isUndefined,
	promise
} from '@universalweb/acid';
import {
	clientIntroFrame,
	clientIntroHeader,
	intro,
	introHeader,
	sendIntro
} from './protocolEvents/intro.js';
import { createEvent, removeEvent, triggerEvent } from '../../events.js';
import { defaultClientConnectionIdSize, defaultServerConnectionIdSize } from '../../../defaults.js';
import { discovery, sendDiscovery } from './protocolEvents/discovery.js';
import {
	extendedHandshake,
	extendedHandshakeHeader,
	sendExtendedHandshake
} from './protocolEvents/extendedHandshake.js';
import {
	logError,
	logInfo,
	logSuccess,
	logVerbose,
	logWarning
} from '../../consoleLog.js';
import {
	randomBuffer,
	toHex,
} from '#crypto';
import { sendPacket, sendPacketIfAny } from '#udsp/sendPacket';
import { Reply } from '#udsp/request/reply';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import cluster from 'node:cluster';
import { destroy } from './destroy.js';
import { endHeaderRPC, } from '../../protocolHeaderRPCs.js';
import { endRPC, } from '../../protocolFrameRPCs.js';
import { initialize } from './initialize.js';
import { onConnected } from './onConnected.js';
import { processFrame } from '#udsp/processFrame';
/**
 * @TODO
 */
export class Client {
	constructor(config) {
		const {
			server,
			app
		} = config;
		const client = this;
		const {
			ciphers,
			signatureAlgorithm,
			certificate,
		} = server;
		this.server = function() {
			return server;
		};
		this.app = function() {
			return app;
		};
		this.socket = server.socket;
		this.ciphers = ciphers;
		this.certificate = certificate;
		return this.initialize(config);
	}
	async initializeSession(cipherData) {
		this.logInfo('Client Initialize session');
		if (this.keyExchange.serverInitializeSession) {
			await this.keyExchange.serverInitializeSession(this, this.destination, cipherData);
		}
		this.sessionInitialized = true;
		this.logInfo(`receiveKey: ${toHex(this.receiveKey)}`);
		this.logInfo(`transmitKey: ${toHex(this.transmitKey)}`);
	}
	updateState(state) {
		if (this.destroyed || isNull(this.destroyed)) {
			return;
		}
		this.logInfo(`CLIENT State Updated -> ${this.state}`);
		this.state = state;
	}
	async send(frame, headers, footer) {
		this.logInfo(`socket Sent -> ID: ${this.connectionIdString}`);
		if (this.destroyed) {
			return;
		}
		return sendPacket(frame, this, this.socket, this.destination, headers, footer);
	}
	async sendAny(frame, headers, footer) {
		this.logInfo(`socket sendPacketIfAny -> ID: ${this.connectionIdString}`);
		if (this.destroyed) {
			return;
		}
		return sendPacketIfAny(frame, this, this.socket, this.destination, headers, footer);
	}
	async authenticate(frame, headers) {
	}
	close(destroyCode) {
		this.sendEnd();
		this.destroy(destroyCode);
	}
	async destroy(destroyCode) {
		this.logInfo(`socket EVENT -> destroy - ID:${this.connectionIdString}`);
		return destroy(this, destroyCode);
	}
	updateLastActive() {
		this.lastActive = Date.now();
	}
	checkHeartbeat() {
		const lastActive = Date.now() - this.lastActive;
		if (lastActive > this.heartbeat) {
			this.close(1);
		}
	}
	initialGracePeriodCheck() {
		const source = this;
		const { initialGracePeriod } = source;
		source.initialGracePeriodTimeout = setTimeout(() => {
			const lastActive = Date.now() - source.lastActive;
			this.logInfo('Client Grace Period reached killing connection', lastActive > initialGracePeriod, source);
			if (source.state <= 1) {
				source.close(1);
			}
		}, initialGracePeriod);
	}
	clearInitialGracePeriodTimeout() {
		clearTimeout(this.initialGracePeriodTimeout);
	}
	async reply(frame, header, rinfo) {
		if (this.state === 1) {
			await this.updateState(2);
		}
		await this.updateLastActive();
		const processingFrame = await processFrame(frame, header, this, this.requestQueue);
		if (processingFrame === false) {
			const replyObject = new Reply(frame, header, this);
			this.logInfo('New reply object created', replyObject);
			if (isFalse(replyObject)) {
				this.errorLog('Reply creation failed');
				return;
			}
			replyObject.onFrame(frame, header, rinfo);
		}
	}
	sendEnd() {
		if (this.state === 0) {
			return;
		}
		this.logInfo('Sending CLIENT END');
		this.updateState(0);
		const frame = [
			false,
			endRPC
		];
		return this.send(frame, undefined, undefined, true);
	}
	async end(frame, header) {
		this.logInfo(`END RPC Destroying client ${this.connectionIdString}`, frame, header);
		await this.sendEnd();
		await this.destroy(0);
	}
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipher, this.destination.connectionIdSize, this.destination);
	}
	on(eventName, eventMethod) {
		return createEvent(this.events, eventName, eventMethod);
	}
	off(eventName, eventMethod) {
		return removeEvent(this.events, eventName, eventMethod);
	}
	fire(eventName, ...args) {
		this.logInfo(`CLIENT EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, ...args);
	}
	destination = {
		overhead: {},
		connectionIdSize: defaultClientConnectionIdSize
	};
	clientIntroHeader = clientIntroHeader;
	clientIntroFrame = clientIntroFrame;
	introHeader = introHeader;
	intro = intro;
	sendIntro = sendIntro;
	extendedHandshake = extendedHandshake;
	extendedHandshakeHeader = extendedHandshakeHeader;
	sendExtendedHandshake = sendExtendedHandshake;
	logError = logError;
	logWarning = logWarning;
	logInfo = logInfo;
	logVerbose = logVerbose;
	logSuccess = logSuccess;
	pending = false;
	state = 0;
	randomId = randomBuffer(8);
	data = construct(Map);
	requestQueue = construct(Map);
	connectionIdSize = defaultClientConnectionIdSize;
	static type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	initialize = initialize;
	onConnected = onConnected;
	initialGracePeriod = 1000;
	initialRealtimeGracePeriod = 2000;
}
export async function createClient(config) {
	this.logInfo('Creating Client');
	const client = await construct(Client, [config]);
	this.logInfo(`Client has been created with sever connection id ${toHex(client.id)}`);
	return client;
}
