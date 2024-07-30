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
import { encodePacket } from '#udsp/encoding/encodePacket';
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
	description = `Server's client`;
	connectionIdSize = defaultClientConnectionIdSize;
	type = 'serverClient';
	isServerClient = true;
	isServerEnd = true;
	initialize = initialize;
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
	onConnected = onConnected;
	async setSessionKeys() {
		console.log('Set session keys');
		if (this.receiveKey) {
			success(`OLD receiveKey: ${toHex(this.receiveKey)}`);
			success(`OLD transmitKey: ${toHex(this.transmitKey)}`);
		}
		await this.cipherSuite.serverSessionKeys(this, this.destination);
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
	sendEnd() {
		if (this.state === 0) {
			return;
		}
		console.log('Sending CLIENT END');
		this.updateState(0);
		return this.send([false, 1], false, null, true);
	}
	async end(frame, header) {
		console.log(`Destroying client ${this.connectionIdString}`, frame, header);
		await this.sendEnd();
		await this.destroy(0);
	}
	// CLIENT HELLO
	// Change from initialization to this for session stuff keep separate
	async introHeader(header) {
		info(`Client Intro -> - ID:${this.connectionIdString}`, header);
		const [
			connectionId,
			rpc,
			publicKey,
			clientId,
			cipherSuiteId,
			version,
			cipherSuites
		] = header;
		console.log('Client initialize Packet Header', header);
		if (publicKey) {
			success(`key: ${toHex(publicKey)}`);
			this.destination.publicKey = publicKey;
		} else {
			console.trace('Client Public Key is missing');
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
		await this.setSessionKeys();
		console.log(`CLIENT: ${toHex(clientId)}`);
		await this.calculatePacketOverhead();
		// return this.sendIntro();
	}
	async intro(frame, header) {
		info(`Client Intro -> - ID:${this.connectionIdString}`, frame, header);
		this.newKeypair = await this.cipherSuite.ephemeralServerKeypair(this);
		return this.sendIntro();
	}
	// SERVER HELLO
	// Change this to be header with no message permit message to be empty
	async sendIntro() {
		const header = [];
		const frame = [
			false,
			0,
			this.id,
			this.newKeypair.publicKey
		];
		// Change connection IP:Port to be the workers IP:Port
		const scale = this.scale;
		if (scale) {
			const changeAddress = scale.changeAddress;
			if (isTrue(changeAddress)) {
				frame[4] = true;
			}
		}
		// this.randomId
		this.updateState(1);
		if (header.length === 0) {
			return this.send(frame);
		} else {
			return this.send(frame, header);
		}
	}
	// CLIENT DISCOVERY
	async discovery(frame, header) {
		info(`Client Discovery -> - ID:${this.connectionIdString}`, frame, header);
		return this.sendDiscovery(frame, header);
	}
	// SERVER DISCOVERY
	async sendDiscovery() {
		const frame = [
			false,
			2,
			this.id,
			this.newKeypair.publicKey,
			this.randomId
		];
		this.updateState(1);
		await this.send(frame);
	}
	// PFS
	async reply(frame, header, rinfo) {
		if (this.state === 1) {
			this.updateState(2);
		}
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
	pending = false;
	state = 0;
	randomId = randomBuffer(8);
	data = construct(Map);
	requestQueue = construct(Map);
	destination = {
		overhead: {},
		connectionIdSize: defaultClientConnectionIdSize
	};
}
export async function createClient(config) {
	info('Creating Client');
	const client = await construct(Client, [config]);
	success(`Client has been created with sever connection id ${toHex(client.id)}`);
	return client;
}
