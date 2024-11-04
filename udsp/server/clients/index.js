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
	failed,
	imported,
	info,
	msgReceived,
	msgSent,
	success
} from '#logs';
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
		console.log('Client Set Session');
		await this.cipherSuite.serverSetSession(this, this.destination, cipherData);
		this.sessionCompleted = null;
		success(`receiveKey: ${toHex(this.receiveKey)}`);
		success(`transmitKey: ${toHex(this.transmitKey)}`);
	}
	// CLIENT HELLO
	// Change from initialization to this for session stuff keep separate
	async introHeader(header, packetDecoded) {
		info(`Client Intro -> - ID:${this.connectionIdString}`);
		const [
			connectionId,
			rpc,
			cipherData,
			clientId,
			cipherSuiteId,
			version,
			timeSent,
			realtimeFlag,
		] = header;
		console.log('Client initialize Packet Header', header);
		if (cipherData) {
			success(`cipherData: ${toHex(cipherData)}`);
		}
		const { certificate } = this.server();
		if (hasValue(cipherSuiteId)) {
			this.cipherSuite = certificate.getCipherSuite(cipherSuiteId);
		}
		if (!this.cipherSuite) {
			this.close();
			return false;
		}
		assign(this.destination, {
			id: clientId,
			connectionIdSize: clientId.length,
		});
		this.latency = Date.now() - timeSent;
		success(`SCID = ${this.connectionIdString} | CCID = ${toHex(clientId)} | ADDR = ${this.destination.ip}:${this.destination.port} LATENCY = ${this.latency}`);
		await this.initializeSession(cipherData);
		await this.calculatePacketOverhead();
		if (realtimeFlag === false) {
			this.realtime = false;
		}
		if (packetDecoded.noMessage) {
			console.log('Intro Packet has No message body');
			return this.sendIntro();
		}
	}
	async intro(frame, header, rinfo) {
		info(`Client Intro -> - ID:${this.connectionIdString}`);
		return this.sendIntro();
	}
	// SERVER HELLO
	async sendIntro() {
		const header = [];
		const frame = [
			false,
			introRPC,
			this.id
		];
		await this.cipherSuite.sendServerIntro(this, this.destination, frame, header);
		// Change connection IP:Port to be the workers IP:Port
		const scale = this.scale;
		if (scale) {
			const changeAddress = scale.changeAddress;
			if (isTrue(changeAddress)) {
				frame[4] = true;
			}
		}
		console.log('Sending Server Intro', frame, header);
		// this.randomId
		this.updateState(1);
		if (header.length === 0) {
			return this.send(frame);
		} else if (frame.length === 0) {
			return this.send(null, header);
		} else {
			return this.send(frame, header);
		}
	}
	async sendExtendedHandshake(header, packetDecoded) {
		const { destination } = this;
		console.log('Sending Extended Handshake');
		const extendedHandshakeFrame = await this.cipherSuite.sendServerExtendedHandshake(this, destination);
		await this.send(extendedHandshakeFrame);
	}
	async extendedHandshakeHeader(header, packetDecoded) {
		console.log('extendedHandshakeHeader CALLED');
	}
	async extendedHandshake(frame, header, rinfo) {
		console.log('Server Extended Handshake');
		const { destination } = this;
		await this.cipherSuite.serverExtendedHandshake(this, destination, frame, header);
		await this.sendExtendedHandshake(header, frame);
	}
	// CLIENT DISCOVERY
	async discovery(frame, header) {
		info(`Client Discovery -> - ID:${this.connectionIdString}`, frame, header);
		return this.sendDiscovery(frame, header);
	}
	// SERVER DISCOVERY
	async sendDiscovery() {
		const header = [
			false,
			discoveryHeaderRPC,
			this.id,
		];
		this.updateState(1);
		await this.send(null, header);
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
		console.log(`Destroying client ${this.connectionIdString}`, frame, header);
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
