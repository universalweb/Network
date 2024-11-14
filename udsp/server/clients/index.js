import {
	UniqID,
	assign,
	construct,
	eachArray,
	hasValue,
	isArray,
	isFalse,
	isFalsy,
	isPromise,
	isTrue,
	isUndefined,
	promise
} from '@universalweb/acid';
import { createEvent, removeEvent, triggerEvent } from '../../events.js';
import { defaultClientConnectionIdSize, defaultServerConnectionIdSize } from '../../../defaults.js';
import { discovery, sendDiscovery } from './protocolEvents/discovery.js';
import {
	discoveryHeaderRPC,
	endHeaderRPC,
	extendedHandshakeHeaderRPC,
	introHeaderRPC
} from '../../protocolHeaderRPCs.js';
import {
	discoveryRPC,
	endRPC,
	extendedHandshakeRPC,
	introRPC
} from '../../protocolFrameRPCs.js';
import {
	extendedHandshake,
	extendedHandshakeHeader,
	sendExtendedHandshake
} from './protocolEvents/extendedHandshake.js';
import {
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
import { intro, introHeader, sendIntro } from './protocolEvents/intro.js';
import {
	randomBuffer,
	toHex,
} from '#crypto';
import { Reply } from '#udsp/request/reply';
import { calculatePacketOverhead } from '#udsp/calculatePacketOverhead';
import cluster from 'node:cluster';
import { destroy } from './destroy.js';
import { initialize } from './initialize.js';
import { onConnected } from './onConnected.js';
import { processFrame } from '#udsp/processFrame';
import { sendPacket } from '#udsp/sendPacket';
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
			cipherSuites,
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
		this.cipherSuites = cipherSuites;
		this.certificate = certificate;
		return this.initialize(config);
	}
	async initializeSession(cipherData) {
		console.log('Client Initialize session');
		if (this.cipherSuite.serverInitializeSession) {
			await this.cipherSuite.serverInitializeSession(this, this.destination, cipherData);
		}
		success(`receiveKey: ${toHex(this.receiveKey)}`);
		success(`transmitKey: ${toHex(this.transmitKey)}`);
	}
	async setSession(cipherData) {
		console.log('Server client Set Session');
		await this.cipherSuite.serverSetSession(this, this.destination, cipherData);
		this.sessionCompleted = null;
		success(`receiveKey: ${toHex(this.receiveKey)}`);
		success(`transmitKey: ${toHex(this.transmitKey)}`);
	}
	updateState(state) {
		if (this.destroyed) {
			return;
		}
		console.log(`CLIENT State Updated -> ${this.state}`);
		this.state = state;
	}
	async send(frame, headers, footer) {
		msgSent(`socket Sent -> ID: ${this.connectionIdString}`);
		if (this.destroyed) {
			return;
		}
		return sendPacket(frame, this, this.socket, this.destination, headers, footer);
	}
	async authenticate(frame, frameHeaders) {
	}
	close(destroyCode) {
		this.sendEnd();
		this.destroy(destroyCode);
	}
	async destroy(destroyCode) {
		info(`socket EVENT -> destroy - ID:${this.connectionIdString}`);
		return destroy(this, destroyCode);
	}
	updateLastActive() {
		this.lastActive = Date.now();
	}
	checkActivity() {
		const lastActive = Date.now() - this.lastActive;
		if (lastActive > this.heartbeat) {
			this.close(1);
		}
	}
	initialGracePeriodCheck() {
		const source = this;
		const {
			initialGracePeriod,
			heartbeat
		} = source;
		source.initialGracePeriodTimeout = setTimeout(() => {
			const lastActive = Date.now() - source.lastActive;
			console.log('Client Grace Period reached killing connection', lastActive > initialGracePeriod, source);
			if (source.state <= 1 || lastActive > heartbeat) {
				source.close(1);
			}
		}, initialGracePeriod);
	}
	clearInitialGracePeriodTimeout() {
		clearTimeout(this.initialGracePeriodTimeout);
	}
	// PFS
	async reply(frame, header, rinfo) {
		if (this.state === 1) {
			this.updateState(2);
		}
		this.updateLastActive();
		const processingFrame = await processFrame(frame, header, this, this.requestQueue);
		if (processingFrame === false) {
			const replyObject = new Reply(frame, header, this);
			console.log('New reply object created', replyObject);
			if (isFalse(replyObject)) {
				failed('Reply creation failed');
				console.trace();
				return;
			}
			replyObject.onFrame(frame, header, rinfo);
		}
	}
	sendEnd() {
		if (this.state === 0) {
			return;
		}
		console.log('Sending CLIENT END');
		this.updateState(0);
		const frame = [
			false,
			endRPC
		];
		return this.send(frame, undefined, undefined, true);
	}
	async end(frame, header) {
		console.log(`END RPC Destroying client ${this.connectionIdString}`, frame, header);
		await this.sendEnd();
		await this.destroy(0);
	}
	async calculatePacketOverhead() {
		return calculatePacketOverhead(this.cipherSuite, this.destination.connectionIdSize, this.destination);
	}
	on(eventName, eventMethod) {
		return createEvent(this.events, eventName, eventMethod);
	}
	off(eventName, eventMethod) {
		return removeEvent(this.events, eventName, eventMethod);
	}
	fire(eventName, ...args) {
		success(`CLIENT EVENT -> ${eventName} - ID:${this.connectionIdString}`);
		return triggerEvent(this.events, eventName, this, ...args);
	}
	destination = {
		overhead: {},
		connectionIdSize: defaultClientConnectionIdSize
	};
	introHeader = introHeader;
	intro = intro;
	sendIntro = sendIntro;
	extendedHandshake = extendedHandshake;
	extendedHandshakeHeader = extendedHandshakeHeader;
	sendExtendedHandshake = sendExtendedHandshake;
	pending = false;
	state = 0;
	randomId = randomBuffer(8);
	data = construct(Map);
	requestQueue = construct(Map);
	connectionIdSize = defaultClientConnectionIdSize;
	static type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	sessionCompleted = false;
	initialize = initialize;
	onConnected = onConnected;
	initialGracePeriod = 1000;
	initialRealtimeGracePeriod = 2000;
}
export async function createClient(config) {
	info('Creating Client');
	const client = await construct(Client, [config]);
	success(`Client has been created with sever connection id ${toHex(client.id)}`);
	return client;
}
