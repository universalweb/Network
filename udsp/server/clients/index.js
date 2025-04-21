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
	createIntro,
	intro,
	introHeader,
	sendIntro,
	setIntroFrame,
	setIntroHeader
} from './protocolEvents/intro.js';
import { end, sendEnd } from './methods/end.js';
import {
	extendedSynchronization,
	extendedSynchronizationHeader,
	sendExtendedSynchronization
} from './protocolEvents/extendedSynchronization.js';
import { fire, off, on } from './methods/events.js';
import {
	logError,
	logInfo,
	logSuccess,
	logVerbose,
	logWarning
} from '../../../utilities/classLogMethods.js';
import {
	randomBuffer,
	toHex,
} from '#utilities/cryptography/utils';
import { send, sendAny } from './methods/send.js';
import { attachProxyAddress } from './methods/attachProxyAddress.js';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import { defaultClientConnectionIdSize } from '../../client/defaults.js';
import { destroy } from './destroy.js';
import { initialize } from './initialize.js';
import { onConnected } from './methods/onConnected.js';
import { onFrame } from '#udsp/processFrame';
import { reply } from './methods/reply.js';
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
		const { certificate, } = server;
		this.server = function() {
			return server;
		};
		if (app) {
			this.app = function() {
				return app;
			};
		}
		this.socket = server.socket;
		this.certificate = certificate;
		return this.initialize(config);
	}
	destination = {
		overhead: {},
		connectionIdSize: defaultClientConnectionIdSize
	};
	async initializeSession(cipherData) {
		this.logInfo('Client Initialize session');
		if (this.keyExchange.serverInitializeSession) {
			await this.keyExchange.serverInitializeSession(this, this.destination, cipherData);
		}
		// TODO: USE NUMBERED STATES INSTEAD OF sessionInitialized BOOLEAN
		this.sessionInitialized = true;
		this.logInfo(`receiveKey: ${toHex(this.receiveKey)}`);
		this.logInfo(`transmitKey: ${toHex(this.transmitKey)}`);
	}
	setState(state) {
		if (this.destroyed || isNull(this.destroyed)) {
			return;
		}
		this.logInfo(`CLIENT State Updated -> ${this.state}`);
		this.state = state;
	}
	// NOTE: onRequest acts akin to a bubble and will bubble up to the app or server
	onRequest(req, resp) {
		const {
			app,
			server
		} = this;
		if (app) {
			return app().onRequest(req, resp);
		} else {
			return server().onRequest(req, resp);
		}
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
	attachProxyAddress = attachProxyAddress;
	send = send;
	sendAny = sendAny;
	on = on;
	off = off;
	fire = fire;
	reply = reply;
	sendEnd = sendEnd;
	end = end;
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipher, this.destination.connectionIdSize, this.destination);
	}
	setIntroHeader = setIntroHeader;
	setIntroFrame = setIntroFrame;
	introHeader = introHeader;
	intro = intro;
	createIntro = createIntro;
	sendIntro = sendIntro;
	extendedSynchronization = extendedSynchronization;
	extendedSynchronizationHeader = extendedSynchronizationHeader;
	sendExtendedSynchronization = sendExtendedSynchronization;
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
	const client = new Client(config);
	this.logInfo(`Client has been created with sever connection id ${toHex(client.id)}`);
	return client;
}
